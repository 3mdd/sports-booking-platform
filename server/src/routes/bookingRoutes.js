const express = require("express");
const { createBooking } = require("../controllers/bookingController");

const router = express.Router();

router.post("/bookings", createBooking);

module.exports = router;