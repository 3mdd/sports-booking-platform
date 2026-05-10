const express = require("express");
const upload = require("../config/multer");
const {
  createBooking,
  getBookingsByCustomer,
  getBookingsByMerchant,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings/customer/:customerId", getBookingsByCustomer);
router.get("/bookings/merchant/:merchantId", getBookingsByMerchant);
router.post(
  "/bookings/payment-proof",
  upload.single("paymentProof"),
  uploadPaymentProof
);
router.patch("/bookings/:bookingId/approve-payment", approvePayment);
router.patch("/bookings/:bookingId/reject-payment", rejectPayment);

module.exports = router;