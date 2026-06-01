const express = require("express");
const { facilityPhotoUpload } = require("../config/multer");
const {
  createFacility,
  getAllFacilities,
  getFacilityById,
  getSportTypes,
  uploadFacilityPhoto,
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

router.post("/facilities", createFacility);
router.get("/facilities", getAllFacilities);
router.get("/facilities/sport-types", getSportTypes);
router.get("/facilities/:id", getFacilityById);
router.patch(
  "/facilities/:id/photo",
  handleFacilityPhotoUpload,
  uploadFacilityPhoto
);
router.patch("/facilities/:id", updateFacility);
router.post("/facilities/slots", createTimeSlots);
router.get("/facilities/slots/by-date", getFacilitySlotsByDate);
router.patch("/facilities/slots/:slotId/block", blockTimeSlot);
router.patch("/facilities/slots/:slotId/unblock", unblockTimeSlot);
router.patch("/facilities/:facilityId/slots/block-day", blockFacilityDaySlots);
router.patch(
  "/facilities/:facilityId/slots/unblock-day",
  unblockFacilityDaySlots
);

module.exports = router;
