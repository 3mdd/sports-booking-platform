const VERIFICATION_DEADLINE_MINUTES = 30;
const VERIFICATION_DUE_SOON_HOURS = 2;

function getBookingStartDateTime(booking) {
  const startTimes = (booking.bookingSlots || [])
    .map((bookingSlot) => bookingSlot.timeSlot?.startTime)
    .filter(Boolean)
    .map((startTime) => new Date(startTime))
    .filter((startTime) => !Number.isNaN(startTime.getTime()))
    .sort((first, second) => first.getTime() - second.getTime());

  return startTimes[0] || null;
}

function getVerificationDeadlineInfo(booking, currentTime = new Date()) {
  const emptyResult = {
    verificationDeadlineAt: null,
    verificationDueSoon: false,
    verificationOverdue: false,
  };

  if (booking.status !== "PAYMENT_UPLOADED") {
    return emptyResult;
  }

  const bookingStartDateTime = getBookingStartDateTime(booking);

  if (!bookingStartDateTime) {
    return emptyResult;
  }

  const verificationDeadlineAt = new Date(
    bookingStartDateTime.getTime() -
      VERIFICATION_DEADLINE_MINUTES * 60 * 1000
  );
  const nowTime = new Date(currentTime).getTime();
  const bookingStartTime = bookingStartDateTime.getTime();
  const deadlineTime = verificationDeadlineAt.getTime();
  const verificationOverdue = nowTime >= deadlineTime;
  const verificationDueSoon =
    !verificationOverdue &&
    bookingStartTime - nowTime <=
      VERIFICATION_DUE_SOON_HOURS * 60 * 60 * 1000;

  return {
    verificationDeadlineAt: verificationDeadlineAt.toISOString(),
    verificationDueSoon,
    verificationOverdue,
  };
}

function addVerificationDeadlineInfo(booking, currentTime = new Date()) {
  return {
    ...booking,
    ...getVerificationDeadlineInfo(booking, currentTime),
  };
}

module.exports = {
  getBookingStartDateTime,
  getVerificationDeadlineInfo,
  addVerificationDeadlineInfo,
};
