require('dotenv').config({ path: process.env.ENV_FILE || '../.env' });

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  labImagePrefix: process.env.LAB_IMAGE_PREFIX || 'flagfoundry',
  vpnServerHost: process.env.VPN_SERVER_HOST || 'vpn.flagfoundry.local',
  vpnServerPort: process.env.VPN_SERVER_PORT || '1194',
};

