const express = require("express");
const {
  getAdminMerchants,
  approveMerchant,
  rejectMerchant,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/admin/merchants", getAdminMerchants);
router.patch("/admin/merchants/:merchantId/approve", approveMerchant);
router.patch("/admin/merchants/:merchantId/reject", rejectMerchant);

module.exports = router;
