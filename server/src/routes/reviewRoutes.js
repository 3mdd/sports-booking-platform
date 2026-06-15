const express = require("express");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");
const {
  createReview,
  getReviewsByFacility,
  getReviewsByCustomer,
  getReviewsByMerchant,
} = require("../controllers/reviewController");

const router = express.Router();

router.post(
  "/reviews",
  authenticateToken,
  requireRole("CUSTOMER"),
  createReview
);
router.get("/reviews/facility/:facilityId", getReviewsByFacility);
router.get(
  "/reviews/customer/:customerId",
  authenticateToken,
  requireRole("CUSTOMER"),
  getReviewsByCustomer
);
router.get(
  "/reviews/merchant/:merchantId",
  authenticateToken,
  requireRole("MERCHANT"),
  getReviewsByMerchant
);

module.exports = router;
