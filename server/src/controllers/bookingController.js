const prisma = require("../lib/prisma");
const {
  expireOldPendingBookings,
} = require("../services/bookingExpiryService");

const BOOKING_ADVANCE_DAYS = 14;

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function getMaxBookingDate() {
  const maxBookingDate = getStartOfToday();
  maxBookingDate.setDate(maxBookingDate.getDate() + BOOKING_ADVANCE_DAYS);
  maxBookingDate.setHours(23, 59, 59, 999);

  return maxBookingDate;
}

function getStartOfSlotDate(slotDate) {
  const date = new Date(slotDate);
  date.setHours(0, 0, 0, 0);

  return date;
}

function isSameLocalDate(firstDateValue, secondDateValue) {
  const firstDate = new Date(firstDateValue);
  const secondDate = new Date(secondDateValue);

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

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

    if (!facility.isActive) {
      return res.status(400).json({
        message: "This facility is currently inactive and cannot be booked.",
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

    const todayStart = getStartOfToday();
    const maxBookingDate = getMaxBookingDate();

    const bookingStartSlot = slots[0];
    const bookingStartDate = new Date(bookingStartSlot.startTime);
    const bookingSlotDate = getStartOfSlotDate(bookingStartSlot.slotDate);

    if (bookingSlotDate < todayStart) {
      return res.status(400).json({
        message: "Bookings cannot be made for past dates.",
      });
    }

    if (bookingSlotDate > maxBookingDate) {
      return res.status(400).json({
        message: "Bookings are only available up to 14 days in advance.",
      });
    }

    const now = new Date();
    const minimumSameDayStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (
      isSameLocalDate(bookingStartDate, now) &&
      bookingStartDate < minimumSameDayStart
    ) {
      return res.status(400).json({
        message:
          "Same-day bookings must start at least 2 hours from the current time.",
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

    const hasBlockedSlot = slots.some((slot) => slot.isBlocked);

    if (hasBlockedSlot) {
      return res.status(400).json({
        message: "One or more selected slots are blocked by the merchant",
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

    await expireOldPendingBookings();

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

const getBookingsByMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: Number(merchantId) },
    });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    await expireOldPendingBookings();

    const bookings = await prisma.booking.findMany({
      where: {
        facility: {
          merchantProfileId: Number(merchantId),
        },
      },
      include: {
        customer: {
  include: {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  },
},
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

    res.status(200).json({
      message: "Merchant bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.error("Error fetching merchant bookings:", error);
    res.status(500).json({
      message: "Failed to fetch merchant bookings",
      error: error.message,
    });
  }
};

const uploadPaymentProof = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Payment proof file is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        paymentProof: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({
        message: "Payment proof can only be uploaded for bookings pending payment",
      });
    }

    if (booking.paymentProof) {
      return res.status(400).json({
        message: "Payment proof already uploaded for this booking",
      });
    }

    const paymentProof = await prisma.paymentProof.create({
      data: {
        bookingId: Number(bookingId),
        filePath: req.file.path,
        originalFileName: req.file.originalname,
      },
    });

    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: {
        status: "PAYMENT_UPLOADED",
      },
    });

    res.status(201).json({
      message: "Payment proof uploaded successfully",
      paymentProof,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    res.status(500).json({
      message: "Failed to upload payment proof",
      error: error.message,
    });
  }
};

const approvePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        paymentProof: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (!booking.paymentProof) {
      return res.status(400).json({
        message: "Cannot approve booking without uploaded payment proof",
      });
    }

    if (booking.status !== "PAYMENT_UPLOADED") {
      return res.status(400).json({
        message: "Only bookings with uploaded payment proof can be approved",
      });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          status: "CONFIRMED",
        },
      });

      await tx.paymentProof.update({
        where: { bookingId: Number(bookingId) },
        data: {
          status: "APPROVED",
        },
      });

      return bookingUpdate;
    });

    return res.status(200).json({
      message: "Payment approved successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Approve payment failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const rejectPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        paymentProof: true,
        bookingSlots: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (!booking.paymentProof) {
      return res.status(400).json({
        message: "Cannot reject booking without uploaded payment proof",
      });
    }

    if (booking.status !== "PAYMENT_UPLOADED") {
      return res.status(400).json({
        message: "Only bookings with uploaded payment proof can be rejected",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          status: "REJECTED",
        },
      });

      await tx.paymentProof.update({
        where: { bookingId: Number(bookingId) },
        data: {
          status: "REJECTED",
        },
      });

      await tx.timeSlot.updateMany({
        where: {
          id: {
            in: booking.bookingSlots.map(
              (bookingSlot) => bookingSlot.timeSlotId
            ),
          },
        },
        data: {
          isBooked: false,
        },
      });

      return updatedBooking;
    });

    return res.status(200).json({
      message: "Payment rejected successfully",
      booking: result,
    });
  } catch (error) {
    console.error("Reject payment failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBooking,
  getBookingsByCustomer,
  getBookingsByMerchant,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
};
