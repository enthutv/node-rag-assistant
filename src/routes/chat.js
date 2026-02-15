import express from "express";
import logger from "../utils/logger.js";
import pool from "../config/db.js"; // ✅ Added for cost tracking
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

    // ================================
    // ✅ COST LIMIT CHECK (Added Only)
    // ================================
    const { rows } = await pool.query(
      "SELECT total_cost, cost_limit FROM users WHERE id = $1",
      [user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentCost = Number(rows[0].total_cost);
    const costLimit = Number(rows[0].cost_limit);

    if (currentCost >= costLimit) {
      logger.warn("Cost limit exceeded", {
        email: user?.email,
        currentCost,
        costLimit,
      });

      return res.status(403).json({ error: "Cost limit exceeded" });
    }

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

    // ================================
    // ✅ COST UPDATE (Added Only)
    // ================================
    const totalTokens = Number(result?.usage?.total_tokens || 0);
    const estimatedCost = Number(result?.estimatedCost || 0);

    await pool.query(
      `
      UPDATE users
      SET total_tokens = total_tokens + $1,
          total_cost = total_cost + $2,
          daily_cost = daily_cost + $2
      WHERE id = $3
      `,
      [totalTokens, estimatedCost, user.id]
    );

    logger.info("Cost tracking updated", {
      email: user?.email,
      addedTokens: totalTokens,
      addedCost: estimatedCost,
    });

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