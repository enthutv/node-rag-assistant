import express from "express";
import { createEmbedding } from "../services/embedService.js";
import { upsertVector } from "../services/vectorService.js";
import crypto from "crypto";

const router = express.Router();

router.get("/test-ai", async (req, res) => {
  try {
    const text = "This is a test document about AI engineering.";

    const embedding = await createEmbedding(text);

    console.log("Embedding length:", embedding?.length);

    const id = crypto.randomUUID();

    await upsertVector(id, embedding, { text });

    res.json({
      message: "Vector stored successfully",
      id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
