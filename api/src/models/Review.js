import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    carId: { type: String, required: true, index: true }, // matches your Claim.carId style
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    body: { type: String, default: "" },

    // keep it simple for now (no auth yet)
    author: {
      displayName: { type: String, default: "Anonymous" },
    },
  },
  { timestamps: true }
);

export const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
