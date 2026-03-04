const { put, get } = require('@vercel/blob');

const MEMES_PATH = 'memes.json';

function checkAuth(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  return !!secret && token === secret;
}

async function readMemes() {
  try {
    const result = await get(MEMES_PATH, { access: 'public' });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    const chunks = [];
    for await (const chunk of result.stream) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function writeMemes(list) {
  await put(MEMES_PATH, JSON.stringify(list), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

const sendJson = (res, status, obj) => {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(obj));
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const list = await readMemes();
      res.end(JSON.stringify(list));
    } catch (e) {
      res.status(500).end(JSON.stringify([]));
    }
    return;
  }

  if (req.method === 'PATCH' || req.method === 'DELETE') {
    if (!checkAuth(req)) {
      sendJson(res, 401, { error: 'Требуется авторизация' });
      return;
    }
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }
    const id = body.id;
    if (!id || typeof id !== 'string') {
      sendJson(res, 400, { error: 'id required' });
      return;
    }
    try {
      const list = await readMemes();
      const idx = list.findIndex(m => m.id === id);
      if (idx === -1) {
        sendJson(res, 404, { error: 'Пост не найден' });
        return;
      }
      if (req.method === 'DELETE') {
        list.splice(idx, 1);
        await writeMemes(list);
        sendJson(res, 200, { ok: true });
        return;
      }
      const { nickname, caption } = body;
      if (nickname !== undefined) list[idx].nickname = String(nickname).trim() || 'Аноним';
      if (caption !== undefined) list[idx].caption = String(caption).trim() || '';
      await writeMemes(list);
      sendJson(res, 200, list[idx]);
    } catch (e) {
      sendJson(res, 500, { error: 'Ошибка сохранения' });
    }
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }
  const { imageUrl, nickname, caption } = body || {};
  if (!imageUrl || typeof imageUrl !== 'string') {
    res.status(400).end(JSON.stringify({ error: 'imageUrl required' }));
    return;
  }
  const meme = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    imageUrl: imageUrl.trim(),
    nickname: (nickname && String(nickname).trim()) || 'Аноним',
    caption: (caption && String(caption).trim()) || '',
    date: new Date().toISOString()
  };
  try {
    const list = await readMemes();
    list.unshift(meme);
    await writeMemes(list);
    res.status(201).end(JSON.stringify(meme));
  } catch (e) {
    res.status(500).end(JSON.stringify({ error: 'Save failed' }));
  }
};
