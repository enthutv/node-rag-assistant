import express from "express";
import crypto from "crypto";
import { createEmbedding } from "../services/embedService.js";
import { upsertVector } from "../services/vectorService.js";
import { chunkText } from "../utils/chunker.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    console.log("🔥 Upload route hit");

    const { text } = req.body;

    console.log("📥 Text received:", text);

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const chunks = chunkText(text);
    console.log("🧩 Chunks created:", chunks.length);

    for (const chunk of chunks) {
      console.log("➡️ Processing chunk:", chunk.substring(0, 50));

      console.log("🔹 Calling OpenAI for embedding...");
      const embedding = await createEmbedding(chunk);

      const id = crypto.randomUUID();
      console.log("🆔 Generated ID:", id);

      console.log("📡 Upserting to Pinecone...");
      await upsertVector(id, embedding, { text: chunk });

      console.log("✅ Chunk stored successfully");
    }

    res.json({
      message: "Document uploaded successfully",
      chunksStored: chunks.length
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;