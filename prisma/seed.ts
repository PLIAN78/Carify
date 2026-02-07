import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function main() {
  await prisma.car.deleteMany();

  await prisma.car.createMany({
    data: [
        { make: "Tesla", model: "Model Y", year: 2023 },
        { make: "Tesla", model: "Model 3", year: 2022 },
        { make: "Toyota", model: "Camry", year: 2019 },
        { make: "Honda", model: "Civic", year: 2020 },
        { make: "BYD", model: "Han", year: 2022 },
        { make: "Hyundai", model: "Ioniq 5", year: 2022 },
        { make: "BYD", model: "Seal", year: 2023 },
        { make: "BYD", model: "Atto 3", year: 2022 },
        { make: "NIO", model: "ET5", year: 2023 },
        { make: "NIO", model: "ES6", year: 2022 },
        { make: "XPeng", model: "P7", year: 2023 },
        { make: "XPeng", model: "G9", year: 2023 },
        { make: "Li Auto", model: "L9", year: 2023 },
        { make: "Li Auto", model: "L8", year: 2023 },
        { make: "Volkswagen", model: "ID.4", year: 2022 },
        { make: "Volkswagen", model: "Golf", year: 2021 },
        { make: "BMW", model: "iX", year: 2023 },
        { make: "BMW", model: "i4", year: 2022 },
        { make: "Mercedes-Benz", model: "EQS", year: 2023 },
        { make: "Mercedes-Benz", model: "C-Class", year: 2021 },
        { make: "Audi", model: "e-tron GT", year: 2023 },
        { make: "Audi", model: "Q4 e-tron", year: 2022 },
        { make: "Ford", model: "Mustang Mach-E", year: 2023 },
        { make: "Ford", model: "F-150 Lightning", year: 2023 },
        { make: "Chevrolet", model: "Bolt EV", year: 2022 },
        { make: "Chevrolet", model: "Silverado", year: 2020 },
        { make: "Nissan", model: "Leaf", year: 2022 },
        { make: "Nissan", model: "Ariya", year: 2023 },
        { make: "Mazda", model: "CX-5", year: 2021 },
        { make: "Mazda", model: "MX-30", year: 2022 },
        { make: "Kia", model: "EV6", year: 2023 },
        { make: "Kia", model: "Niro EV", year: 2022 },
        { make: "Polestar", model: "2", year: 2023 },
        { make: "Volvo", model: "XC40 Recharge", year: 2022 },
        { make: "Volvo", model: "C40 Recharge", year: 2023 },
        { make: "Rivian", model: "R1T", year: 2023 },
        { make: "Rivian", model: "R1S", year: 2023 },
        { make: "Lucid", model: "Air", year: 2023 },
        { make: "Porsche", model: "Taycan", year: 2022 },
        { make: "Genesis", model: "GV60", year: 2023 },
        { make: "Genesis", model: "Electrified G80", year: 2022 },
        { make: "Subaru", model: "Solterra", year: 2023 },
        { make: "Toyota", model: "bZ4X", year: 2023 },
        { make: "Honda", model: "Accord", year: 2021 },
        { make: "Geely", model: "Geometry C", year: 2022 },
        { make: "Changan", model: "Benni EV", year: 2022 },
        { make: "GAC", model: "Aion S", year: 2023 },
        { make: "MG", model: "MG4 EV", year: 2023 },
        { make: "Renault", model: "Megane E-Tech", year: 2022 },
        { make: "Fiat", model: "500e", year: 2022 }
    ],
  });

  console.log("Cars seeded");
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
