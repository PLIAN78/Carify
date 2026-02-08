// api/src/models/Claim.js
import mongoose from "mongoose";

const ClaimSchema = new mongoose.Schema(
  {
    carId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    statement: { type: String, required: true },
    evidenceSummary: { type: String, required: true },
    evidenceUrl: { type: String, default: "" },

    attachments: [
      {
        url: { type: String, required: true }, // /uploads/xxx
        originalName: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],

    contributor: {
      type: {
        type: String,
        enum: ["owner", "mechanic", "expert"],
        required: true,
      },
      displayName: { type: String, required: true },
      wallet: { type: String, default: "" },
    },

    canonical: { type: String, required: true },
    proof: {
      hash: { type: String, required: true },
    },

    solana: {
      programId: String,
      proofPda: String,
      txSignature: String,
      nonce: Number,
      wallet: String,
    },

    nonces: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export const Claim = mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);
