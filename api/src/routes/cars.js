import { Router } from "express";
import { Car } from "../models/Car.js";
import { Claim } from "../models/Claim.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// GET /cars
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find({}).sort({ createdAt: -1 }).limit(200);
    res.json({ cars });
  } catch (err) {
    console.error("GET /cars failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId
router.get("/:carId", async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ error: "car not found" });
    res.json({ car });
  } catch (err) {
    console.error("GET /cars/:carId failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId/claims  ✅ must be before /cars/:carId if you had conflicts elsewhere
router.get("/:carId/claims", async (req, res) => {
  try {
    const carId = req.params.carId;
    const claims = await Claim.find({ carId }).sort({ createdAt: -1 }).limit(200);
    res.json({ claims });
  } catch (err) {
    console.error("GET /cars/:carId/claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId/explain  ✅ Gemini summarizer
router.get("/:carId/explain", async (req, res) => {
  try {
    const carId = req.params.carId;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: "car not found" });

    const claims = await Claim.find({ carId }).sort({ createdAt: -1 }).limit(50);

    // If no key, fallback message so demo never crashes
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        explanation:
          "Gemini is not configured (missing GEMINI_API_KEY). Add it in api/.env to enable AI summaries.",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const claimBullets = claims.map((c, i) => {
      return `${i + 1}. [${c.category}] ${c.statement} (evidence: ${c.evidenceSummary})`;
    });

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
2) Clearly separate: (a) general knowledge expectations for this car class, and (b) what the submitted claims suggest.
3) If claims conflict, mention uncertainty.
4) Output plain text only.
`;

    const r = await model.generateContent(prompt);
    const text = r.response.text();

    res.json({ explanation: text });
  } catch (err) {
    console.error("GET /cars/:carId/explain failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
