const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const registerTest = async (req, res) => {
  res.json({ message: "Auth controller is working" });
};

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
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
        role: result.newUser.role,
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
    const { fullName, email, password, businessName } = req.body;

    if (!fullName || !email || !password || !businessName) {
      return res.status(400).json({
        message: "Full name, email, password, and business name are required",
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
          passwordHash,
          role: "MERCHANT",
        },
      });

      const merchantProfile = await tx.merchantProfile.create({
        data: {
          userId: newUser.id,
          businessName,
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
        role: result.newUser.role,
      },
      merchantProfile: {
        id: result.merchantProfile.id,
        userId: result.merchantProfile.userId,
        businessName: result.merchantProfile.businessName,
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

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
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