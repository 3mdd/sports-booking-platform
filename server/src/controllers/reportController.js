const prisma = require("../lib/prisma");

const REPORT_REASONS = new Set([
  "PAYMENT_NO_RESPONSE",
  "VALID_PAYMENT_REJECTED",
  "FACILITY_UNAVAILABLE_AFTER_PAYMENT",
  "MISLEADING_INFORMATION",
  "UNEXPECTED_EXTRA_PAYMENT",
  "FACILITY_NOT_FOUND",
  "SAFETY_OR_SERIOUS_SERVICE_ISSUE",
  "OTHER",
]);

const REPORT_STATUSES = new Set([
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
]);

const ELIGIBLE_BOOKING_STATUSES = new Set([
  "PAYMENT_UPLOADED",
  "CONFIRMED",
  "REJECTED",
]);

const MAX_DESCRIPTION_LENGTH = 1500;
const MAX_ADMIN_NOTE_LENGTH = 1500;

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function normalizeUploadPath(filePath) {
  if (!filePath) return "";

  const normalizedPath = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.indexOf("uploads/");

  return uploadsIndex !== -1
    ? normalizedPath.substring(uploadsIndex)
    : normalizedPath;
}

function buildUploadUrl(req, filePath) {
  const normalizedPath = normalizeUploadPath(filePath);

  if (!normalizedPath) return "";

  if (/^(https?:|data:|blob:)/i.test(normalizedPath)) {
    return normalizedPath;
  }

  return normalizedPath.startsWith("/")
    ? `${getBaseUrl(req)}${normalizedPath}`
    : `${getBaseUrl(req)}/${normalizedPath}`;
}

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getSortedBookingSlots(booking) {
  return [...(booking.bookingSlots || [])]
    .filter((bookingSlot) => bookingSlot.timeSlot)
    .sort(
      (firstSlot, secondSlot) =>
        new Date(firstSlot.timeSlot.startTime).getTime() -
        new Date(secondSlot.timeSlot.startTime).getTime()
    );
}

function buildBookingTimeSummary(booking) {
  const sortedSlots = getSortedBookingSlots(booking);

  if (sortedSlots.length === 0) {
    return {
      startTime: null,
      endTime: null,
      slotCount: 0,
    };
  }

  return {
    startTime: sortedSlots[0].timeSlot.startTime,
    endTime: sortedSlots[sortedSlots.length - 1].timeSlot.endTime,
    slotCount: sortedSlots.length,
  };
}

function buildCustomerReportResponse(report) {
  return {
    id: report.id,
    bookingId: report.bookingId,
    facilityId: report.facilityId,
    merchantProfileId: report.merchantProfileId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    adminNote: report.adminNote,
    reviewedAt: report.reviewedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    facilityName: report.facility?.name || null,
    bookingStatus: report.booking?.status || null,
  };
}

function buildAdminReportResponse(report, req) {
  const customerUser = report.customerProfile.user;
  const merchantUser = report.merchantProfile.user;
  const paymentProof = report.booking.paymentProof;

  return {
    id: report.id,
    reason: report.reason,
    description: report.description,
    status: report.status,
    adminNote: report.adminNote,
    reviewedAt: report.reviewedAt,
    reviewedBy: report.reviewedBy
      ? {
          userId: report.reviewedBy.id,
          fullName: report.reviewedBy.fullName,
          username: report.reviewedBy.username,
        }
      : null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    customer: {
      customerProfileId: report.customerProfileId,
      fullName: customerUser.fullName,
      username: customerUser.username,
      email: customerUser.email,
      phoneNumber: customerUser.phoneNumber,
    },
    merchant: {
      merchantProfileId: report.merchantProfileId,
      merchantUserId: merchantUser.id,
      businessName: report.merchantProfile.businessName,
      approvalStatus: report.merchantProfile.approvalStatus,
      fullName: merchantUser.fullName,
      username: merchantUser.username,
      email: merchantUser.email,
      phoneNumber:
        report.merchantProfile.businessPhone || merchantUser.phoneNumber,
    },
    facility: {
      facilityId: report.facilityId,
      name: report.facility.name,
      location: report.facility.location,
      stateName: report.facility.stateName,
      areaName: report.facility.areaName,
      isActive: report.facility.isActive,
    },
    booking: {
      bookingId: report.bookingId,
      bookingDate: report.booking.bookingDate,
      time: buildBookingTimeSummary(report.booking),
      status: report.booking.status,
      totalPrice: report.booking.totalPrice,
      createdAt: report.booking.createdAt,
    },
    paymentProof: paymentProof
      ? {
          status: paymentProof.status,
          filePath: normalizeUploadPath(paymentProof.filePath),
          fileUrl: buildUploadUrl(req, paymentProof.filePath),
          originalFileName: paymentProof.originalFileName,
          uploadedAt: paymentProof.uploadedAt,
        }
      : null,
  };
}

function isBookingEligibleForReport(booking) {
  if (!ELIGIBLE_BOOKING_STATUSES.has(booking.status)) return false;

  if (booking.status === "REJECTED" && !booking.paymentProof) {
    return false;
  }

  return true;
}

const createReport = async (req, res) => {
  try {
    const customerProfileId = req.auth?.customerProfileId;
    const bookingId = parsePositiveInteger(req.body.bookingId);
    const reason = String(req.body.reason || "").trim();
    const description = String(req.body.description || "").trim();

    if (!customerProfileId) {
      return res.status(403).json({
        message: "Customer profile is required to submit a report",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        message: "Valid booking ID is required",
      });
    }

    if (!REPORT_REASONS.has(reason)) {
      return res.status(400).json({
        message: "Please choose a valid report reason",
      });
    }

    if (!description) {
      return res.status(400).json({
        message: "Report description is required",
      });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        message: `Report description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
      });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        paymentProof: true,
        report: true,
        facility: {
          select: {
            id: true,
            merchantProfileId: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.customerId !== customerProfileId) {
      return res.status(403).json({
        message: "You can only report your own bookings",
      });
    }

    if (!isBookingEligibleForReport(booking)) {
      return res.status(400).json({
        message:
          "This booking is not eligible for reporting. Reports are available only after payment proof upload or confirmation.",
      });
    }

    if (booking.report) {
      return res.status(409).json({
        message: "A report has already been submitted for this booking",
      });
    }

    const report = await prisma.bookingReport.create({
      data: {
        bookingId: booking.id,
        customerProfileId,
        facilityId: booking.facilityId,
        merchantProfileId: booking.facility.merchantProfileId,
        reason,
        description,
      },
      include: {
        facility: {
          select: {
            name: true,
          },
        },
        booking: {
          select: {
            status: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Report submitted successfully. Admin will review it.",
      report: buildCustomerReportResponse(report),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A report has already been submitted for this booking",
      });
    }

    console.error("Create booking report failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getCustomerReports = async (req, res) => {
  try {
    const customerProfileId = req.auth?.customerProfileId;

    if (!customerProfileId) {
      return res.status(403).json({
        message: "Customer profile is required",
      });
    }

    const reports = await prisma.bookingReport.findMany({
      where: {
        customerProfileId,
      },
      include: {
        facility: {
          select: {
            name: true,
          },
        },
        booking: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Customer reports fetched successfully",
      reports: reports.map(buildCustomerReportResponse),
    });
  } catch (error) {
    console.error("Fetch customer reports failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAdminReports = async (req, res) => {
  try {
    const reports = await prisma.bookingReport.findMany({
      include: {
        customerProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        merchantProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            location: true,
            stateName: true,
            areaName: true,
            isActive: true,
          },
        },
        booking: {
          include: {
            paymentProof: true,
            bookingSlots: {
              include: {
                timeSlot: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Admin reports fetched successfully",
      reports: reports.map((report) => buildAdminReportResponse(report, req)),
    });
  } catch (error) {
    console.error("Fetch admin reports failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const reportId = parsePositiveInteger(req.params.reportId);
    const status = String(req.body.status || "").trim();
    const adminNote = String(req.body.adminNote || "").trim();

    if (!reportId) {
      return res.status(400).json({
        message: "Valid report ID is required",
      });
    }

    if (!REPORT_STATUSES.has(status)) {
      return res.status(400).json({
        message: "Please choose a valid report status",
      });
    }

    if (adminNote.length > MAX_ADMIN_NOTE_LENGTH) {
      return res.status(400).json({
        message: `Admin note must be ${MAX_ADMIN_NOTE_LENGTH} characters or fewer`,
      });
    }

    const existingReport = await prisma.bookingReport.findUnique({
      where: {
        id: reportId,
      },
      select: {
        id: true,
      },
    });

    if (!existingReport) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    const report = await prisma.bookingReport.update({
      where: {
        id: reportId,
      },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
        reviewedByUserId: req.auth.userId,
      },
      include: {
        customerProfile: {
          include: {
            user: {
              select: {
                fullName: true,
                username: true,
                email: true,
                phoneNumber: true,
                id: true,
              },
            },
          },
        },
        merchantProfile: {
          include: {
            user: {
              select: {
                fullName: true,
                username: true,
                email: true,
                phoneNumber: true,
                id: true,
              },
            },
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            location: true,
            stateName: true,
            areaName: true,
            isActive: true,
          },
        },
        booking: {
          include: {
            paymentProof: true,
            bookingSlots: {
              include: {
                timeSlot: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Report updated successfully",
      report: buildAdminReportResponse(report, req),
    });
  } catch (error) {
    console.error("Update booking report failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReport,
  getCustomerReports,
  getAdminReports,
  updateReportStatus,
};
