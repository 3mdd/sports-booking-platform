const prisma = require("../lib/prisma");

const createBooking = async (req, res) => {
  try {
    const { customerId, facilityId, timeSlotIds, notes } = req.body;

    if (
      !customerId ||
      !facilityId ||
      !Array.isArray(timeSlotIds) ||
      timeSlotIds.length === 0
    ) {
      return res.status(400).json({
        message: "customerId, facilityId, and timeSlotIds are required",
      });
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
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

    const slots = await prisma.timeSlot.findMany({
      where: {
        id: { in: timeSlotIds.map(Number) },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (slots.length !== timeSlotIds.length) {
      return res.status(400).json({
        message: "One or more selected slots do not exist",
      });
    }

    const allSlotsBelongToFacility = slots.every(
      (slot) => slot.facilityId === Number(facilityId)
    );

    if (!allSlotsBelongToFacility) {
      return res.status(400).json({
        message: "Selected slots do not belong to the given facility",
      });
    }

    const hasBookedSlot = slots.some((slot) => slot.isBooked);

    if (hasBookedSlot) {
      return res.status(400).json({
        message: "One or more selected slots are already booked",
      });
    }

    for (let i = 0; i < slots.length - 1; i++) {
      const currentEnd = new Date(slots[i].endTime).getTime();
      const nextStart = new Date(slots[i + 1].startTime).getTime();

      if (currentEnd !== nextStart) {
        return res.status(400).json({
          message: "Selected slots must be connected in sequence",
        });
      }
    }

    const totalPrice = slots.length * Number(facility.pricePerSlot);
    const bookingDate = slots[0].slotDate;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          customerId: Number(customerId),
          facilityId: Number(facilityId),
          bookingDate,
          totalPrice,
          status: "PENDING_PAYMENT",
          notes: notes || null,
        },
      });

      await tx.bookingSlot.createMany({
        data: slots.map((slot) => ({
          bookingId: booking.id,
          timeSlotId: slot.id,
        })),
      });

      await tx.timeSlot.updateMany({
        where: {
          id: { in: slots.map((slot) => slot.id) },
        },
        data: {
          isBooked: true,
        },
      });

      return booking;
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking: result,
      totalSlots: slots.length,
      totalPrice,
    });
  } catch (error) {
    console.error("Create booking failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getBookingsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customerProfile.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        customerId: Number(customerId),
      },
      include: {
        facility: {
          include: {
            sportType: true,
            images: true,
          },
        },
        bookingSlots: {
          include: {
            timeSlot: true,
          },
        },
        paymentProof: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Customer bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.error("Fetch customer bookings failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBooking,
  getBookingsByCustomer,
};