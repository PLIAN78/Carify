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

    contributor: {
      type: {
        type: String,
        enum: ["owner", "mechanic", "expert"],
        required: true,
      },
      displayName: { type: String, required: true },
      wallet: { type: String, default: "" },
    },

    canonical: { type: String, default: "" },

    proof: {
      hash: { type: String, default: "" },
    },

    solana: {
      programId: { type: String, default: "" },
      proofPda: { type: String, default: "" },
      txSignature: { type: String, default: "" },
      nonce: { type: Number, default: 0 },
      wallet: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Claim = mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);
