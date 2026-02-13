import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import openai from "./config/openai.js";
import testRoute from "./routes/test.js";
import chatRoute from "./routes/chat.js";
import uploadRoute from "./routes/upload.js";
import logger from "./utils/logger.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

// ======================
// Routes
// ======================
app.use("/api", uploadRoute);
app.use("/api", testRoute);
app.use("/api", chatRoute);

// ======================
// Health Check
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "AI Assistant Running" });
});

// ======================
// OpenAI Test Endpoint
// ======================
app.get("/test-openai", async (req, res) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "hello world",
    });

    const embedding = response.data[0].embedding;

    logger.info("OpenAI test successful", {
      embeddingLength: embedding.length,
    });

    res.json({
      length: embedding.length,
      firstFive: embedding.slice(0, 5),
    });
  } catch (error) {
    logger.error("OpenAI test error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: error.message });
  }
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({ error: "Internal Server Error" });
});

// ======================
// Server Start
// ======================
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running`, { port: PORT });
});