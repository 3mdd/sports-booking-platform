const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const MAX_PHONE_NUMBER_LENGTH = 50;
const MAX_BUSINESS_PHONE_LENGTH = 50;
const MAX_BUSINESS_ADDRESS_LENGTH = 500;
const MAX_REGISTRATION_NUMBER_LENGTH = 100;

function normalizeOptionalText(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

const registerTest = async (req, res) => {
  res.json({ message: "Auth controller is working" });
};

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
      });
    }

    const normalizedPhoneNumber = normalizeOptionalText(phoneNumber);

    if (
      normalizedPhoneNumber &&
      normalizedPhoneNumber.length > MAX_PHONE_NUMBER_LENGTH
    ) {
      return res.status(400).json({
        message: `Phone number must be ${MAX_PHONE_NUMBER_LENGTH} characters or fewer`,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName,
          email,
          phoneNumber: normalizedPhoneNumber,
          passwordHash,
          role: "CUSTOMER",
        },
      });

      const customerProfile = await tx.customerProfile.create({
        data: {
          userId: newUser.id,
        },
      });

      return { newUser, customerProfile };
    });

    return res.status(201).json({
      message: "Customer registered successfully",
      user: {
        id: result.newUser.id,
        fullName: result.newUser.fullName,
        email: result.newUser.email,
        phoneNumber: result.newUser.phoneNumber,
        avatarUrl: result.newUser.avatarUrl,
        role: result.newUser.role,
        isActive: result.newUser.isActive,
      },
      customerProfile: {
        id: result.customerProfile.id,
        userId: result.customerProfile.userId,
      },
    });
  } catch (error) {
    console.error("Customer registration failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const registerMerchant = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      businessName,
      businessPhone,
      businessAddress,
      businessRegistrationNumber,
    } = req.body;

    if (!fullName || !email || !password || !businessName) {
      return res.status(400).json({
        message: "Full name, email, password, and business name are required",
      });
    }

    const normalizedPhoneNumber = normalizeOptionalText(phoneNumber);
    const normalizedBusinessPhone = normalizeOptionalText(businessPhone);
    const normalizedBusinessAddress = normalizeOptionalText(businessAddress);
    const normalizedRegistrationNumber = normalizeOptionalText(
      businessRegistrationNumber
    );

    if (
      normalizedPhoneNumber &&
      normalizedPhoneNumber.length > MAX_PHONE_NUMBER_LENGTH
    ) {
      return res.status(400).json({
        message: `Contact phone number must be ${MAX_PHONE_NUMBER_LENGTH} characters or fewer`,
      });
    }

    if (
      normalizedBusinessPhone &&
      normalizedBusinessPhone.length > MAX_BUSINESS_PHONE_LENGTH
    ) {
      return res.status(400).json({
        message: `Business phone must be ${MAX_BUSINESS_PHONE_LENGTH} characters or fewer`,
      });
    }

    if (
      normalizedBusinessAddress &&
      normalizedBusinessAddress.length > MAX_BUSINESS_ADDRESS_LENGTH
    ) {
      return res.status(400).json({
        message: `Business address must be ${MAX_BUSINESS_ADDRESS_LENGTH} characters or fewer`,
      });
    }

    if (
      normalizedRegistrationNumber &&
      normalizedRegistrationNumber.length > MAX_REGISTRATION_NUMBER_LENGTH
    ) {
      return res.status(400).json({
        message: `Business registration number must be ${MAX_REGISTRATION_NUMBER_LENGTH} characters or fewer`,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName,
          email,
          phoneNumber: normalizedPhoneNumber,
          passwordHash,
          role: "MERCHANT",
        },
      });

      const merchantProfile = await tx.merchantProfile.create({
        data: {
          userId: newUser.id,
          businessName,
          businessPhone: normalizedBusinessPhone,
          businessAddress: normalizedBusinessAddress,
          businessRegistrationNumber: normalizedRegistrationNumber,
          approvalStatus: "PENDING_APPROVAL",
        },
      });

      return { newUser, merchantProfile };
    });

    return res.status(201).json({
      message: "Merchant registered successfully",
      user: {
        id: result.newUser.id,
        fullName: result.newUser.fullName,
        email: result.newUser.email,
        phoneNumber: result.newUser.phoneNumber,
        avatarUrl: result.newUser.avatarUrl,
        role: result.newUser.role,
        isActive: result.newUser.isActive,
      },
      merchantProfile: {
        id: result.merchantProfile.id,
        userId: result.merchantProfile.userId,
        businessName: result.merchantProfile.businessName,
        businessPhone: result.merchantProfile.businessPhone,
        businessAddress: result.merchantProfile.businessAddress,
        businessRegistrationNumber:
          result.merchantProfile.businessRegistrationNumber,
        approvalStatus: result.merchantProfile.approvalStatus,
        approvalNote: result.merchantProfile.approvalNote,
      },
    });
  } catch (error) {
    console.error("Merchant registration failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        merchantProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive. Please contact the administrator.",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        customerProfile: user.customerProfile,
        merchantProfile: user.merchantProfile,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerTest,
  registerCustomer,
  registerMerchant,
  loginUser,
};
