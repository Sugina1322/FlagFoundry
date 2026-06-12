const http = require('http');

const profiles = {
  1: { id: 1, username: 'student', role: 'user', note: 'Keep learning.' },
  2: { id: 2, username: 'analyst', role: 'user', note: 'Nothing sensitive here.' },
  3: { id: 3, username: 'admin', role: 'admin', flag: 'FLAG{object_ids_are_not_acl}' },
};

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body, null, 2) : body);
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://target');
  if (url.pathname === '/') {
    return send(res, 200, [
      'API IDOR Challenge',
      'Routes:',
      'GET /api/profile/1',
      'GET /api/profile/2',
      'GET /api/profile/3',
    ].join('\n'), 'text/plain');
  }

  const match = url.pathname.match(/^\/api\/profile\/(\d+)$/);
  if (match) {
    const profile = profiles[match[1]];
    if (!profile) return send(res, 404, { error: 'Profile not found' });
    // Intentional training vulnerability: no authorization check per object ID.
    return send(res, 200, profile);
  }

  return send(res, 404, { error: 'Not found' });
}).listen(80, '0.0.0.0');

