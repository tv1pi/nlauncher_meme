const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

const sendJson = (res, status, obj) => {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(obj));
};

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
    const key = process.env.IMGBB_API_KEY || '7c192561b25706ef42a0a85ead2304ad';
    if (!key) {
      sendJson(res, 500, { error: 'IMGBB_API_KEY not set' });
      return;
    }
    await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    if (!req.file || !req.file.buffer) {
      sendJson(res, 400, { error: 'No image' });
      return;
    }
    const base64 = req.file.buffer.toString('base64');
    const r = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: base64 }).toString()
    });
    const data = await r.json();
    if (!data?.success || !data?.data?.url) {
      sendJson(res, 502, { error: data?.error?.message || 'Imgbb error' });
      return;
    }
    sendJson(res, 200, { imageUrl: data.data.url });
  } catch (e) {
    sendJson(res, 500, { error: 'Upload failed' });
  }
};
