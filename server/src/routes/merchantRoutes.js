const express = require("express");
const { paymentQrUpload } = require("../config/multer");
const {
  getMerchantPaymentDetails,
  updateMerchantPaymentDetails,
} = require("../controllers/merchantController");

const router = express.Router();

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

router.get(
  "/merchants/:merchantId/payment-details",
  getMerchantPaymentDetails
);
router.patch(
  "/merchants/:merchantId/payment-details",
  handlePaymentQrUpload,
  updateMerchantPaymentDetails
);

module.exports = router;
