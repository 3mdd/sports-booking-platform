const express = require("express");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");
const {
  facilityPhotoUpload,
  facilityGalleryUpload,
} = require("../config/multer");
const {
  createFacility,
  getAllFacilities,
  getFacilityById,
  getSportTypes,
  uploadFacilityPhoto,
  requireFacilityOwner,
  requireFacilityBodyOwner,
  requireTimeSlotOwner,
  getFacilityImages,
  uploadFacilityImages,
  setFacilityMainImage,
  deleteFacilityImage,
  updateFacility,
  createTimeSlots,
  getFacilitySlotsByDate,
  blockTimeSlot,
  unblockTimeSlot,
  blockFacilityDaySlots,
  unblockFacilityDaySlots,
} = require("../controllers/facilityController");

const router = express.Router();

const handleFacilityPhotoUpload = (req, res, next) => {
  facilityPhotoUpload.single("facilityPhoto")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return next();
  });
};

const handleFacilityGalleryUpload = (req, res, next) => {
  facilityGalleryUpload.array("facilityImages", 8)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return next();
  });
};

router.post(
  "/facilities",
  authenticateToken,
  requireRole("MERCHANT"),
  createFacility
);
router.get("/facilities", getAllFacilities);
router.get("/facilities/sport-types", getSportTypes);
router.get("/facilities/:facilityId/images", getFacilityImages);
router.post(
  "/facilities/:facilityId/images",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  handleFacilityGalleryUpload,
  uploadFacilityImages
);
router.patch(
  "/facilities/:facilityId/images/:imageId/main",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  setFacilityMainImage
);
router.delete(
  "/facilities/:facilityId/images/:imageId",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  deleteFacilityImage
);
router.get("/facilities/:id", getFacilityById);
router.patch(
  "/facilities/:id/photo",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  handleFacilityPhotoUpload,
  uploadFacilityPhoto
);
router.patch(
  "/facilities/:id",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  updateFacility
);
router.post(
  "/facilities/slots",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityBodyOwner,
  createTimeSlots
);
router.get("/facilities/slots/by-date", getFacilitySlotsByDate);
router.patch(
  "/facilities/slots/:slotId/block",
  authenticateToken,
  requireRole("MERCHANT"),
  requireTimeSlotOwner,
  blockTimeSlot
);
router.patch(
  "/facilities/slots/:slotId/unblock",
  authenticateToken,
  requireRole("MERCHANT"),
  requireTimeSlotOwner,
  unblockTimeSlot
);
router.patch(
  "/facilities/:facilityId/slots/block-day",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  blockFacilityDaySlots
);
router.patch(
  "/facilities/:facilityId/slots/unblock-day",
  authenticateToken,
  requireRole("MERCHANT"),
  requireFacilityOwner,
  unblockFacilityDaySlots
);

module.exports = router;
