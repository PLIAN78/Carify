import mongoose from "mongoose";

const ClaimSchema = new mongoose.Schema(
  {
    carId: { type: String, required: true, index: true },

    category: {
      type: String,
      enum: ["reliability", "ownership_cost", "comfort", "efficiency", "safety"],
      required: true,
    },

    statement: { type: String, required: true },
    evidenceSummary: { type: String, required: true },
    evidenceUrl: { type: String, default: "" },

    evidence: {
      samples: { type: Number },
      avgMileageKm: { type: Number },
    },

    contributor: {
      type: {
        type: String,
        enum: ["owner", "mechanic", "expert"],
        required: true,
      },
      displayName: { type: String, required: true },
      wallet: { type: String },
    },

    proof: {
      hash: { type: String },
      solanaTx: { type: String },
    },
  },
  { timestamps: true }
);

export const Claim = mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);
