import mongoose from "mongoose";

const ReputationSchema = new mongoose.Schema(
  {
    subjectType: { type: String, enum: ["car"], default: "car" },
    subjectId: { type: String, required: true }, // e.g., VIN, listingId, etc.
    score: { type: Number, required: true, min: 0, max: 100 },

    // Optional details the frontend can display
    breakdown: {
      safety: { type: Number, min: 0, max: 100 },
      reliability: { type: Number, min: 0, max: 100 },
      value: { type: Number, min: 0, max: 100 },
    },

    source: { type: String, default: "manual" }, // later: "solana", "scrape", etc.
  },
  { timestamps: true }
);

export const Reputation =
  mongoose.models.Reputation || mongoose.model("Reputation", ReputationSchema);
