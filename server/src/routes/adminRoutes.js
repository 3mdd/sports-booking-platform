const express = require("express");
const {
  getAdminDashboard,
  getAdminUsers,
  activateUser,
  deactivateUser,
  getAdminFacilities,
  activateFacility,
  deactivateFacility,
  getAdminMerchants,
  approveMerchant,
  rejectMerchant,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/admin/dashboard", getAdminDashboard);
router.get("/admin/users", getAdminUsers);
router.patch("/admin/users/:userId/activate", activateUser);
router.patch("/admin/users/:userId/deactivate", deactivateUser);
router.get("/admin/facilities", getAdminFacilities);
router.patch("/admin/facilities/:facilityId/activate", activateFacility);
router.patch("/admin/facilities/:facilityId/deactivate", deactivateFacility);
router.get("/admin/merchants", getAdminMerchants);
router.patch("/admin/merchants/:merchantId/approve", approveMerchant);
router.patch("/admin/merchants/:merchantId/reject", rejectMerchant);

module.exports = router;
