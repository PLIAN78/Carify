import { Router } from "express";
import { Claim } from "../models/Claim.js";

const router = Router();

// GET /cars/:carId/claims
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

// GET /cars/:carId/explain (stub for now)
router.get("/:carId/explain", async (req, res) => {
  const carId = req.params.carId;
  res.json({
    explanation:
      `This explanation is a placeholder. Next, we’ll generate it from claims for carId=${carId}.`,
  });
});
// POST /cars/:carId/claims
router.post("/:carId/claims", async (req, res) => {
  try {
    const carId = req.params.carId;

    const {
      category,
      statement,
      evidenceSummary,
      evidenceUrl, // ✅ from upload
      evidence,
      contributor,
    } = req.body || {};

    // minimal validation
    if (!category || !statement || !evidenceSummary || !contributor?.type || !contributor?.displayName) {
      return res.status(400).json({ error: "Invalid claim payload" });
    }

    const claim = await Claim.create({
      carId,
      category,
      statement,
      evidenceSummary,
      evidenceUrl: typeof evidenceUrl === "string" ? evidenceUrl : "",
      evidence: evidence || {},
      contributor,
    });

    // keep your existing response shape used by frontend:
    res.status(201).json({
      claim,
      proof: {
        hash: "stub-proof-hash", // TODO: replace with real hashing / Solana tx
        solanaTx: undefined,
      },
    });
  } catch (err) {
    console.error("POST /cars/:carId/claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
