const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

module.exports = {
  generateAuthTokens: (user) => {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { id: user.id, version: user.tokenVersion || 0 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  },
  verifyAuthToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
  verifyRefreshToken: (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  },
};
