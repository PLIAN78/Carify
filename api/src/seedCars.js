import mongoose from "mongoose";
import dotenv from "dotenv";
import { Car } from "./models/Car.js";

dotenv.config();

// Helper: convert filename to "/uploads/..."
const img = (filename) => `/api/uploads/cars/${filename}`;

/**
 * Upsert by (make, model, year)
 * - If car exists: update imageUrl (and any other fields you include)
 * - If missing: insert it
 *
 * NOTE: This is your original seed list, converted into "img(...)" format.
 * For cars you *don’t* have images for, leave imageUrl undefined (or remove it).
 */
const cars = [
  // ===== Japanese =====
  { make: "Toyota", model: "Camry", year: 2018, imageUrl: img("Toyota_Camry_2018.jpg") },
  { make: "Toyota", model: "Corolla", year: 2020, imageUrl: img("Toyota_Corolla_2020.jpg") },
  { make: "Toyota", model: "RAV4", year: 2019, imageUrl: img("Toyota_RAV4_2019.jpg") },

  { make: "Honda", model: "Civic", year: 2019, imageUrl: img("Honda_Civic_2019.jpg") },
  { make: "Honda", model: "Accord", year: 2018, imageUrl: img("Honda_Accord_2018.jpg") },
  { make: "Honda", model: "CR-V", year: 2020, imageUrl: img("Honda_CR-V_2020.jpg") },

  // Mazda3 existed in your old seed; if you DO have an image, add it here:
  // { make: "Mazda", model: "Mazda3", year: 2018, imageUrl: img("Mazda_Mazda3_2018.jpg") },
  { make: "Mazda", model: "Mazda3", year: 2018 }, // keeping it from your original seed
  { make: "Mazda", model: "CX-5", year: 2020, imageUrl: img("Mazda_CX-5_2020.jpg") },

  { make: "Subaru", model: "Outback", year: 2020 }, // add image if you have it

  // ===== American / EU =====
  { make: "Tesla", model: "Model 3", year: 2021, imageUrl: img("Tesla_Model-3_2021.jpg") },
  { make: "Tesla", model: "Model Y", year: 2022, imageUrl: img("Tesla_Model-Y_2022.jpg") },
  { make: "Tesla", model: "Model S", year: 2019 }, // add image if you have it

  { make: "Ford", model: "F-150", year: 2018, imageUrl: img("Ford_F-150_2018.jpg") },
  { make: "Ford", model: "Mustang Mach-E", year: 2021, imageUrl: img("Ford_Mustang-Mach-E_2021.jpg") },

  { make: "BMW", model: "3 Series", year: 2019, imageUrl: img("BMW_3-Series_2019.jpg") },
  { make: "BMW", model: "i4", year: 2022, imageUrl: img("BMW_i4_2022.png") },

  { make: "Mercedes-Benz", model: "C-Class", year: 2019, imageUrl: img("MercedesBenz_C-Class_2019.jpg") },
  { make: "Mercedes-Benz", model: "EQE", year: 2023, imageUrl: img("MercedesBenz_EQE_2023.jpg") },

  { make: "Audi", model: "A4", year: 2019 }, // add image if you have it
  { make: "Audi", model: "Q4 e-tron", year: 2022, imageUrl: img("Audi_Q4-e-tron_2022.jpg") },

  { make: "Volkswagen", model: "ID.4", year: 2022, imageUrl: img("Volkswagen_ID-4_2022.jpg") },

  // ===== Korean =====
  { make: "Hyundai", model: "Elantra", year: 2020 }, // add image if you have it
  { make: "Hyundai", model: "Ioniq 5", year: 2022, imageUrl: img("Hyundai_Ioniq-5_2022.jpg") },

  { make: "Kia", model: "Sportage", year: 2020, imageUrl: img("Kia_Sportage_2020.jpg") },
  { make: "Kia", model: "EV6", year: 2022, imageUrl: img("Kia_EV6_2022.jpg") },

  // ===== 🇨🇳 Chinese EVs =====
  { make: "BYD", model: "Atto 3", year: 2023, imageUrl: img("BYD_Atto-3_2023.jpg") },
  { make: "BYD", model: "Seal", year: 2023, imageUrl: img("BYD_Seal_2023.webp") },
  { make: "BYD", model: "Han EV", year: 2022, imageUrl: img("BYD_Han-EV_2022.webp") },
  { make: "BYD", model: "Dolphin", year: 2023, imageUrl: img("BYD_Dolphin_2023.webp") },

  { make: "NIO", model: "ET5", year: 2023, imageUrl: img("NIO_ET5_2023.webp") },
  { make: "NIO", model: "ET7", year: 2022, imageUrl: img("NIO_ET7_2022.jpeg") },
  { make: "NIO", model: "ES6", year: 2022, imageUrl: img("NIO_ES6_2022.jpg") },

  { make: "XPeng", model: "P7", year: 2022, imageUrl: img("XPeng_P7_2022.png") },
  { make: "XPeng", model: "G9", year: 2023, imageUrl: img("XPeng_G9_2023.png") },

  { make: "Li Auto", model: "L7", year: 2023, imageUrl: img("LiAuto_L7_2023.webp") },
  { make: "Li Auto", model: "L9", year: 2022, imageUrl: img("LiAuto_L9_2022.jpg") },

  { make: "Zeekr", model: "001", year: 2022, imageUrl: img("Zeekr_001_2022.jpg") },
  { make: "Zeekr", model: "X", year: 2023, imageUrl: img("Zeekr_X_2023.webp") },

  { make: "AITO", model: "M5", year: 2023, imageUrl: img("AITO_M5_2023.jpg") },
  { make: "AITO", model: "M7", year: 2023 }, // add image if you have it
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const ops = cars.map((c) => ({
    updateOne: {
      filter: { make: c.make, model: c.model, year: c.year },
      update: { $set: c },
      upsert: true,
    },
  }));

  const r = await Car.bulkWrite(ops, { ordered: false });

  console.log("✅ Seed done");
  console.log({
    matched: r.matchedCount,
    modified: r.modifiedCount,
    upserted: r.upsertedCount,
  });

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
