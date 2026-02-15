import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    // 1️⃣ Check header existence
    if (!authHeader) {
      logger.warn("Authentication failed: missing Authorization header", {
        ip: req.ip,
        path: req.originalUrl,
      });

      return res.status(401).json({ error: "Access token required" });
    }

    // 2️⃣ Validate Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      logger.warn("Authentication failed: malformed Authorization header", {
        ip: req.ip,
        header: authHeader,
      });

      return res.status(401).json({
        error: "Authorization header must be in format: Bearer <token>",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Authentication failed: token missing after Bearer", {
        ip: req.ip,
      });

      return res.status(401).json({ error: "Access token required" });
    }

    // 3️⃣ Verify JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          logger.warn("Authentication failed: token expired", {
            ip: req.ip,
          });

          return res.status(401).json({ error: "Token expired" });
        }

        logger.warn("Authentication failed: invalid token", {
          ip: req.ip,
          message: err.message,
        });

        return res.status(403).json({ error: "Invalid token" });
      }

      // 4️⃣ Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      logger.info("Authentication successful", {
        email: decoded.email,
        role: decoded.role,
      });

      next();
    });

  } catch (error) {
    logger.error("Authentication middleware error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({ error: "Internal authentication error" });
  }
}