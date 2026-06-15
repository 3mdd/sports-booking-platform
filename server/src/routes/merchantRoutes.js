const express = require("express");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");
const {
  paymentQrUpload,
  merchantVerificationUpload,
} = require("../config/multer");
const {
  requireMerchantOwner,
  requireApprovedMerchant,
  getMerchantVerification,
  updateMerchantVerification,
  getMerchantPaymentDetails,
  updateMerchantPaymentDetails,
  getMerchantAnalytics,
} = require("../controllers/merchantController");

const router = express.Router();

router.get(
  "/merchants/:merchantId/analytics",
  authenticateToken,
  requireRole("MERCHANT"),
  requireMerchantOwner,
  requireApprovedMerchant,
  getMerchantAnalytics
);

const handlePaymentQrUpload = (req, res, next) => {
  paymentQrUpload.single("paymentQrImage")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return next();
  });
};

const handleMerchantVerificationUpload = (req, res, next) => {
  merchantVerificationUpload.fields([
    { name: "verificationDocument", maxCount: 1 },
    { name: "ownershipProof", maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return next();
  });
};

router.get(
  "/merchants/:merchantId/verification",
  authenticateToken,
  requireRole("MERCHANT"),
  requireMerchantOwner,
  getMerchantVerification
);
router.patch(
  "/merchants/:merchantId/verification",
  authenticateToken,
  requireRole("MERCHANT"),
  requireMerchantOwner,
  handleMerchantVerificationUpload,
  updateMerchantVerification
);

router.get(
  "/merchants/:merchantId/payment-details",
  authenticateToken,
  requireRole("CUSTOMER", "MERCHANT", "ADMIN"),
  getMerchantPaymentDetails
);
router.patch(
  "/merchants/:merchantId/payment-details",
  authenticateToken,
  requireRole("MERCHANT"),
  requireMerchantOwner,
  requireApprovedMerchant,
  handlePaymentQrUpload,
  updateMerchantPaymentDetails
);

module.exports = router;
