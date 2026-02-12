import express from "express";
import { createEmbedding } from "../services/embedService.js";
import { queryVector } from "../services/vectorService.js";
import { generateAnswer } from "../services/chatService.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // 1️⃣ Embed question
    const embedding = await createEmbedding(question);

    // 2️⃣ Search Pinecone
    const matches = await queryVector(embedding);

    const context = matches
      .map(match => match.metadata.text)
      .join("\n");

    // 3️⃣ Generate answer
    const answer = await generateAnswer(context, question);

    res.json({
      answer,
      matches
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
