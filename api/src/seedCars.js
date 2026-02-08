import mongoose from "mongoose";
import dotenv from "dotenv";
import { Car } from "./models/Car.js";

dotenv.config();

const cars = [
  // ===== Japanese =====
  { make: "Toyota", model: "Camry", year: 2018 },
  { make: "Toyota", model: "Corolla", year: 2020 },
  { make: "Toyota", model: "RAV4", year: 2019 },
  { make: "Honda", model: "Civic", year: 2019 },
  { make: "Honda", model: "Accord", year: 2018 },
  { make: "Honda", model: "CR-V", year: 2020 },
  { make: "Mazda", model: "Mazda3", year: 2018 },
  { make: "Mazda", model: "CX-5", year: 2020 },
  { make: "Subaru", model: "Outback", year: 2020 },

  // ===== American / EU =====
  { make: "Tesla", model: "Model 3", year: 2021 },
  { make: "Tesla", model: "Model Y", year: 2022 },
  { make: "Tesla", model: "Model S", year: 2019 },
  { make: "Ford", model: "F-150", year: 2018 },
  { make: "Ford", model: "Mustang Mach-E", year: 2021 },
  { make: "BMW", model: "3 Series", year: 2019 },
  { make: "BMW", model: "i4", year: 2022 },
  { make: "Mercedes-Benz", model: "C-Class", year: 2019 },
  { make: "Mercedes-Benz", model: "EQE", year: 2023 },
  { make: "Audi", model: "A4", year: 2019 },
  { make: "Audi", model: "Q4 e-tron", year: 2022 },
  { make: "Volkswagen", model: "ID.4", year: 2022 },

  // ===== Korean =====
  { make: "Hyundai", model: "Elantra", year: 2020 },
  { make: "Hyundai", model: "Ioniq 5", year: 2022 },
  { make: "Kia", model: "Sportage", year: 2020 },
  { make: "Kia", model: "EV6", year: 2022 },

  // ===== 🇨🇳 Chinese EVs =====
  { make: "BYD", model: "Atto 3", year: 2023 },
  { make: "BYD", model: "Seal", year: 2023 },
  { make: "BYD", model: "Han EV", year: 2022 },
  { make: "BYD", model: "Dolphin", year: 2023 },

  { make: "NIO", model: "ET5", year: 2023 },
  { make: "NIO", model: "ET7", year: 2022 },
  { make: "NIO", model: "ES6", year: 2022 },

  { make: "XPeng", model: "P7", year: 2022 },
  { make: "XPeng", model: "G9", year: 2023 },

  { make: "Li Auto", model: "L7", year: 2023 },
  { make: "Li Auto", model: "L9", year: 2022 },

  { make: "Zeekr", model: "001", year: 2022 },
  { make: "Zeekr", model: "X", year: 2023 },

  { make: "AITO", model: "M5", year: 2023 },
  { make: "AITO", model: "M7", year: 2023 },
];


async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const inserted = await Car.insertMany(cars, { ordered: false });

  console.log(`✅ Inserted ${inserted.length} cars`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
