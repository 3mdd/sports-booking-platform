const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("Sports Booking API is running");
});

app.use("/", testRoutes);
app.use("/", authRoutes);
app.use("/", facilityRoutes);
app.use("/", bookingRoutes);
app.use("/", reviewRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ message: "Database connection successful" });
  } catch (error) {
    console.error("Database test failed:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});
