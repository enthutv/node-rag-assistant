import express from "express";
import crypto from "crypto";
import { createEmbedding } from "../services/embedService.js";
import { upsertVector } from "../services/vectorService.js";
import { chunkText } from "../utils/chunker.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/upload
 * 🔒 Admin only (protected in app.js via RBAC middleware)
 */
router.post("/", async (req, res) => {
  try {
    const user = req.user; // injected by authenticateToken
    const { text } = req.body;

    logger.info("Upload route hit", {
      email: user?.email,
      role: user?.role,
    });

    if (!text || typeof text !== "string") {
      logger.warn("Upload attempt with invalid text", {
        email: user?.email,
      });

      return res.status(400).json({ error: "Text is required" });
    }

    logger.info("Text received", {
      email: user?.email,
      textLength: text.length,
    });

    const chunks = chunkText(text);

    logger.info("Chunks created", {
      email: user?.email,
      chunkCount: chunks.length,
    });

    let storedCount = 0;

    for (const chunk of chunks) {
      logger.info("Processing chunk", {
        email: user?.email,
        preview: chunk.substring(0, 50),
      });

      const embedding = await createEmbedding(chunk);

      if (!embedding || embedding.length === 0) {
        logger.error("Embedding failed or empty", {
          email: user?.email,
          preview: chunk.substring(0, 50),
        });
        continue;
      }

      const id = crypto.randomUUID();

      logger.info("Generated vector ID", {
        email: user?.email,
        id,
      });

      await upsertVector(id, embedding, { text: chunk });

      logger.info("Chunk stored successfully", {
        email: user?.email,
        id,
      });

      storedCount++;
    }

    logger.info("Upload completed", {
      email: user?.email,
      storedCount,
    });

    res.json({
      message: "Document uploaded successfully",
      chunksStored: storedCount,
    });

  } catch (error) {
    logger.error("Upload error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;