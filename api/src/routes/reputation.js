import { Router } from "express";
import { Claim } from "../models/Claim.js";

const router = Router();

const CATEGORY_PENALTY = {
  reliability: 6,
  ownership_cost: 4,
  efficiency: 3,
  comfort: 2,
  safety: 5,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeCarScore(claims) {
  let score = 70;

  for (const c of claims) {
    const basePenalty = CATEGORY_PENALTY[c.category] || 2;

    let multiplier = 1;
    if (c.attachments?.length > 0) multiplier += 0.2;
    if (c.solana?.txSignature) multiplier += 0.2;

    score -= basePenalty * multiplier;
  }

  return clamp(Math.round(score), 30, 95);
}

// GET /reputation/car/:carId
router.get("/car/:carId", async (req, res) => {
  try {
    const carId = String(req.params.carId);

    const claims = await Claim.find({ carId });
    const score = computeCarScore(claims);

    res.json({
      carId,
      score,
      claimCount: claims.length,
    });
  } catch (err) {
    console.error("GET /reputation/car failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
