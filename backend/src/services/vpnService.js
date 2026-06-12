const fs = require('fs/promises');
const path = require('path');
const { vpnServerHost, vpnServerPort } = require('../config');

function subnetForUser(userId) {
  const numeric = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const octet = 20 + (numeric % 200);
  return `10.${octet}.0.0/24`;
}

async function generateClientConfig(user) {
  const templatePath = path.resolve(__dirname, '../../../vpn/client-template.ovpn');
  let template = await fs.readFile(templatePath, 'utf8');
  const subnet = user.vpnSubnet || subnetForUser(user.id);
  template = template
    .replaceAll('{{CLIENT_NAME}}', user.username)
    .replaceAll('{{VPN_HOST}}', vpnServerHost)
    .replaceAll('{{VPN_PORT}}', vpnServerPort)
    .replaceAll('{{USER_SUBNET}}', subnet);
  return { filename: `${user.username}.ovpn`, subnet, config: template };
}

module.exports = { subnetForUser, generateClientConfig };

