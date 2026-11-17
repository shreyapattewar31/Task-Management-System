const jwt = require("jsonwebtoken");
const User = require("../models/Users");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB on every request so deactivation takes effect
    // immediately without waiting for the JWT to expire.
    const user = await User.findById(decoded.userId).select("_id role isActive");

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please log in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        code: "ACCOUNT_DEACTIVATED",
        message: "Your account has been deactivated. Please contact the admin.",
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = { protect };
