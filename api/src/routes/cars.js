import { Router } from "express";
import { Car } from "../models/Car.js";

const router = Router();

function mapCar(doc) {
  return {
    carId: String(doc._id),
    make: doc.make,
    model: doc.model,
    year: doc.year,
    imageUrl: doc.imageUrl || "",
  };
}

// GET /cars?q=camry
// GET /cars?q=camry
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const filter = q
      ? { $or: [{ make: { $regex: q, $options: "i" } }, { model: { $regex: q, $options: "i" } }] }
      : {};

    const docs = await Car.find(filter).limit(50).sort({ createdAt: -1 });

    const cars = docs.map((c) => ({
      carId: String(c._id),
      make: c.make,
      model: c.model,
      year: c.year,
      imageUrl: c.imageUrl || "",   // ✅ ADD THIS
    }));

    res.json({ cars });
  } catch (err) {
    console.error("GET /cars failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cars/:carId
router.get("/:carId", async (req, res) => {
  try {
    const doc = await Car.findById(req.params.carId);
    if (!doc) return res.status(404).json({ error: "Not found" });

    const car = {
      carId: String(doc._id),
      make: doc.make,
      model: doc.model,
      year: doc.year,
      imageUrl: doc.imageUrl || "", // ✅ ADD THIS
    };

    res.json({ car });
  } catch (err) {
    res.status(400).json({ error: "Invalid carId" });
  }
});


// PATCH /cars/:carId/image { imageUrl: "/uploads/xxx.jpg" OR "https://..." }
router.patch("/:carId/image", async (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl required" });
    }

    const car = await Car.findByIdAndUpdate(
      req.params.carId,
      { imageUrl: imageUrl.trim() },
      { new: true }
    );

    if (!car) return res.status(404).json({ error: "Car not found" });

    res.json({ car: mapCar(car) });
  } catch {
    res.status(400).json({ error: "Invalid carId" });
  }
});

export default router;
