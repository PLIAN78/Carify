import mongoose from "mongoose";

const CarSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number },
    imageUrl: String,
    // Optional: used for quick search
    searchText: { type: String, index: true },
  },
  { timestamps: true }
);

CarSchema.pre("save", function (next) {
  const y = this.year ? ` ${this.year}` : "";
  this.searchText = `${this.make} ${this.model}${y}`.toLowerCase();
  next();
});

export const Car = mongoose.models.Car || mongoose.model("Car", CarSchema);
