const prisma = require("../lib/prisma");
const { analyzeReviewSentiment } = require("../services/sentimentService");
const {
  buildReviewInsightSummary,
} = require("../services/reviewInsightService");

const MAX_COMMENT_LENGTH = 1000;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

const createReview = async (req, res) => {
  try {
    const { customerId, facilityId, bookingId, rating, comment } = req.body;

    const parsedCustomerId = parsePositiveInteger(customerId);
    const parsedFacilityId = parsePositiveInteger(facilityId);
    const parsedBookingId = parsePositiveInteger(bookingId);
    const parsedRating = Number(rating);

    if (!parsedCustomerId || !parsedFacilityId || !parsedBookingId) {
      return res.status(400).json({
        message: "customerId, facilityId, and bookingId are required",
      });
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer from 1 to 5",
      });
    }

    const trimmedComment =
      comment === undefined || comment === null ? "" : String(comment).trim();

    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`,
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parsedBookingId },
      include: {
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.customerId !== parsedCustomerId ||
      booking.facilityId !== parsedFacilityId
    ) {
      return res.status(400).json({
        message: "Booking does not match the selected customer and facility",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only confirmed bookings can be reviewed",
      });
    }

    if (booking.review) {
      return res.status(409).json({
        message: "A review already exists for this booking",
      });
    }

    const sentimentAnalysis = await analyzeReviewSentiment(trimmedComment);

    const review = await prisma.review.create({
      data: {
        bookingId: parsedBookingId,
        customerId: parsedCustomerId,
        facilityId: parsedFacilityId,
        rating: parsedRating,
        comment: trimmedComment || null,
        sentimentLabel: sentimentAnalysis.sentimentLabel,
        sentimentScore: sentimentAnalysis.sentimentScore,
        sentimentProvider: sentimentAnalysis.sentimentProvider,
        sentimentAnalyzedAt: sentimentAnalysis.sentimentAnalyzedAt,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Create review failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getReviewsByFacility = async (req, res) => {
  try {
    const facilityId = parsePositiveInteger(req.params.facilityId);

    if (!facilityId) {
      return res.status(400).json({
        message: "Valid facility ID is required",
      });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });

    if (!facility) {
      return res.status(404).json({
        message: "Facility not found",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        facilityId,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Facility reviews fetched successfully",
      reviews,
    });
  } catch (error) {
    console.error("Fetch facility reviews failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getReviewsByCustomer = async (req, res) => {
  try {
    const customerId = parsePositiveInteger(req.params.customerId);

    if (!customerId) {
      return res.status(400).json({
        message: "Valid customer ID is required",
      });
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer profile not found",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        customerId,
      },
      include: {
        facility: {
          include: {
            sportType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Customer reviews fetched successfully",
      reviews,
    });
  } catch (error) {
    console.error("Fetch customer reviews failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getReviewsByMerchant = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });

    if (!merchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        facility: {
          merchantProfileId: merchantId,
        },
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        facility: {
          include: {
            sportType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Merchant reviews fetched successfully",
      reviews,
      insightSummary: buildReviewInsightSummary(reviews),
    });
  } catch (error) {
    console.error("Fetch merchant reviews failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReview,
  getReviewsByFacility,
  getReviewsByCustomer,
  getReviewsByMerchant,
};
