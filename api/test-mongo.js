import mongoose from "mongoose";
import "dotenv/config";

async function test() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
    console.log("DB:", mongoose.connection.name);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Mongo connection failed:", err.message);
    process.exit(1);
  }
}

test();
