const express = require("express");
const {
  createFacility,
  getAllFacilities,
  getFacilityById,
  getSportTypes,
  updateFacility,
  createTimeSlots,
  getFacilitySlotsByDate,
  blockTimeSlot,
  unblockTimeSlot,
  blockFacilityDaySlots,
  unblockFacilityDaySlots,
} = require("../controllers/facilityController");

const router = express.Router();

router.post("/facilities", createFacility);
router.get("/facilities", getAllFacilities);
router.get("/facilities/sport-types", getSportTypes);
router.get("/facilities/:id", getFacilityById);
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
