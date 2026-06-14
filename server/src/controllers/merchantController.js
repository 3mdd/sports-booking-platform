const prisma = require("../lib/prisma");
const {
  getMerchantAnalytics: buildMerchantAnalytics,
} = require("../services/merchantAnalyticsService");

const MAX_INSTRUCTIONS_LENGTH = 500;
const MAX_BUSINESS_PHONE_LENGTH = 50;
const MAX_BUSINESS_ADDRESS_LENGTH = 500;
const MAX_REGISTRATION_NUMBER_LENGTH = 100;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeOptionalText(value) {
  if (value === undefined) return undefined;

  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

function buildPaymentDetails(merchant) {
  return {
    merchantId: merchant.id,
    businessName: merchant.businessName,
    paymentBankName: merchant.paymentBankName,
    paymentAccountName: merchant.paymentAccountName,
    paymentAccountNumber: merchant.paymentAccountNumber,
    paymentInstructions: merchant.paymentInstructions,
    paymentQrImageUrl: merchant.paymentQrImageUrl,
  };
}

function buildVerificationDetails(merchant) {
  return {
    merchantId: merchant.id,
    businessName: merchant.businessName,
    businessPhone: merchant.businessPhone,
    businessAddress: merchant.businessAddress,
    businessRegistrationNumber: merchant.businessRegistrationNumber,
    verificationDocumentUrl: merchant.verificationDocumentUrl,
    ownershipProofUrl: merchant.ownershipProofUrl,
  };
}

const requireMerchantOwner = async (req, res, next) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);
    const userId = parsePositiveInteger(req.headers["x-user-id"]);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Merchant user ID is required",
      });
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    if (merchant.userId !== userId) {
      return res.status(403).json({
        message: "You can only access your own merchant account",
      });
    }

    return next();
  } catch (error) {
    console.error("Merchant ownership check failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMerchantVerification = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
        businessRegistrationNumber: true,
        verificationDocumentUrl: true,
        ownershipProofUrl: true,
      },
    });

    return res.status(200).json({
      message: "Merchant verification fetched successfully",
      verification: buildVerificationDetails(merchant),
    });
  } catch (error) {
    console.error("Fetch merchant verification failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateMerchantVerification = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);
    const businessPhone = normalizeOptionalText(req.body.businessPhone);
    const businessAddress = normalizeOptionalText(req.body.businessAddress);
    const businessRegistrationNumber = normalizeOptionalText(
      req.body.businessRegistrationNumber
    );

    if (businessPhone && businessPhone.length > MAX_BUSINESS_PHONE_LENGTH) {
      return res.status(400).json({
        message: `Business phone must be ${MAX_BUSINESS_PHONE_LENGTH} characters or fewer`,
      });
    }

    if (businessAddress && businessAddress.length > MAX_BUSINESS_ADDRESS_LENGTH) {
      return res.status(400).json({
        message: `Business address must be ${MAX_BUSINESS_ADDRESS_LENGTH} characters or fewer`,
      });
    }

    if (
      businessRegistrationNumber &&
      businessRegistrationNumber.length > MAX_REGISTRATION_NUMBER_LENGTH
    ) {
      return res.status(400).json({
        message: `Business registration number must be ${MAX_REGISTRATION_NUMBER_LENGTH} characters or fewer`,
      });
    }

    const updateData = {};

    if (businessPhone !== undefined) {
      updateData.businessPhone = businessPhone;
    }

    if (businessAddress !== undefined) {
      updateData.businessAddress = businessAddress;
    }

    if (businessRegistrationNumber !== undefined) {
      updateData.businessRegistrationNumber = businessRegistrationNumber;
    }

    const verificationDocument = req.files?.verificationDocument?.[0];
    const ownershipProof = req.files?.ownershipProof?.[0];

    if (verificationDocument) {
      updateData.verificationDocumentUrl =
        `uploads/merchant-verification/${verificationDocument.filename}`;
    }

    if (ownershipProof) {
      updateData.ownershipProofUrl =
        `uploads/merchant-verification/${ownershipProof.filename}`;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No verification details provided to update",
      });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
        businessRegistrationNumber: true,
        verificationDocumentUrl: true,
        ownershipProofUrl: true,
      },
    });

    return res.status(200).json({
      message: "Merchant verification updated successfully",
      verification: buildVerificationDetails(merchant),
    });
  } catch (error) {
    console.error("Update merchant verification failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const requireApprovedMerchant = async (req, res, next) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    if (merchant.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message:
          "Merchant account must be approved before updating payment settings",
      });
    }

    return next();
  } catch (error) {
    console.error("Merchant approval check failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMerchantPaymentDetails = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        businessName: true,
        paymentBankName: true,
        paymentAccountName: true,
        paymentAccountNumber: true,
        paymentInstructions: true,
        paymentQrImageUrl: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    return res.status(200).json({
      message: "Merchant payment details fetched successfully",
      paymentDetails: buildPaymentDetails(merchant),
    });
  } catch (error) {
    console.error("Fetch merchant payment details failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateMerchantPaymentDetails = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);

    if (!merchantId) {
      return res.status(400).json({
        message: "Valid merchant ID is required",
      });
    }

    const existingMerchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (!existingMerchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    if (existingMerchant.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message:
          "Merchant account must be approved before updating payment settings",
      });
    }

    const paymentBankName = normalizeOptionalText(req.body.paymentBankName);
    const paymentAccountName = normalizeOptionalText(
      req.body.paymentAccountName
    );
    const paymentAccountNumber = normalizeOptionalText(
      req.body.paymentAccountNumber
    );
    const paymentInstructions = normalizeOptionalText(
      req.body.paymentInstructions
    );

    if (
      paymentInstructions &&
      paymentInstructions.length > MAX_INSTRUCTIONS_LENGTH
    ) {
      return res.status(400).json({
        message: `Payment instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer`,
      });
    }

    const updateData = {};

    if (paymentBankName !== undefined) {
      updateData.paymentBankName = paymentBankName;
    }

    if (paymentAccountName !== undefined) {
      updateData.paymentAccountName = paymentAccountName;
    }

    if (paymentAccountNumber !== undefined) {
      updateData.paymentAccountNumber = paymentAccountNumber;
    }

    if (paymentInstructions !== undefined) {
      updateData.paymentInstructions = paymentInstructions;
    }

    if (req.file) {
      updateData.paymentQrImageUrl = `uploads/payment-qr/${req.file.filename}`;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No payment details provided to update",
      });
    }

    const merchant = await prisma.merchantProfile.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        paymentBankName: true,
        paymentAccountName: true,
        paymentAccountNumber: true,
        paymentInstructions: true,
        paymentQrImageUrl: true,
      },
    });

    return res.status(200).json({
      message: "Merchant payment details updated successfully",
      paymentDetails: buildPaymentDetails(merchant),
    });
  } catch (error) {
    console.error("Update merchant payment details failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMerchantAnalytics = async (req, res) => {
  try {
    const merchantId = parsePositiveInteger(req.params.merchantId);
    const currentYear = new Date().getUTCFullYear();
    const year =
      req.query.year === undefined || req.query.year === ""
        ? currentYear
        : Number(req.query.year);
    const month =
      req.query.month === undefined || req.query.month === ""
        ? null
        : Number(req.query.month);
    const facilityId =
      req.query.facilityId === undefined || req.query.facilityId === ""
        ? null
        : parsePositiveInteger(req.query.facilityId);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        message: "Year must be a whole number between 2000 and 2100",
      });
    }

    if (
      month !== null &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      return res.status(400).json({
        message: "Month must be a whole number between 1 and 12",
      });
    }

    if (
      req.query.facilityId !== undefined &&
      req.query.facilityId !== "" &&
      !facilityId
    ) {
      return res.status(400).json({
        message: "Facility ID must be a positive whole number",
      });
    }

    const analytics = await buildMerchantAnalytics({
      merchantId,
      year,
      month,
      facilityId,
    });

    if (!analytics) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    return res.status(200).json({
      message: "Merchant analytics fetched successfully",
      analytics,
    });
  } catch (error) {
    console.error("Fetch merchant analytics failed:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  requireMerchantOwner,
  requireApprovedMerchant,
  getMerchantVerification,
  updateMerchantVerification,
  getMerchantPaymentDetails,
  updateMerchantPaymentDetails,
  getMerchantAnalytics,
};
