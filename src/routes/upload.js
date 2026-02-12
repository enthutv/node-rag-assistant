import express from "express";
import crypto from "crypto";
import { createEmbedding } from "../services/embedService.js";
import { upsertVector } from "../services/vectorService.js";
import { chunkText } from "../utils/chunker.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const chunks = chunkText(text);

    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk);
      const id = crypto.randomUUID();

      await upsertVector(id, embedding, { text: chunk });
    }

    res.json({
      message: "Document uploaded successfully",
      chunksStored: chunks.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
