const prisma = require("../lib/prisma");
const {
  getVerificationDeadlineInfo,
} = require("../services/bookingVerificationService");

const MAX_APPROVAL_NOTE_LENGTH = 500;
const PROTECTED_ADMIN_EMAIL = "admin@elitesport.test";

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

async function verifyAdminRequest(req, res) {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({
      message: "Admin access is required",
    });
    return false;
  }

  return true;
}

function buildUserResponse(user) {
  return {
    userId: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    customerProfileId: user.customerProfile?.id || null,
    merchantProfileId: user.merchantProfile?.id || null,
    businessName: user.merchantProfile?.businessName || null,
    merchantApprovalStatus:
      user.merchantProfile?.approvalStatus || null,
  };
}

function buildFacilityResponse(facility) {
  const merchantUser = facility.merchantProfile.user;

  return {
    facilityId: facility.id,
    name: facility.name,
    location: facility.location,
    stateName: facility.stateName,
    areaName: facility.areaName,
    isActive: facility.isActive,
    sportType: facility.sportType,
    merchantProfileId: facility.merchantProfile.id,
    businessName: facility.merchantProfile.businessName,
    merchantFullName: merchantUser.fullName,
    merchantUsername: merchantUser.username,
    merchantEmail: merchantUser.email,
    merchantPhone:
      facility.merchantProfile.businessPhone || merchantUser.phoneNumber,
    merchantApprovalStatus: facility.merchantProfile.approvalStatus,
    merchantUserActive: merchantUser.isActive,
    createdAt: facility.createdAt,
  };
}

const getAdminDashboard = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const [
      totalUsers,
      customers,
      merchants,
      admins,
      pendingMerchants,
      facilities,
      bookings,
      confirmedBookings,
      pendingVerificationBookings,
      reviews,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "MERCHANT" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.merchantProfile.count({
        where: { approvalStatus: "PENDING_APPROVAL" },
      }),
      prisma.facility.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.findMany({
        where: { status: "PAYMENT_UPLOADED" },
        select: {
          status: true,
          bookingSlots: {
            select: {
              timeSlot: {
                select: {
                  startTime: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count(),
    ]);
    const currentTime = new Date();
    const overduePaymentVerification = pendingVerificationBookings.filter(
      (booking) =>
        getVerificationDeadlineInfo(booking, currentTime).verificationOverdue
    ).length;

    return res.status(200).json({
      message: "Admin dashboard fetched successfully",
      totals: {
        users: totalUsers,
        customers,
        merchants,
        admins,
        pendingMerchants,
        facilities,
        bookings,
        confirmedBookings,
        pendingVerification: pendingVerificationBookings.length,
        overduePaymentVerification,
        reviews,
      },
    });
  } catch (error) {
    console.error("Fetch admin dashboard failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        customerProfile: {
          select: {
            id: true,
          },
        },
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Admin users fetched successfully",
      users: users.map(buildUserResponse),
    });
  } catch (error) {
    console.error("Fetch admin users failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

async function updateUserActiveStatus(req, res, isActive) {
  if (!(await verifyAdminRequest(req, res))) return;

  const userId = parsePositiveInteger(req.params.userId);

  if (!userId) {
    return res.status(400).json({
      message: "Valid user ID is required",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (!isActive && existingUser.email === PROTECTED_ADMIN_EMAIL) {
    return res.status(403).json({
      message: "The seeded EliteSport admin account cannot be deactivated",
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      customerProfile: {
        select: {
          id: true,
        },
      },
      merchantProfile: {
        select: {
          id: true,
          businessName: true,
          approvalStatus: true,
        },
      },
    },
  });

  return res.status(200).json({
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    user: buildUserResponse(user),
  });
}

const activateUser = async (req, res) => {
  try {
    return await updateUserActiveStatus(req, res, true);
  } catch (error) {
    console.error("Activate user failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deactivateUser = async (req, res) => {
  try {
    return await updateUserActiveStatus(req, res, false);
  } catch (error) {
    console.error("Deactivate user failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAdminFacilities = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const facilities = await prisma.facility.findMany({
      include: {
        sportType: {
          select: {
            id: true,
            name: true,
          },
        },
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            businessPhone: true,
            approvalStatus: true,
            user: {
              select: {
                fullName: true,
                username: true,
                email: true,
                phoneNumber: true,
                isActive: true,
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
      message: "Admin facilities fetched successfully",
      facilities: facilities.map(buildFacilityResponse),
    });
  } catch (error) {
    console.error("Fetch admin facilities failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

async function updateFacilityActiveStatus(req, res, isActive) {
  if (!(await verifyAdminRequest(req, res))) return;

  const facilityId = parsePositiveInteger(req.params.facilityId);

  if (!facilityId) {
    return res.status(400).json({
      message: "Valid facility ID is required",
    });
  }

  const existingFacility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { id: true },
  });

  if (!existingFacility) {
    return res.status(404).json({
      message: "Facility not found",
    });
  }

  const facility = await prisma.facility.update({
    where: { id: facilityId },
    data: { isActive },
    include: {
      sportType: {
        select: {
          id: true,
          name: true,
        },
      },
      merchantProfile: {
        select: {
          id: true,
          businessName: true,
          businessPhone: true,
          approvalStatus: true,
          user: {
            select: {
              fullName: true,
              username: true,
              email: true,
              phoneNumber: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  return res.status(200).json({
    message: `Facility ${isActive ? "activated" : "deactivated"} successfully`,
    facility: buildFacilityResponse(facility),
  });
}

const activateFacility = async (req, res) => {
  try {
    return await updateFacilityActiveStatus(req, res, true);
  } catch (error) {
    console.error("Activate facility failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deactivateFacility = async (req, res) => {
  try {
    return await updateFacilityActiveStatus(req, res, false);
  } catch (error) {
    console.error("Deactivate facility failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

function buildMerchantResponse(merchant) {
  return {
    merchantProfileId: merchant.id,
    businessName: merchant.businessName,
    businessPhone: merchant.businessPhone,
    businessAddress: merchant.businessAddress,
    businessRegistrationNumber: merchant.businessRegistrationNumber,
    verificationDocumentUrl: merchant.verificationDocumentUrl,
    ownershipProofUrl: merchant.ownershipProofUrl,
    fullName: merchant.user.fullName,
    username: merchant.user.username,
    email: merchant.user.email,
    phoneNumber: merchant.user.phoneNumber,
    approvalStatus: merchant.approvalStatus,
    approvalNote: merchant.approvalNote,
    approvedAt: merchant.approvedAt,
    createdAt: merchant.createdAt,
  };
}

const getAdminMerchants = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const merchants = await prisma.merchantProfile.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Merchants fetched successfully",
      merchants: merchants.map(buildMerchantResponse),
    });
  } catch (error) {
    console.error("Fetch admin merchants failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const approveMerchant = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const existingMerchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });

    if (!existingMerchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        approvalStatus: "APPROVED",
        approvalNote: null,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Merchant approved successfully",
      merchant: buildMerchantResponse(merchant),
    });
  } catch (error) {
    console.error("Approve merchant failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const rejectMerchant = async (req, res) => {
  try {
    if (!(await verifyAdminRequest(req, res))) return;

    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const approvalNote = String(req.body.approvalNote || "").trim();

    if (approvalNote.length > MAX_APPROVAL_NOTE_LENGTH) {
      return res.status(400).json({
        message: `Approval note must be ${MAX_APPROVAL_NOTE_LENGTH} characters or fewer`,
      });
    }

    const existingMerchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: { id: true },
    });

    if (!existingMerchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        approvalStatus: "REJECTED",
        approvalNote: approvalNote || null,
        approvedAt: null,
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Merchant rejected successfully",
      merchant: buildMerchantResponse(merchant),
    });
  } catch (error) {
    console.error("Reject merchant failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  activateUser,
  deactivateUser,
  getAdminFacilities,
  activateFacility,
  deactivateFacility,
  getAdminMerchants,
  approveMerchant,
  rejectMerchant,
};
