const prisma = require("../lib/prisma");

const MAX_APPROVAL_NOTE_LENGTH = 500;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

async function verifyAdminRequest(req, res) {
  const userId = parsePositiveInteger(req.headers["x-user-id"]);

  if (!userId) {
    res.status(401).json({
      message: "Admin user ID is required",
    });
    return false;
  }

  const adminUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  if (!adminUser) {
    res.status(403).json({
      message: "Admin access is required",
    });
    return false;
  }

  return true;
}

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
  getAdminMerchants,
  approveMerchant,
  rejectMerchant,
};
