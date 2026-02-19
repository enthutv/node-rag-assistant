import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();

/**
 * ==============================
 * JWT VERIFY MIDDLEWARE
 * ==============================
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * ==============================
 * REGISTER
 * ==============================
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role`,
      [email, hashedPassword, role || "user"]
    );

    logger.info("User registered", {
      email,
      role: role || "user",
    });

    res.json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });

  } catch (error) {
    logger.error("Registration error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * ==============================
 * LOGIN
 * ==============================
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("User logged in", {
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
    });

  } catch (error) {
    logger.error("Login error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * ==============================
 * GET CURRENT USER (Cost Meter)
 * GET /auth/me
 * ==============================
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT email, role,
              COALESCE(daily_cost, 0) AS daily_cost,
              COALESCE(cost_limit, 1) AS cost_limit
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const user = result.rows[0];

    res.json({
      email: user.email,
      role: user.role,
      daily_cost: Number(user.daily_cost),
      daily_limit: Number(user.cost_limit),
    });

  } catch (error) {
    logger.error("Fetch /auth/me error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Internal server error",
    });
  }
});
// ==============================
// GET CURRENT USER + USAGE
// ==============================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, email, role, cost_limit, daily_cost FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userResult.rows[0]);

  } catch (error) {
    logger.error("Auth /me error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;