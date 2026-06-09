const prisma = require("../lib/prisma");

const MAX_INSTRUCTIONS_LENGTH = 500;

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
      select: { id: true },
    });

    if (!existingMerchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
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

module.exports = {
  getMerchantPaymentDetails,
  updateMerchantPaymentDetails,
};
