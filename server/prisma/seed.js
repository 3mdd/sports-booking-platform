const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const bcrypt = require("bcrypt");
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

  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@elitesport.test",
    },
    update: {
      fullName: "EliteSport Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      fullName: "EliteSport Admin",
      email: "admin@elitesport.test",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log(`Seeded ${sportTypeNames.length} sport types.`);
  console.log("Demo admin account is ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
