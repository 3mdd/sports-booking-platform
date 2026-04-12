const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ message: "Database connection successful" });
  } catch (error) {
    console.error("Database test failed:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

module.exports = router;