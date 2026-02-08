// api/src/routes/cars_claims.js
import { Router } from "express";
import { Claim } from "../models/Claim.js";

const router = Router();

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

// 🚫 Deprecated: creating claims here causes ghost claims
router.post("/:carId/claims", async (req, res) => {
  return res.status(410).json({
    error:
      "This endpoint is deprecated. Use POST /claims with { carId: <mongoId>, ... } instead.",
  });
});

export default router;
