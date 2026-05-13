const prisma = require("../lib/prisma");

const PAYMENT_EXPIRY_MINUTES = 30;

const expireOldPendingBookings = async () => {
  const expiryCutoff = new Date(
    Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000
  );

  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: {
        lt: expiryCutoff,
      },
    },
    include: {
      bookingSlots: {
        select: {
          timeSlotId: true,
        },
      },
    },
  });

  for (const booking of expiredBookings) {
    await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "PENDING_PAYMENT",
        },
        data: {
          status: "EXPIRED",
        },
      });

      if (updatedBooking.count === 0) {
        return;
      }

      const timeSlotIds = booking.bookingSlots.map(
        (bookingSlot) => bookingSlot.timeSlotId
      );

      if (timeSlotIds.length === 0) {
        return;
      }

      await tx.timeSlot.updateMany({
        where: {
          id: {
            in: timeSlotIds,
          },
        },
        data: {
          isBooked: false,
        },
      });
    });
  }
};

module.exports = {
  expireOldPendingBookings,
};
