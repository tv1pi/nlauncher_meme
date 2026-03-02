const { put, get } = require('@vercel/blob');

const MEMES_PATH = 'memes.json';

async function readMemes() {
  const result = await get(MEMES_PATH, { access: 'public' });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const chunks = [];
  for await (const chunk of result.stream) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf-8');
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

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
  if (req.method !== 'POST') {
    res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
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
    await put(MEMES_PATH, JSON.stringify(list), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    res.status(201).end(JSON.stringify(meme));
  } catch (e) {
    res.status(500).end(JSON.stringify({ error: 'Save failed' }));
  }
};
