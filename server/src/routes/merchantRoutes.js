const express = require("express");
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
  requireMerchantOwner,
  getMerchantVerification
);
router.patch(
  "/merchants/:merchantId/verification",
  requireMerchantOwner,
  handleMerchantVerificationUpload,
  updateMerchantVerification
);

router.get(
  "/merchants/:merchantId/payment-details",
  getMerchantPaymentDetails
);
router.patch(
  "/merchants/:merchantId/payment-details",
  requireApprovedMerchant,
  handlePaymentQrUpload,
  updateMerchantPaymentDetails
);

module.exports = router;
