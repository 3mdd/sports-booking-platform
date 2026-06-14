const prisma = require("../lib/prisma");

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function roundNumber(value, decimalPlaces = 2) {
  const multiplier = 10 ** decimalPlaces;
  return Math.round((Number(value) + Number.EPSILON) * multiplier) / multiplier;
}

function getDateRange(year, month) {
  const startMonth = month ? month - 1 : 0;
  const endMonth = month ? month : 12;

  return {
    gte: new Date(Date.UTC(year, startMonth, 1)),
    lt: new Date(Date.UTC(year, endMonth, 1)),
  };
}

function getSentimentCounts(reviews) {
  return reviews.reduce(
    (counts, review) => {
      if (review.sentimentLabel === "POSITIVE") counts.positive += 1;
      if (review.sentimentLabel === "NEUTRAL") counts.neutral += 1;
      if (review.sentimentLabel === "NEGATIVE") counts.negative += 1;
      return counts;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
}

function getAverageRating(reviews) {
  if (reviews.length === 0) return null;

  const ratingTotal = reviews.reduce(
    (total, review) => total + Number(review.rating || 0),
    0
  );
  return roundNumber(ratingTotal / reviews.length);
}

function getFirstSlotStart(booking) {
  const timestamps = (booking.bookingSlots || [])
    .map((bookingSlot) => bookingSlot.timeSlot?.startTime)
    .filter(Boolean)
    .map((startTime) => new Date(startTime))
    .filter((startTime) => !Number.isNaN(startTime.getTime()))
    .sort((first, second) => first.getTime() - second.getTime());

  return timestamps[0] || null;
}

function incrementCount(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

function getPopularTimeAnalytics(bookings) {
  const startTimeCounts = new Map();
  const dayCounts = new Map();
  const timeFormatter = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dayFormatter = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
  });

  bookings.forEach((booking) => {
    const firstSlotStart = getFirstSlotStart(booking);
    const bookingStart = firstSlotStart || new Date(booking.bookingDate);

    if (Number.isNaN(bookingStart.getTime())) return;

    incrementCount(startTimeCounts, timeFormatter.format(bookingStart));
    incrementCount(dayCounts, dayFormatter.format(bookingStart));
  });

  const popularStartTimes = [...startTimeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 5);
  const popularDays = [...dayCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count);

  return {
    peakBookingHour: popularStartTimes[0] || null,
    popularStartTimes,
    mostPopularBookingDay: popularDays[0] || null,
  };
}

function buildFacilityPerformance(facilities, bookings, reviews) {
  return facilities.map((facility) => {
    const facilityBookings = bookings.filter(
      (booking) => booking.facilityId === facility.id
    );
    const confirmedBookings = facilityBookings.filter(
      (booking) => booking.status === "CONFIRMED"
    );
    const facilityReviews = reviews.filter(
      (review) => review.facilityId === facility.id
    );

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      isActive: facility.isActive,
      totalBookings: facilityBookings.length,
      confirmedBookings: confirmedBookings.length,
      estimatedRevenue: roundNumber(
        confirmedBookings.reduce(
          (total, booking) => total + Number(booking.totalPrice || 0),
          0
        )
      ),
      averageRating: getAverageRating(facilityReviews),
      totalReviews: facilityReviews.length,
      sentimentCounts: getSentimentCounts(facilityReviews),
    };
  });
}

function getTopFacility(facilities, metric, minimumValue = 1) {
  const rankedFacilities = [...facilities]
    .filter((facility) => Number(facility[metric] || 0) >= minimumValue)
    .sort(
      (first, second) =>
        Number(second[metric] || 0) - Number(first[metric] || 0)
    );

  if (rankedFacilities.length === 0) return null;

  const facility = rankedFacilities[0];
  return {
    facilityId: facility.facilityId,
    facilityName: facility.facilityName,
    value: facility[metric],
  };
}

function getLowestRatedFacility(facilities) {
  const ratedFacilities = facilities
    .filter(
      (facility) =>
        facility.totalReviews >= 2 && facility.averageRating !== null
    )
    .sort(
      (first, second) => first.averageRating - second.averageRating
    );

  if (ratedFacilities.length === 0) return null;

  const facility = ratedFacilities[0];
  return {
    facilityId: facility.facilityId,
    facilityName: facility.facilityName,
    averageRating: facility.averageRating,
    totalReviews: facility.totalReviews,
  };
}

function buildActionableInsights({
  mostBookedFacility,
  highestRevenueFacility,
  lowestRatedFacility,
  facilityPerformance,
  pendingVerifications,
  totalBookings,
}) {
  if (totalBookings === 0) {
    return [
      "No bookings match these filters yet. Try another period or facility.",
    ];
  }

  const insights = [];

  if (mostBookedFacility) {
    insights.push(
      `Most bookings come from ${mostBookedFacility.facilityName}.`
    );
  }

  if (highestRevenueFacility) {
    insights.push(
      `${highestRevenueFacility.facilityName} generates the highest estimated revenue.`
    );
  }

  if (pendingVerifications > 0) {
    insights.push(
      `${pendingVerifications} payment verification item${
        pendingVerifications === 1 ? "" : "s"
      } need attention.`
    );
  }

  const negativeFeedbackFacility = [...facilityPerformance]
    .filter((facility) => facility.sentimentCounts.negative > 0)
    .sort(
      (first, second) =>
        second.sentimentCounts.negative - first.sentimentCounts.negative
    )[0];

  if (negativeFeedbackFacility) {
    insights.push(
      `${negativeFeedbackFacility.facilityName} has the most negative feedback in this period.`
    );
  } else if (lowestRatedFacility) {
    insights.push(
      `${lowestRatedFacility.facilityName} has the lowest reviewed rating and may need attention.`
    );
  }

  return insights;
}

async function getMerchantAnalytics({ merchantId, year, month, facilityId }) {
  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      businessName: true,
      facilities: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!merchant) {
    return null;
  }

  if (
    facilityId &&
    !merchant.facilities.some((facility) => facility.id === facilityId)
  ) {
    const error = new Error("Facility does not belong to this merchant");
    error.statusCode = 403;
    throw error;
  }

  const filteredFacilities = facilityId
    ? merchant.facilities.filter((facility) => facility.id === facilityId)
    : merchant.facilities;
  const periodRange = getDateRange(year, month);
  const yearRange = getDateRange(year, null);
  const facilityWhere = {
    merchantProfileId: merchantId,
    ...(facilityId ? { id: facilityId } : {}),
  };

  const bookingSelect = {
    id: true,
    facilityId: true,
    bookingDate: true,
    totalPrice: true,
    status: true,
    paymentProof: {
      select: {
        status: true,
      },
    },
    bookingSlots: {
      select: {
        timeSlot: {
          select: {
            startTime: true,
          },
        },
      },
    },
  };

  const [bookings, reviews, yearlyBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        facility: facilityWhere,
        bookingDate: periodRange,
      },
      select: bookingSelect,
    }),
    prisma.review.findMany({
      where: {
        facility: facilityWhere,
        createdAt: periodRange,
      },
      select: {
        facilityId: true,
        rating: true,
        sentimentLabel: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        facility: facilityWhere,
        bookingDate: yearRange,
      },
      select: {
        bookingDate: true,
        totalPrice: true,
        status: true,
      },
    }),
  ]);

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  );
  const estimatedRevenue = roundNumber(
    confirmedBookings.reduce(
      (total, booking) => total + Number(booking.totalPrice || 0),
      0
    )
  );
  const pendingVerifications = bookings.filter(
    (booking) =>
      booking.status === "PAYMENT_UPLOADED" ||
      booking.paymentProof?.status === "PENDING"
  ).length;
  const facilityPerformance = buildFacilityPerformance(
    filteredFacilities,
    bookings,
    reviews
  );
  const mostBookedFacility = getTopFacility(
    facilityPerformance,
    "totalBookings"
  );
  const highestRevenueFacility = getTopFacility(
    facilityPerformance,
    "estimatedRevenue",
    0.01
  );
  const lowestRatedFacility = getLowestRatedFacility(facilityPerformance);

  const monthlyAnalytics = MONTH_NAMES.map((monthName, monthIndex) => {
    const monthBookings = yearlyBookings.filter(
      (booking) => booking.bookingDate.getUTCMonth() === monthIndex
    );
    const monthConfirmedBookings = monthBookings.filter(
      (booking) => booking.status === "CONFIRMED"
    );

    return {
      month: monthIndex + 1,
      monthName,
      bookings: monthBookings.length,
      revenue: roundNumber(
        monthConfirmedBookings.reduce(
          (total, booking) => total + Number(booking.totalPrice || 0),
          0
        )
      ),
    };
  });

  const summary = {
    totalBookings: bookings.length,
    confirmedBookings: confirmedBookings.length,
    pendingPayments: bookings.filter(
      (booking) => booking.status === "PENDING_PAYMENT"
    ).length,
    pendingVerifications,
    rejectedBookings: bookings.filter(
      (booking) => booking.status === "REJECTED"
    ).length,
    expiredBookings: bookings.filter(
      (booking) => booking.status === "EXPIRED"
    ).length,
    estimatedRevenue,
    averageBookingValue:
      confirmedBookings.length > 0
        ? roundNumber(estimatedRevenue / confirmedBookings.length)
        : 0,
    totalFacilities: merchant.facilities.length,
    activeFacilities: merchant.facilities.filter(
      (facility) => facility.isActive
    ).length,
    averageRating: getAverageRating(reviews),
    totalReviews: reviews.length,
    sentimentCounts: getSentimentCounts(reviews),
  };

  const paymentAnalytics = {
    pendingVerification: pendingVerifications,
    approvedProofs: bookings.filter(
      (booking) => booking.paymentProof?.status === "APPROVED"
    ).length,
    rejectedProofs: bookings.filter(
      (booking) => booking.paymentProof?.status === "REJECTED"
    ).length,
  };

  return {
    merchant: {
      merchantId: merchant.id,
      businessName: merchant.businessName,
    },
    filters: {
      year,
      month,
      facilityId,
    },
    facilities: merchant.facilities,
    summary,
    monthlyAnalytics,
    facilityPerformance,
    timeAnalytics: getPopularTimeAnalytics(bookings),
    paymentAnalytics,
    highlights: {
      mostBookedFacility,
      highestRevenueFacility,
      lowestRatedFacility,
    },
    actionableInsights: buildActionableInsights({
      mostBookedFacility,
      highestRevenueFacility,
      lowestRatedFacility,
      facilityPerformance,
      pendingVerifications,
      totalBookings: bookings.length,
    }),
  };
}

module.exports = {
  getMerchantAnalytics,
};
