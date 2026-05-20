const express = require("express");
const {
  createFacility,
  getAllFacilities,
  getFacilityById,
  createTimeSlots,
  getFacilitySlotsByDate,
  blockTimeSlot,
  unblockTimeSlot,
} = require("../controllers/facilityController");

const router = express.Router();

router.post("/facilities", createFacility);
router.get("/facilities", getAllFacilities);
router.get("/facilities/:id", getFacilityById);
router.post("/facilities/slots", createTimeSlots);
router.get("/facilities/slots/by-date", getFacilitySlotsByDate);
router.patch("/facilities/slots/:slotId/block", blockTimeSlot);
router.patch("/facilities/slots/:slotId/unblock", unblockTimeSlot);

module.exports = router;
