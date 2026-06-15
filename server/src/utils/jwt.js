const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

function signAuthToken({
  userId,
  role,
  customerProfileId = null,
  merchantProfileId = null,
}) {
  return jwt.sign(
    {
      userId,
      role,
      customerProfileId,
      merchantProfileId,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
