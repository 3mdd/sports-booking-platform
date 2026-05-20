const prisma = require("../lib/prisma");
const {
  expireOldPendingBookings,
} = require("../services/bookingExpiryService");

const createFacility = async (req, res) => {
  try {
    const {
      merchantProfileId,
      sportTypeId,
      name,
      description,
      location,
      pricePerSlot,
    } = req.body;

    if (
      !merchantProfileId ||
      !sportTypeId ||
      !name ||
      !location ||
      pricePerSlot === undefined
    ) {
      return res.status(400).json({
        message: "merchantProfileId, sportTypeId, name, location, and pricePerSlot are required",
      });
    }

    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: { id: Number(merchantProfileId) },
    });

    if (!merchantProfile) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    const sportType = await prisma.sportType.findUnique({
      where: { id: Number(sportTypeId) },
    });

    if (!sportType) {
      return res.status(404).json({
        message: "Sport type not found",
      });
    }

    const facility = await prisma.facility.create({
      data: {
        merchantProfileId: Number(merchantProfileId),
        sportTypeId: Number(sportTypeId),
        name,
        description,
        location,
        pricePerSlot,
      },
    });

    return res.status(201).json({
      message: "Facility created successfully",
      facility,
    });
  } catch (error) {
    console.error("Create facility failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllFacilities = async (req, res) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        sportType: true,
        merchantProfile: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Facilities fetched successfully",
      facilities,
    });
  } catch (error) {
    console.error("Fetch facilities failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id: Number(id) },
      include: {
        sportType: true,
        merchantProfile: true,
        images: true,
        timeSlots: true,
      },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      message: "Facility fetched successfully",
      facility,
    });
  } catch (error) {
    console.error("Fetch facility by ID failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createTimeSlots = async (req, res) => {
  try {
    const { facilityId, date, startTime, endTime } = req.body;

    if (!facilityId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "facilityId, date, startTime, and endTime are required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slots = [];
    const current = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      if (slotEnd > end) break;

      slots.push({
        facilityId: Number(facilityId),
        slotDate: new Date(`${date}T00:00:00`),
        startTime: slotStart,
        endTime: slotEnd,
      });

      current.setMinutes(current.getMinutes() + 30);
    }

    const duplicateSlots = await prisma.timeSlot.findMany({
      where: {
        facilityId: Number(facilityId),
        OR: slots.map((slot) => ({
          slotDate: slot.slotDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      },
    });

    if (duplicateSlots.length > 0) {
      return res.status(409).json({
        message: "This time slot already exists for this facility and date.",
      });
    }

    const createdSlots = await prisma.timeSlot.createMany({
      data: slots,
    });

    return res.status(201).json({
      message: "Time slots created successfully",
      totalCreated: createdSlots.count,
    });
  } catch (error) {
    console.error("Create time slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getFacilitySlotsByDate = async (req, res) => {
  try {
    const { facilityId, date } = req.query;

    if (!facilityId || !date) {
      return res.status(400).json({
        message: "facilityId and date are required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    await expireOldPendingBookings();

    const slotDate = new Date(`${date}T00:00:00`);

    const slots = await prisma.timeSlot.findMany({
      where: {
        facilityId: Number(facilityId),
        slotDate,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.status(200).json({
      message: "Facility slots fetched successfully",
      slots,
    });
  } catch (error) {
    console.error("Fetch facility slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const blockTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { blockReason } = req.body;

    const slot = await prisma.timeSlot.findUnique({
      where: { id: Number(slotId) },
    });

    if (!slot) {
      return res.status(404).json({
        message: "Time slot not found",
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        message: "Booked slots cannot be blocked.",
      });
    }

    const updatedSlot = await prisma.timeSlot.update({
      where: { id: Number(slotId) },
      data: {
        isBlocked: true,
        blockReason: blockReason || null,
      },
    });

    return res.status(200).json({
      message: "Time slot blocked successfully",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Block time slot failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const unblockTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await prisma.timeSlot.findUnique({
      where: { id: Number(slotId) },
    });

    if (!slot) {
      return res.status(404).json({
        message: "Time slot not found",
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        message: "Booked slots cannot be unblocked from merchant blocking.",
      });
    }

    if (!slot.isBlocked) {
      return res.status(400).json({
        message: "Only manually blocked slots can be unblocked.",
      });
    }

    const updatedSlot = await prisma.timeSlot.update({
      where: { id: Number(slotId) },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });

    return res.status(200).json({
      message: "Time slot unblocked successfully",
      slot: updatedSlot,
    });
  } catch (error) {
    console.error("Unblock time slot failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const blockFacilityDaySlots = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date, blockReason } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slotDate = new Date(`${date}T00:00:00`);

    const [skippedBookedCount, blockResult] = await prisma.$transaction([
      prisma.timeSlot.count({
        where: {
          facilityId: Number(facilityId),
          slotDate,
          isBooked: true,
        },
      }),
      prisma.timeSlot.updateMany({
        where: {
          facilityId: Number(facilityId),
          slotDate,
          isBooked: false,
          isBlocked: false,
        },
        data: {
          isBlocked: true,
          blockReason: blockReason || null,
        },
      }),
    ]);

    return res.status(200).json({
      message: "Available slots blocked successfully",
      blockedCount: blockResult.count,
      skippedBookedCount,
    });
  } catch (error) {
    console.error("Block facility day slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const unblockFacilityDaySlots = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: Number(facilityId) },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const slotDate = new Date(`${date}T00:00:00`);

    const unblockResult = await prisma.timeSlot.updateMany({
      where: {
        facilityId: Number(facilityId),
        slotDate,
        isBooked: false,
        isBlocked: true,
      },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });

    return res.status(200).json({
      message: "Blocked slots unblocked successfully",
      unblockedCount: unblockResult.count,
    });
  } catch (error) {
    console.error("Unblock facility day slots failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  createFacility,
  getAllFacilities,
  getFacilityById,
  createTimeSlots,
  getFacilitySlotsByDate,
  blockTimeSlot,
  unblockTimeSlot,
  blockFacilityDaySlots,
  unblockFacilityDaySlots,
};
