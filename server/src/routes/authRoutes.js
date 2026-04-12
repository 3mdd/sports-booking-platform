const express = require("express");
const {
  registerTest,
  registerCustomer,
  registerMerchant,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

router.get("/auth/test", registerTest);
router.post("/auth/register/customer", registerCustomer);
router.post("/auth/register/merchant", registerMerchant);
router.post("/auth/login", loginUser);

module.exports = router;