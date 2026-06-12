const { PrismaClient } = require('../backend/src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashFlag(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function main() {
  await prisma.user.updateMany({
    where: { email: 'admin@hackme.local' },
    data: { email: 'admin@flagfoundry.local' },
  });
  await prisma.user.updateMany({
    where: { email: 'student@hackme.local' },
    data: { email: 'student@flagfoundry.local' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@flagfoundry.local' },
    update: {
      username: 'admin',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('AdminPass123!', 12),
    },
    create: {
      email: 'admin@flagfoundry.local',
      username: 'admin',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('AdminPass123!', 12),
      points: 500,
      vpnSubnet: '10.10.0.0/24',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@flagfoundry.local' },
    update: {
      username: 'student',
      passwordHash: await bcrypt.hash('StudentPass123!', 12),
    },
    create: {
      email: 'student@flagfoundry.local',
      username: 'student',
      passwordHash: await bcrypt.hash('StudentPass123!', 12),
      points: 120,
      streak: 3,
      vpnSubnet: '10.11.0.0/24',
    },
  });

  const paths = [
    {
      slug: 'pre-security',
      title: 'Pre-Security',
      description: 'Networking, Linux basics, and the habits needed before touching exploit tooling.',
      order: 1,
    },
    {
      slug: 'web-fundamentals',
      title: 'Web Fundamentals',
      description: 'Hands-on web vulnerabilities, request inspection, and practical exploitation basics.',
      order: 2,
    },
    {
      slug: 'offensive-pentesting',
      title: 'Offensive Pentesting',
      description: 'Enumeration, footholds, privilege escalation, and report-ready methodology.',
      order: 3,
    },
  ];

  for (const path of paths) {
    await prisma.learningPath.upsert({
      where: { slug: path.slug },
      update: path,
      create: path,
    });
  }

  const preSecurity = await prisma.learningPath.findUniqueOrThrow({ where: { slug: 'pre-security' } });
  const web = await prisma.learningPath.findUniqueOrThrow({ where: { slug: 'web-fundamentals' } });
  const offensive = await prisma.learningPath.findUniqueOrThrow({ where: { slug: 'offensive-pentesting' } });

  const rooms = [
    {
      slug: 'linux-basic',
      title: 'Linux Basic Foothold',
      description: 'Enumerate SSH, identify weak credentials, and abuse a deliberately misconfigured sudo rule.',
      type: 'LINUX_FUNDAMENTALS',
      difficulty: 'EASY',
      points: 120,
      dockerImage: 'flagfoundry/linux-basic:latest',
      learningPathId: preSecurity.id,
      flag: 'FLAG{linux_basic_sudo_path}',
      tasks: [
        ['Recon the host', 'Your target IP appears in the room panel after you click **Start**. In the Kali terminal, run `nmap -sV TARGET_IP` and record the open port, service, and version.', 1],
        ['Find a foothold', 'Use SSH to connect to the target: `ssh trainee@TARGET_IP`. The training credential for this beginner room is `password123`.', 2],
        ['Escalate privileges', 'After logging in over SSH, run `sudo -l` to inspect allowed commands. The intended misconfiguration involves `vim`.', 3],
      ],
    },
    {
      slug: 'webapp-dvwa',
      title: 'Web Exploitation Playground',
      description: 'Practice SQL injection, reflected XSS, and local file inclusion in a tiny intentionally unsafe web app.',
      type: 'WEB_EXPLOITATION',
      difficulty: 'MEDIUM',
      points: 180,
      dockerImage: 'flagfoundry/webapp-dvwa:latest',
      learningPathId: web.id,
      flag: 'FLAG{web_stack_triple_threat}',
      tasks: [
        ['Map the app', 'After starting the room, visit `http://TARGET_IP` from the Kali terminal with `curl http://TARGET_IP` or browse it if you expose a browser path later.', 1],
        ['Exploit injection', 'Try the example link containing `id=1 OR 1=1` and compare the output with a normal lookup.', 2],
        ['Read local files', 'Use the file viewer route shown on the page to read the hidden flag file.', 3],
      ],
    },
    {
      slug: 'privesc-box',
      title: 'Privilege Escalation Box',
      description: 'Move from a constrained user to root through SUID binaries and writable scheduled jobs.',
      type: 'PRIVILEGE_ESCALATION',
      difficulty: 'MEDIUM',
      points: 200,
      dockerImage: 'flagfoundry/privesc-box:latest',
      learningPathId: offensive.id,
      flag: 'FLAG{cron_and_suid_checked}',
      tasks: [
        ['Local enumeration', 'List unusual SUID binaries and writable cron paths.', 1],
        ['Abuse a scheduled task', 'Use writable maintenance scripts to gain elevated execution.', 2],
        ['Capture root', 'Read the final flag from the privileged location.', 3],
      ],
    },
    {
      slug: 'legacy-service',
      title: 'Legacy Service Enumeration',
      description: 'Safely practice detecting legacy service exposure in an isolated training container.',
      type: 'CTF_CHALLENGE',
      difficulty: 'HARD',
      points: 250,
      dockerImage: 'flagfoundry/metasploitable-lite:latest',
      learningPathId: offensive.id,
      flag: 'FLAG{legacy_services_are_loud}',
      tasks: [
        ['Enumerate services', 'Identify outdated network services and capture versions.', 1],
        ['Validate exposure', 'Confirm the intended vulnerable service without touching public infrastructure.', 2],
        ['Document risk', 'Submit the flag and write a short remediation note.', 3],
      ],
    },
    {
      slug: 'web-login-bypass',
      title: 'Login Bypass Basics',
      description: 'Practice testing a deliberately unsafe login form and learn why string-built queries are dangerous.',
      type: 'WEB_EXPLOITATION',
      difficulty: 'EASY',
      points: 140,
      dockerImage: 'flagfoundry/web-login-bypass:latest',
      learningPathId: web.id,
      flag: 'FLAG{auth_bypass_is_not_auth}',
      tasks: [
        ['Find the login form', 'After starting the room, scan the target with `nmap -sV TARGET_IP`, then request the web page with `curl http://TARGET_IP`.', 1],
        ['Bypass authentication', "Try a classic SQL-style login payload in the username field: `admin' OR '1'='1`.", 2],
        ['Capture the flag', 'Read the flag shown after bypassing the login and submit it in the room.', 3],
      ],
    },
    {
      slug: 'file-permissions',
      title: 'Linux File Permissions',
      description: 'Learn basic Linux enumeration by finding world-readable secrets and understanding permission bits.',
      type: 'LINUX_FUNDAMENTALS',
      difficulty: 'EASY',
      points: 110,
      dockerImage: 'flagfoundry/file-permissions:latest',
      learningPathId: preSecurity.id,
      flag: 'FLAG{permissions_tell_stories}',
      tasks: [
        ['Connect to SSH', 'After starting the room, use `ssh learner@TARGET_IP` with password `learner`.', 1],
        ['Inspect permissions', 'Run `find / -name "*flag*" -o -name "*secret*" 2>/dev/null` and inspect readable files.', 2],
        ['Read the flag', 'Use `ls -l` and `cat` to understand why the secret file is readable.', 3],
      ],
    },
    {
      slug: 'cron-misconfig',
      title: 'Writable Cron Misconfiguration',
      description: 'Exploit a writable maintenance script executed by cron to recover a privileged flag.',
      type: 'PRIVILEGE_ESCALATION',
      difficulty: 'MEDIUM',
      points: 190,
      dockerImage: 'flagfoundry/cron-misconfig:latest',
      learningPathId: offensive.id,
      flag: 'FLAG{cron_paths_need_owners}',
      tasks: [
        ['Initial access', 'SSH into the target with `ssh intern@TARGET_IP` and password `intern`.', 1],
        ['Find scheduled work', 'Inspect `/etc/cron.d` and writable scripts under `/opt`.', 2],
        ['Recover the flag', 'Modify the writable script so cron copies the root flag to a readable location.', 3],
      ],
    },
    {
      slug: 'api-idOR',
      title: 'API IDOR Challenge',
      description: 'Discover an insecure direct object reference in a tiny JSON API.',
      type: 'WEB_EXPLOITATION',
      difficulty: 'MEDIUM',
      points: 170,
      dockerImage: 'flagfoundry/api-idor:latest',
      learningPathId: web.id,
      flag: 'FLAG{object_ids_are_not_acl}',
      tasks: [
        ['Map the API', 'Run `curl http://TARGET_IP` and inspect the listed API routes.', 1],
        ['Change object IDs', 'Request `/api/profile/1`, `/api/profile/2`, and `/api/profile/3` and compare the data.', 2],
        ['Submit the admin flag', 'Find the profile object that leaks a flag and submit it.', 3],
      ],
    },
  ];

  for (const room of rooms) {
    const { tasks, flag, ...data } = room;
    const upserted = await prisma.room.upsert({
      where: { slug: room.slug },
      update: data,
      create: data,
    });

    await prisma.task.deleteMany({ where: { roomId: upserted.id } });
    await prisma.flag.deleteMany({ where: { roomId: upserted.id } });

    for (const [title, body, order] of tasks) {
      const task = await prisma.task.create({
        data: {
          roomId: upserted.id,
          title,
          body,
          order,
          points: 10,
          hints: {
            create: [
              { order: 1, cost: 5, body: 'Start with enumeration and write down exact versions.' },
              { order: 2, cost: 10, body: 'The intended path is visible from normal user permissions inside the lab.' },
            ],
          },
        },
      });
      void task;
    }

    await prisma.flag.create({
      data: {
        roomId: upserted.id,
        label: 'Root flag',
        valueHash: hashFlag(flag),
        points: room.points,
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
