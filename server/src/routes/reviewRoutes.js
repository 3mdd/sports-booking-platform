const express = require("express");
const {
  createReview,
  getReviewsByFacility,
  getReviewsByCustomer,
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/reviews", createReview);
router.get("/reviews/facility/:facilityId", getReviewsByFacility);
router.get("/reviews/customer/:customerId", getReviewsByCustomer);

module.exports = router;
