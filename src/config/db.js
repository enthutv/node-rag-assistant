import pkg from "pg";
import logger from "../utils/logger.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  logger.info("PostgreSQL connected");
});

pool.on("error", (err) => {
  logger.error("PostgreSQL connection error", {
    message: err.message,
    stack: err.stack,
  });
});

export default pool;

export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    logger.info("Users table ready");
  } catch (error) {
    logger.error("Database initialization error", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}