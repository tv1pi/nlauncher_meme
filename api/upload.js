const formidable = require('formidable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.IMGBB_API_KEY || '7c192561b25706ef42a0a85ead2304ad';
  if (!key) {
    res.status(500).json({ error: 'IMGBB_API_KEY not set' });
    return;
  }
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });
  const file = files?.image?.[0] || files?.image;
  if (!file?.filepath) {
    res.status(400).json({ error: 'No image' });
    return;
  }
  const fs = require('fs');
  const path = require('path');
  const buf = fs.readFileSync(file.filepath);
  const base64 = buf.toString('base64');
  let r;
  try {
    r = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: base64 }).toString()
    });
  } catch (e) {
    res.status(502).json({ error: 'Upload failed' });
    return;
  }
  const data = await r.json();
  if (!data?.success || !data?.data?.url) {
    res.status(502).json({ error: data?.error?.message || 'Imgbb error' });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ imageUrl: data.data.url }));
};
