const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");

/**
 * Role-based access control middleware.
 * Must be used AFTER auth middleware (needs req.userId).
 *
 * Usage:
 *   router.get("/admin-only", auth, requireRole("admin"), controller);
 *   router.get("/staff", auth, requireRole("admin", "faculty"), controller);
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return ApiResponse.unauthorized("Authentication required").send(res);
      }

      const user = await User.findById(req.userId).select("-password -__v");

      if (!user) {
        return ApiResponse.unauthorized("User not found — token may be invalid").send(res);
      }

      if (user.status === "inactive") {
        return ApiResponse.forbidden("Account is deactivated").send(res);
      }

      if (!allowedRoles.includes(user.role)) {
        return ApiResponse.forbidden(
          `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${user.role}`
        ).send(res);
      }

      // Attach user info for downstream controllers
      req.user = user;
      req.userRole = user.role;
      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);
      return ApiResponse.internalServerError().send(res);
    }
  };
};

module.exports = requireRole;
