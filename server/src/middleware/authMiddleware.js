const prisma = require("../lib/prisma");
const { verifyAuthToken } = require("../utils/jwt");

async function authenticateToken(req, res, next) {
  const authorizationHeader = String(req.headers.authorization || "");
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  try {
    const decodedToken = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(decodedToken.userId) },
      select: {
        id: true,
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
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Authentication token is no longer valid",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is inactive. Please contact the administrator.",
      });
    }

    if (user.role !== decodedToken.role) {
      return res.status(401).json({
        message: "Authentication token is no longer valid",
      });
    }

    req.auth = {
      userId: user.id,
      role: user.role,
      customerProfileId: user.customerProfile?.id || null,
      merchantProfileId: user.merchantProfile?.id || null,
      merchantApprovalStatus:
        user.merchantProfile?.approvalStatus || null,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.message === "JWT_SECRET is not configured") {
      console.error("JWT authentication configuration error:", error.message);
      return res.status(500).json({
        message: "Authentication is not configured on the server",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication is required",
      });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        message: `${allowedRoles.join(" or ")} access is required`,
      });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
