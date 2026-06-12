const jwt = require('jsonwebtoken');
const pty = require('node-pty');
const Docker = require('dockerode');
const { WebSocketServer } = require('ws');
const prisma = require('./prisma');
const { jwtSecret, dockerSocket } = require('./config');

const docker = new Docker({ socketPath: dockerSocket });

function attachTerminal(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' });

  wss.on('connection', async (socket, request) => {
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const roomSlug = url.searchParams.get('room');

    try {
      const payload = jwt.verify(token, jwtSecret);
      const instance = await prisma.labInstance.findFirst({
        where: { userId: payload.sub, room: { slug: roomSlug }, status: 'RUNNING' },
      });
      if (!instance?.kaliName) throw new Error('No running Kali container for this room');

      const exec = await docker.getContainer(instance.kaliName).exec({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: ['/bin/bash'],
      });

      const stream = await exec.start({ hijack: true, stdin: true, Tty: true });
      stream.on('data', (chunk) => socket.send(chunk.toString('utf8')));
      socket.on('message', (message) => stream.write(message));
      socket.on('close', () => stream.end());
    } catch (error) {
      socket.send(`Terminal unavailable: ${error.message}\r\n`);
      const local = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: 100,
        rows: 30,
        cwd: process.cwd(),
        env: process.env,
      });
      local.write('echo "Fallback local shell. Start a lab to attach to Kali."\r\n');
      local.onData((data) => socket.send(data));
      socket.on('message', (message) => local.write(message));
      socket.on('close', () => local.kill());
    }
  });
}

module.exports = { attachTerminal };

