// api/src/routes/uploads.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// store uploads in api/src/uploads (matches your express.static config)
const UPLOAD_DIR = path.join(process.cwd(), "src", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function safeName(name) {
  // avoid weird chars
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "file", ext);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${safeName(base)}-${unique}${safeName(ext)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10, // up to 10 attachments
  },
});

// POST /uploads  (multipart/form-data, field name: "files")
router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    }));

    res.status(201).json({ files });
  } catch (err) {
    console.error("POST /uploads failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
