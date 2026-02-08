import { Router } from "express";
import { Car } from "../models/Car.js";
import { Claim } from "../models/Claim.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

function toCarDTO(doc) {
  return {
    carId: String(doc._id),
    make: doc.make,
    model: doc.model,
    year: doc.year,
    imageUrl: doc.imageUrl,
  };
}

function devErrorPayload(err) {
  // show more info in development to debug faster
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return { error: "Internal server error" };

  return {
    error: "Gemini request failed",
    message: err?.message || String(err),
    name: err?.name,
    stack: err?.stack,
  };
}

// GET /cars
router.get("/", async (req, res) => {
  try {
    const docs = await Car.find({}).sort({ createdAt: -1 }).limit(200);
    res.json({ cars: docs.map(toCarDTO) });
  } catch (err) {
    console.error("GET /cars failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId
router.get("/:carId", async (req, res) => {
  try {
    const doc = await Car.findById(req.params.carId);
    if (!doc) return res.status(404).json({ error: "car not found" });
    res.json({ car: toCarDTO(doc) });
  } catch (err) {
    console.error("GET /cars/:carId failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId/claims
router.get("/:carId/claims", async (req, res) => {
  try {
    const carId = String(req.params.carId);
    const claims = await Claim.find({ carId }).sort({ createdAt: -1 }).limit(200);
    res.json({ claims });
  } catch (err) {
    console.error("GET /cars/:carId/claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId/explain  (Gemini)
router.get("/:carId/explain", async (req, res) => {
  try {
    const carId = String(req.params.carId);

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: "car not found" });

    const claims = await Claim.find({ carId }).sort({ createdAt: -1 }).limit(50);

    const key = String(process.env.GEMINI_API_KEY || "").trim();
    if (!key) {
      return res.status(400).json({
        error:
          "GEMINI_API_KEY is missing. Put it in api/.env and restart the backend.",
      });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const claimBullets = claims.map(
      (c, i) => `${i + 1}. [${c.category}] ${c.statement} (evidence: ${c.evidenceSummary})`
    );

    const prompt = `
You are an automotive analyst for a hackathon demo.

Car:
- Year: ${car.year}
- Make: ${car.make}
- Model: ${car.model}

User claims (may be biased; treat as anecdotal evidence):
${claimBullets.length ? claimBullets.join("\n") : "(No claims yet)"}

Task:
1) Write a concise, neutral summary (4-7 sentences) of what a buyer should know.
2) Clearly separate: (a) general expectations for this class, (b) what submitted claims suggest.
3) If claims conflict, mention uncertainty.
4) Output plain text only.
`;

    const r = await model.generateContent(prompt);
    res.json({ explanation: r.response.text() });
  } catch (err) {
    console.error("GET /cars/:carId/explain failed:", err);
    res.status(502).json(devErrorPayload(err));
  }
});

export default router;
