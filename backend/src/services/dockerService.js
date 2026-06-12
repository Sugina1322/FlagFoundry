const Docker = require('dockerode');
const prisma = require('../prisma');
const { dockerSocket } = require('../config');
const { subnetForUser } = require('./vpnService');

const docker = new Docker({ socketPath: dockerSocket });

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 32);
}

function subnetParts(subnet) {
  const match = subnet.match(/^10\.(\d+)\.0\.0\/24$/);
  const second = match ? match[1] : '99';
  return {
    subnet: `10.${second}.0.0/24`,
    gateway: `10.${second}.0.1`,
    kaliIp: `10.${second}.0.10`,
    targetIp: `10.${second}.0.20`,
  };
}

async function ensureNetwork(user) {
  const subnet = user.vpnSubnet || subnetForUser(user.id);
  const networkName = `flagfoundry_${safeName(user.id)}_lab`;
  const existing = await docker.listNetworks({ filters: { name: [networkName] } });
  if (!existing.length) {
    const cidr = subnetParts(subnet);
    await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
      Internal: true,
      IPAM: { Config: [{ Subnet: cidr.subnet, Gateway: cidr.gateway }] },
      Labels: { 'flagfoundry.owner': user.id, 'flagfoundry.purpose': 'isolated-lab' },
    });
  }
  return { networkName, ...subnetParts(subnet) };
}

async function removeContainerIfExists(name) {
  const containers = await docker.listContainers({ all: true, filters: { name: [name] } });
  for (const item of containers) {
    const container = docker.getContainer(item.Id);
    try {
      if (item.State === 'running') await container.stop({ t: 3 });
    } catch {
      // Container may already be stopped.
    }
    await container.remove({ force: true });
  }
}

async function createLabContainer({ name, image, networkName, ip, role }) {
  await removeContainerIfExists(name);
  const isKali = role === 'kali';
  const container = await docker.createContainer({
    Image: image,
    name,
    Hostname: role,
    Tty: true,
    OpenStdin: role === 'kali',
    Labels: { 'flagfoundry.role': role },
    HostConfig: {
      NetworkMode: networkName,
      Memory: isKali ? 1024 * 1024 * 1024 : 512 * 1024 * 1024,
      NanoCpus: isKali ? 1000000000 : 500000000,
      PidsLimit: isKali ? 512 : 128,
      ReadonlyRootfs: false,
      CapDrop: isKali ? [] : ['ALL'],
      CapAdd: isKali ? ['NET_RAW', 'NET_ADMIN'] : [],
      SecurityOpt: isKali ? [] : ['no-new-privileges:true'],
      RestartPolicy: { Name: 'no' },
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [networkName]: { IPAMConfig: { IPv4Address: ip } },
      },
    },
  });
  await container.start();
  return container;
}

async function startLab(user, room) {
  const existing = await prisma.labInstance.findFirst({
    where: { userId: user.id, roomId: room.id, status: { in: ['RUNNING', 'STARTING'] } },
  });
  if (existing) return existing;

  const network = await ensureNetwork(user);
  const suffix = `${safeName(user.id)}_${safeName(room.slug)}`;
  const targetName = `flagfoundry_target_${suffix}`;
  const kaliName = `flagfoundry_kali_${safeName(user.id)}`;

  const instance = await prisma.labInstance.create({
    data: {
      userId: user.id,
      roomId: room.id,
      status: 'STARTING',
      networkName: network.networkName,
      targetName,
      kaliName,
      targetIp: network.targetIp,
      kaliIp: network.kaliIp,
    },
  });

  try {
    await createLabContainer({
      name: targetName,
      image: room.dockerImage,
      networkName: network.networkName,
      ip: network.targetIp,
      role: 'target',
    });
    await createLabContainer({
      name: kaliName,
      image: 'flagfoundry/kali:latest',
      networkName: network.networkName,
      ip: network.kaliIp,
      role: 'kali',
    });
    return prisma.labInstance.update({ where: { id: instance.id }, data: { status: 'RUNNING' } });
  } catch (error) {
    return prisma.labInstance.update({
      where: { id: instance.id },
      data: { status: 'ERROR', error: error.message },
    });
  }
}

async function stopLab(userId, instanceId) {
  const instance = await prisma.labInstance.findFirst({ where: { id: instanceId, userId } });
  if (!instance) return null;
  for (const name of [instance.targetName, instance.kaliName].filter(Boolean)) {
    await removeContainerIfExists(name);
  }
  return prisma.labInstance.update({
    where: { id: instance.id },
    data: { status: 'STOPPED', stoppedAt: new Date() },
  });
}

module.exports = { startLab, stopLab };
