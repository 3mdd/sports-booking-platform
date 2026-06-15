const express = require("express");
const { paymentProofUpload } = require("../config/multer");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");
const {
  createBooking,
  getBookingsByCustomer,
  getBookingsByMerchant,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
} = require("../controllers/bookingController");

const router = express.Router();

router.post(
  "/bookings",
  authenticateToken,
  requireRole("CUSTOMER"),
  createBooking
);
router.get(
  "/bookings/customer/:customerId",
  authenticateToken,
  requireRole("CUSTOMER"),
  getBookingsByCustomer
);
router.get(
  "/bookings/merchant/:merchantId",
  authenticateToken,
  requireRole("MERCHANT"),
  getBookingsByMerchant
);
router.post(
  "/bookings/payment-proof",
  authenticateToken,
  requireRole("CUSTOMER"),
  paymentProofUpload.single("paymentProof"),
  uploadPaymentProof
);
router.patch(
  "/bookings/:bookingId/approve-payment",
  authenticateToken,
  requireRole("MERCHANT"),
  approvePayment
);
router.patch(
  "/bookings/:bookingId/reject-payment",
  authenticateToken,
  requireRole("MERCHANT"),
  rejectPayment
);

module.exports = router;
