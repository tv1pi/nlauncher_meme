const sendJson = (res, status, obj) => {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(obj));
};

function checkAuth(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  return !!secret && token === secret;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }
  const login = process.env.ADMIN_LOGIN || 'tv1p';
  const password = process.env.ADMIN_PASSWORD || '06ebb7b2';
  const token = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || password;
  const { username, password: pw } = body;
  if (String(username || '').trim() !== login || String(pw || '') !== password) {
    sendJson(res, 401, { error: 'Неверный логин или пароль' });
    return;
  }
  sendJson(res, 200, { ok: true, token, username: login });
};

module.exports.checkAuth = checkAuth;
