import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import pool from "../config/db.js";

const router = express.Router();

// ==============================
// REGISTER
// ==============================
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
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

// ==============================
// LOGIN
// ==============================
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

export default router;