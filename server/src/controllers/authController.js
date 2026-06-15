const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const MAX_PHONE_NUMBER_LENGTH = 50;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MAX_BUSINESS_PHONE_LENGTH = 50;
const MAX_BUSINESS_ADDRESS_LENGTH = 500;
const MAX_REGISTRATION_NUMBER_LENGTH = 100;

function normalizeOptionalText(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validateUsername(username) {
  if (
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH
  ) {
    return `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`;
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }

  return null;
}

async function findExistingRegistrationUser(email, username) {
  return prisma.user.findFirst({
    where: {
      OR: [
        {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        { username },
      ],
    },
    select: {
      email: true,
      username: true,
    },
  });
}

function getUniqueConstraintMessage(error) {
  if (error.code !== "P2002") return null;

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(",")
    : String(error.meta?.target || "");

  return target.includes("username")
    ? "Username is already taken"
    : "Email is already registered";
}

const registerTest = async (req, res) => {
  res.json({ message: "Auth controller is working" });
};

const registerCustomer = async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password } = req.body;
    const normalizedFullName = String(fullName || "").trim();
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhoneNumber = normalizeOptionalText(phoneNumber);

    if (
      !normalizedFullName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedPhoneNumber ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Full name, username, email, phone number, and password are required",
      });
    }

    const usernameError = validateUsername(normalizedUsername);

    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    if (normalizedPhoneNumber.length > MAX_PHONE_NUMBER_LENGTH) {
      return res.status(400).json({
        message: `Phone number must be ${MAX_PHONE_NUMBER_LENGTH} characters or fewer`,
      });
    }

    const existingUser = await findExistingRegistrationUser(
      normalizedEmail,
      normalizedUsername
    );

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.username === normalizedUsername
            ? "Username is already taken"
            : "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: normalizedFullName,
          username: normalizedUsername,
          email: normalizedEmail,
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
        username: result.newUser.username,
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
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);

    if (uniqueConstraintMessage) {
      return res.status(409).json({ message: uniqueConstraintMessage });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const registerMerchant = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      phoneNumber,
      password,
      businessName,
      businessPhone,
      businessAddress,
      businessRegistrationNumber,
    } = req.body;
    const normalizedFullName = String(fullName || "").trim();
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhoneNumber = normalizeOptionalText(phoneNumber);
    const normalizedBusinessName = String(businessName || "").trim();

    if (
      !normalizedFullName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedPhoneNumber ||
      !password ||
      !normalizedBusinessName
    ) {
      return res.status(400).json({
        message:
          "Full name, username, email, contact phone number, password, and business name are required",
      });
    }

    const usernameError = validateUsername(normalizedUsername);

    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    const normalizedBusinessPhone = normalizeOptionalText(businessPhone);
    const normalizedBusinessAddress = normalizeOptionalText(businessAddress);
    const normalizedRegistrationNumber = normalizeOptionalText(
      businessRegistrationNumber
    );

    if (
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

    const existingUser = await findExistingRegistrationUser(
      normalizedEmail,
      normalizedUsername
    );

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.username === normalizedUsername
            ? "Username is already taken"
            : "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: normalizedFullName,
          username: normalizedUsername,
          email: normalizedEmail,
          phoneNumber: normalizedPhoneNumber,
          passwordHash,
          role: "MERCHANT",
        },
      });

      const merchantProfile = await tx.merchantProfile.create({
        data: {
          userId: newUser.id,
          businessName: normalizedBusinessName,
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
        username: result.newUser.username,
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
    const uniqueConstraintMessage = getUniqueConstraintMessage(error);

    if (uniqueConstraintMessage) {
      return res.status(409).json({ message: uniqueConstraintMessage });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { loginIdentifier, email, password } = req.body;
    const normalizedIdentifier = String(loginIdentifier || email || "")
      .trim()
      .toLowerCase();

    if (!normalizedIdentifier || !password) {
      return res.status(400).json({
        message: "Email or username and password are required",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: normalizedIdentifier,
              mode: "insensitive",
            },
          },
          { username: normalizedIdentifier },
        ],
      },
      include: {
        customerProfile: true,
        merchantProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email, username, or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email, username, or password",
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
        username: user.username,
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
