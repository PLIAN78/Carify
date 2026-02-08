import { Router } from "express";
import { Review } from "../models/Review.js";

const router = Router();

// GET /cars/:carId/reviews
router.get("/:carId/reviews", async (req, res) => {
  try {
    const carId = req.params.carId;
    const reviews = await Review.find({ carId })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ reviews });
  } catch (err) {
    console.error("GET /cars/:carId/reviews failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /cars/:carId/reviews
router.post("/:carId/reviews", async (req, res) => {
  try {
    const carId = req.params.carId;
    const { rating, title, body, authorDisplayName } = req.body || {};

    if (!rating) return res.status(400).json({ error: "rating is required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: "rating must be 1-5" });

    const review = await Review.create({
      carId,
      rating,
      title: title ?? "",
      body: body ?? "",
      author: { displayName: authorDisplayName ?? "Anonymous" },
    });

    res.status(201).json({ review });
  } catch (err) {
    console.error("POST /cars/:carId/reviews failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
