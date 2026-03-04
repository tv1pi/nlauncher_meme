const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'memes.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// На Vercel файловая система только для чтения — не создаём папки (лента в Blob через api/memes.js)
if (!process.env.VERCEL) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
  } catch (e) { /* игнор при отсутствии прав */ }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  }
});
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

function readMemes() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeMemes(memes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memes, null, 2), 'utf8');
}

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'tv1p';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '06ebb7b2';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;

function adminAuth(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token && token === ADMIN_TOKEN) return next();
  res.status(401).json({ error: 'Требуется авторизация' });
}

app.post('/api/auth', (req, res) => {
  const { username, password: pw } = req.body || {};
  if (String(username || '').trim() !== ADMIN_LOGIN || String(pw || '') !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  res.json({ ok: true, token: ADMIN_TOKEN, username: ADMIN_LOGIN });
});

app.get('/api/memes', (req, res) => {
  const memes = readMemes();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json(memes.map(m => ({
    ...m,
    imageUrl: m.imageUrl.startsWith('http') ? m.imageUrl : `${baseUrl}${m.imageUrl.startsWith('/') ? '' : '/'}${m.imageUrl}`
  })));
});

app.post('/api/upload', uploadMemory.single('image'), async (req, res) => {
  const key = process.env.IMGBB_API_KEY || '7c192561b25706ef42a0a85ead2304ad';
  if (!key) return res.status(500).json({ error: 'IMGBB_API_KEY not set' });
  if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No image' });
  const base64 = req.file.buffer.toString('base64');
  try {
    const r = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: base64 }).toString()
    });
    const data = await r.json();
    if (!data?.success || !data?.data?.url) return res.status(502).json({ error: data?.error?.message || 'Imgbb error' });
    res.json({ imageUrl: data.data.url });
  } catch (e) {
    res.status(502).json({ error: 'Upload failed' });
  }
});

app.post('/api/memes', (req, res, next) => {
  if (req.is('application/json') && req.body?.imageUrl) {
    const { imageUrl, nickname, caption } = req.body;
    const meme = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      imageUrl: String(imageUrl).trim(),
      nickname: (nickname && String(nickname).trim()) || 'Аноним',
      caption: (caption && String(caption).trim()) || '',
      date: new Date().toISOString()
    };
    const memes = readMemes();
    memes.unshift(meme);
    writeMemes(memes);
    return res.status(201).json(meme);
  }
  next();
}, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Нужна картинка' });
  const nickname = (req.body.nickname || '').trim() || 'Аноним';
  const caption = (req.body.caption || '').trim();
  const meme = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    imageUrl: '/uploads/' + req.file.filename,
    nickname,
    caption,
    date: new Date().toISOString()
  };
  const memes = readMemes();
  memes.unshift(meme);
  writeMemes(memes);
  res.redirect('/');
});

app.patch('/api/memes', adminAuth, (req, res) => {
  const { id, nickname, caption } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  const memes = readMemes();
  const idx = memes.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Пост не найден' });
  if (nickname !== undefined) memes[idx].nickname = String(nickname).trim() || 'Аноним';
  if (caption !== undefined) memes[idx].caption = String(caption).trim() || '';
  writeMemes(memes);
  res.json(memes[idx]);
});

app.delete('/api/memes', adminAuth, (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  const memes = readMemes();
  const idx = memes.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Пост не найден' });
  memes.splice(idx, 1);
  writeMemes(memes);
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => console.log(`Memesite: http://localhost:${PORT}`));
