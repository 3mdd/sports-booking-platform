const express = require("express");
const { avatarUpload } = require("../config/multer");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  requireProfileOwner,
  getProfile,
  updateProfile,
  updateAvatar,
} = require("../controllers/userController");

const router = express.Router();

router.use(authenticateToken);

const handleAvatarUpload = (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return next();
  });
};

router.get("/users/:userId/profile", requireProfileOwner, getProfile);
router.patch("/users/:userId/profile", requireProfileOwner, updateProfile);
router.patch(
  "/users/:userId/avatar",
  requireProfileOwner,
  handleAvatarUpload,
  updateAvatar
);

module.exports = router;
