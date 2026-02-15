import logger from "../utils/logger.js";

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn("RBAC check failed: no user in request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("RBAC forbidden access", {
        email: req.user.email,
        role: req.user.role,
        allowedRoles,
      });

      return res.status(403).json({
        error: "Forbidden: insufficient permissions",
      });
    }

    logger.info("RBAC access granted", {
      email: req.user.email,
      role: req.user.role,
    });

    next();
  };
}
