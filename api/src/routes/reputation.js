import { Router } from "express";
import { Reputation } from "../models/Reputation.js";

const router = Router();

// Create reputation record
router.post("/", async (req, res) => {
  try {
    const { subjectId, score, breakdown } = req.body;

    if (!subjectId || score === undefined) {
      return res.status(400).json({ error: "subjectId and score are required" });
    }

    const doc = await Reputation.create({
      subjectType: "car",
      subjectId,
      score,
      breakdown,
      source: "manual",
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get latest reputation by subjectId (e.g., VIN)
router.get("/by-subject/:subjectId", async (req, res) => {
  try {
    const doc = await Reputation.findOne({ subjectId: req.params.subjectId })
      .sort({ createdAt: -1 });

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/by-subject/:subjectId", async (req, res) => {
  try {
    const doc = await Reputation.findOne({ subjectId: req.params.subjectId })
      .sort({ createdAt: -1 });

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reputation by Mongo _id
router.get("/:id", async (req, res) => {
  try {
    const doc = await Reputation.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
