import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import healthRouter from "./routes/health.js";
import reputationRouter from "./routes/reputation.js";
import carsRouter from "./routes/cars.js";
import claimsRouter from "./routes/claims.js";
import carsClaimsRouter from "./routes/cars_claims.js";
import uploadsRouter from "./routes/uploads.js";

dotenv.config();

const app = express(); // ✅ app must be created BEFORE any app.use
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ simple request logger (optional but helpful)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use((req, res, next) => {
  if (req.method === "POST" && (req.url.includes("/claims") || req.url.includes("/cars/"))) {
    console.log("🔥 POST HIT:", req.method, req.url);
    console.log("🔥 BODY:", req.body);
  }
  next();
});

// ✅ routes
app.use("/health", healthRouter);
app.use("/reputation", reputationRouter);
app.use("/cars", carsRouter);
app.use("/claims", claimsRouter);
app.use("/cars", carsClaimsRouter); 
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", uploadsRouter);


// ✅ error handler MUST be after routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  console.log("🚨 STARTING BACKEND");
console.log("MONGODB_URI =", process.env.MONGODB_URI);

  await connectDB(process.env.MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
