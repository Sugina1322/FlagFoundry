const crypto = require('crypto');

function hashFlag(value) {
  return crypto.createHash('sha256').update(String(value).trim()).digest('hex');
}

function isFlagFormat(value) {
  return /^FLAG\{[-_A-Za-z0-9:./]+\}$/.test(String(value).trim());
}

module.exports = { hashFlag, isFlagFormat };

