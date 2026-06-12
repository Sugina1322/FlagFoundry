const fs = require('fs/promises');
const path = require('path');

function subnetForUser(userId) {
  const numeric = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `10.${20 + (numeric % 200)}.0.0/24`;
}

async function generate({ username, userId, host = 'vpn.flagfoundry.local', port = '1194' }) {
  const template = await fs.readFile(path.join(__dirname, 'client-template.ovpn'), 'utf8');
  const config = template
    .replaceAll('{{CLIENT_NAME}}', username)
    .replaceAll('{{VPN_HOST}}', host)
    .replaceAll('{{VPN_PORT}}', port)
    .replaceAll('{{USER_SUBNET}}', subnetForUser(userId));
  const outDir = path.join(__dirname, '..', 'generated-vpn');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${username}.ovpn`);
  await fs.writeFile(outPath, config);
  return outPath;
}

if (require.main === module) {
  const [username, userId] = process.argv.slice(2);
  if (!username || !userId) {
    console.error('Usage: node vpn/generate.js <username> <userId>');
    process.exit(1);
  }
  generate({ username, userId }).then((file) => console.log(file));
}

module.exports = { generate, subnetForUser };

