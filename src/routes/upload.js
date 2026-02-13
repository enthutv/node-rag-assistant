import express from "express";
import crypto from "crypto";
import { createEmbedding } from "../services/embedService.js";
import { upsertVector } from "../services/vectorService.js";
import { chunkText } from "../utils/chunker.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    logger.info("Upload route hit");

    const { text } = req.body;

    if (!text) {
      logger.warn("Upload attempt with missing text");
      return res.status(400).json({ error: "Text is required" });
    }

    logger.info("Text received", {
      textLength: text.length,
    });

    const chunks = chunkText(text);

    logger.info("Chunks created", {
      chunkCount: chunks.length,
    });

    for (const chunk of chunks) {
      logger.info("Processing chunk", {
        preview: chunk.substring(0, 50),
      });

      const embedding = await createEmbedding(chunk);

      if (!embedding || embedding.length === 0) {
        logger.error("Embedding failed or empty", {
          preview: chunk.substring(0, 50),
        });
        continue;
      }

      const id = crypto.randomUUID();

      logger.info("Generated vector ID", { id });

      await upsertVector(id, embedding, { text: chunk });

      logger.info("Chunk stored successfully", { id });
    }

    res.json({
      message: "Document uploaded successfully",
      chunksStored: chunks.length,
    });

  } catch (error) {
    logger.error("Upload error", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: error.message });
  }
});

export default router;