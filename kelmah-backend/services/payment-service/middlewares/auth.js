const { verifyAccessToken, decodeUserFromClaims } = require("../../../shared/utils/jwt");
const { User } = require("../models");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyAccessToken(token);
    const claims = decodeUserFromClaims(decoded);
    const userId = claims?.id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(userId)
      .select("_id email role isActive tokenVersion deletedAt")
      .lean();

    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (
      Number.isFinite(decoded?.version) &&
      Number.isFinite(user.tokenVersion) &&
      decoded.version !== user.tokenVersion
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      version: user.tokenVersion ?? claims.version,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };
