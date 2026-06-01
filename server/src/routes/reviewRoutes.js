const express = require("express");
const {
  createReview,
  getReviewsByFacility,
  getReviewsByCustomer,
  getReviewsByMerchant,
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/reviews", createReview);
router.get("/reviews/facility/:facilityId", getReviewsByFacility);
router.get("/reviews/customer/:customerId", getReviewsByCustomer);
router.get("/reviews/merchant/:merchantId", getReviewsByMerchant);

module.exports = router;
