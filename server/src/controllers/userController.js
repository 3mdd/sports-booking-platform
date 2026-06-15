const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const { validatePhoneNumber } = require("../utils/phoneValidation");

const MAX_FULL_NAME_LENGTH = 100;

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

const userProfileSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phoneNumber: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  customerProfile: {
    select: {
      id: true,
    },
  },
  merchantProfile: {
    select: {
      id: true,
      approvalStatus: true,
      approvalNote: true,
    },
  },
};

async function requireProfileOwner(req, res, next) {
  const requestedUserId = parsePositiveInteger(req.params.userId);
  const sessionUserId = parsePositiveInteger(req.headers["x-user-id"]);

  if (!requestedUserId) {
    return res.status(400).json({ message: "Valid user ID is required" });
  }

  if (!sessionUserId) {
    return res.status(401).json({ message: "Logged-in user ID is required" });
  }

  if (requestedUserId !== sessionUserId) {
    return res.status(403).json({
      message: "You can only access your own profile",
    });
  }

  req.profileUserId = requestedUserId;
  return next();
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.profileUserId },
      select: userProfileSelect,
    });

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get user profile failed:", error);
    return res.status(500).json({ message: "Unable to load profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "fullName")) {
      const fullName = String(req.body.fullName || "").trim();

      if (!fullName) {
        return res.status(400).json({ message: "Full name cannot be empty" });
      }

      if (fullName.length > MAX_FULL_NAME_LENGTH) {
        return res.status(400).json({
          message: `Full name must be ${MAX_FULL_NAME_LENGTH} characters or fewer`,
        });
      }

      updateData.fullName = fullName;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "phoneNumber")) {
      const phoneNumber = String(req.body.phoneNumber || "").trim();
      const phoneNumberError = validatePhoneNumber(phoneNumber, {
        required: true,
      });

      if (phoneNumberError) {
        return res.status(400).json({ message: phoneNumberError });
      }

      updateData.phoneNumber = phoneNumber;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Provide a full name or phone number to update",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.profileUserId },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const user = await prisma.user.update({
      where: { id: req.profileUserId },
      data: updateData,
      select: userProfileSelect,
    });

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user profile failed:", error);
    return res.status(500).json({ message: "Unable to update profile" });
  }
}

async function updateAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an avatar image" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.profileUserId },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    if (!existingUser) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: "User profile not found" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.profileUserId },
      data: { avatarUrl },
      select: userProfileSelect,
    });

    if (existingUser.avatarUrl?.startsWith("/uploads/avatars/")) {
      const oldAvatarPath = path.join(
        __dirname,
        "../../uploads/avatars",
        path.basename(existingUser.avatarUrl)
      );
      fs.unlink(oldAvatarPath, () => {});
    }

    return res.json({
      message: "Avatar updated successfully",
      user,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("Update user avatar failed:", error);
    return res.status(500).json({ message: "Unable to update avatar" });
  }
}

module.exports = {
  requireProfileOwner,
  getProfile,
  updateProfile,
  updateAvatar,
};
