const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const prisma = require("../src/lib/prisma");

const sportTypeNames = [
  "Football",
  "Badminton",
  "Futsal",
  "Padel",
  "Volleyball",
  "Basketball",
];

async function main() {
  for (const name of sportTypeNames) {
    await prisma.sportType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${sportTypeNames.length} sport types.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
