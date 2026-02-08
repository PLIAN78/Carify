import { Router } from "express";
import { Review } from "../models/Review.js";
import { Claim } from "../models/Claim.js";

const router = Router();

// GET /cars/:carId/score
router.get("/:carId/score", async (req, res) => {
  try {
    const carId = req.params.carId;

    const reviews = await Review.find({ carId });
    const claims = await Claim.find({ carId });

    const avgRating =
      reviews.reduce((s, r) => s + (r.rating || 0), 0) / (reviews.length || 1);

    // You don’t have verified/rejected yet in Claim schema,
    // so we score based on claim count + evidence richness.
    const claimCount = claims.length;
    const evidenceBonus = claims.reduce((s, c) => {
      const samples = c?.evidence?.samples ?? 0;
      return s + Math.min(samples, 10); // cap
    }, 0);

    const ratingPart = (avgRating / 5) * 70; // 0–70
    const claimPart = Math.min(claimCount * 5, 20); // 0–20
    const evidencePart = Math.min(evidenceBonus * 1, 10); // 0–10

    const trustScore = Math.max(
      0,
      Math.min(100, ratingPart + claimPart + evidencePart)
    );

    res.json({
      trustScore,
      breakdown: { ratingPart, claimPart, evidencePart, avgRating, claimCount },
    });
  } catch (err) {
    console.error("GET /cars/:carId/score failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
