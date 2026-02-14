import express from "express";
import logger from "../utils/logger.js";
import { createEmbedding } from "../services/embedService.js";
import { queryVector } from "../services/vectorService.js";
import { generateAnswer } from "../services/chatService.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    logger.info("Chat route hit");

    const { question } = req.body;

    if (!question) {
      logger.warn("Chat request missing question");
      return res.status(400).json({ error: "Question is required" });
    }

    logger.info("Processing chat request", {
      questionLength: question.length,
    });

    // 1️⃣ Create embedding from question
    const embedding = await createEmbedding(question);

    // 2️⃣ Query Pinecone for relevant context
    const matches = await queryVector(embedding);

    logger.info("Vector query completed", {
      matchCount: matches?.length || 0,
    });

    const context = matches
      ?.map(match => match.metadata?.text || "")
      .join("\n") || "";

    // 3️⃣ Generate answer using GPT
    const result = await generateAnswer(context, question);

    logger.info("Chat response generated", {
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
      details: error.message,
    });
  }
});

export default router;