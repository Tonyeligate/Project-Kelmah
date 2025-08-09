const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

exports.uploadWorkSamples = async (req, res) => {
  try {
    const files = req.files || [];
    const allowedTypes = new Set(['image/jpeg','image/png','image/gif','application/pdf']);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    for (const f of files) {
      if (!allowedTypes.has(f.mimetype)) {
        return res.status(400).json({ success: false, message: `Unsupported file type: ${f.mimetype}` });
      }
    }
    const userId = req.user?.id || 'anonymous';
    const dest = path.join(__dirname, '../../uploads', 'work-samples', userId);
    ensureDir(dest);
    const saved = [];
    for (const file of files) {
      const target = path.join(dest, file.originalname);
      fs.writeFileSync(target, file.buffer);
      saved.push({ name: file.originalname, url: `/uploads/work-samples/${userId}/${file.originalname}` });
    }
    return res.json({ success: true, data: { files: saved } });
  } catch (err) {
    console.error('uploadWorkSamples error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

exports.uploadCertificates = async (req, res) => {
  try {
    const files = req.files || [];
    const allowedTypes = new Set(['image/jpeg','image/png','image/gif','application/pdf']);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    for (const f of files) {
      if (!allowedTypes.has(f.mimetype)) {
        return res.status(400).json({ success: false, message: `Unsupported file type: ${f.mimetype}` });
      }
    }
    const userId = req.user?.id || 'anonymous';
    const dest = path.join(__dirname, '../../uploads', 'certificates', userId);
    ensureDir(dest);
    const saved = [];
    for (const file of files) {
      const target = path.join(dest, file.originalname);
      fs.writeFileSync(target, file.buffer);
      saved.push({ name: file.originalname, url: `/uploads/certificates/${userId}/${file.originalname}` });
    }
    return res.json({ success: true, data: { files: saved } });
  } catch (err) {
    console.error('uploadCertificates error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};




