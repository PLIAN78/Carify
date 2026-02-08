import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// store files in api/uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype?.startsWith("image/");
    cb(ok ? null : new Error("Only image uploads are allowed"), ok);
  },
});

// POST /uploads  (form-data key: file)
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Public URL path
  res.json({ url: `/uploads/${req.file.filename}` });
});

export default router;
