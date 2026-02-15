import express from "express";
import logger from "../utils/logger.js";
import { createEmbedding } from "../services/embedService.js";
import { queryVector } from "../services/vectorService.js";
import { generateAnswer } from "../services/chatService.js";

const router = express.Router();

/**
 * POST /api/chat
 * 🔒 Admin + User allowed (RBAC enforced in app.js)
 */
router.post("/", async (req, res) => {
  try {
    const user = req.user; // injected by authenticateToken
    const { question } = req.body;

    logger.info("Chat route hit", {
      email: user?.email,
      role: user?.role,
    });

    if (!question || typeof question !== "string") {
      logger.warn("Chat request missing or invalid question", {
        email: user?.email,
      });

      return res.status(400).json({ error: "Question is required" });
    }

    logger.info("Processing chat request", {
      email: user?.email,
      questionLength: question.length,
    });

    // 1️⃣ Create embedding from question
    const embedding = await createEmbedding(question);

    if (!embedding || embedding.length === 0) {
      logger.error("Embedding failed for chat request", {
        email: user?.email,
      });

      return res.status(500).json({ error: "Embedding failed" });
    }

    // 2️⃣ Query Pinecone
    const matches = await queryVector(embedding);

    logger.info("Vector query completed", {
      email: user?.email,
      matchCount: matches?.length || 0,
    });

    const context =
      matches
        ?.map(match => match.metadata?.text || "")
        .filter(Boolean)
        .join("\n") || "";

    // 3️⃣ Generate GPT answer
    const result = await generateAnswer(context, question);

    if (!result || !result.answer) {
      logger.error("Chat completion failed", {
        email: user?.email,
      });

      return res.status(500).json({ error: "Failed to generate answer" });
    }

    logger.info("Chat response generated", {
      email: user?.email,
      totalTokens: result?.usage?.total_tokens,
      estimatedCost: result?.estimatedCost,
    });

    res.json({
      answer: result.answer,
      usage: result.usage,
      estimatedCost: result.estimatedCost,
      matchCount: matches?.length || 0,
    });

  } catch (error) {
    logger.error("Chat route error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;