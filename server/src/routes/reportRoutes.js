const express = require("express");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");
const {
  createReport,
  getCustomerReports,
  getAdminReports,
  updateReportStatus,
} = require("../controllers/reportController");

const router = express.Router();

router.post(
  "/reports",
  authenticateToken,
  requireRole("CUSTOMER"),
  createReport
);
router.get(
  "/reports/customer",
  authenticateToken,
  requireRole("CUSTOMER"),
  getCustomerReports
);
router.get(
  "/admin/reports",
  authenticateToken,
  requireRole("ADMIN"),
  getAdminReports
);
router.patch(
  "/admin/reports/:reportId/status",
  authenticateToken,
  requireRole("ADMIN"),
  updateReportStatus
);

module.exports = router;
