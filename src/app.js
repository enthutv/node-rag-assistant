import express from "express";
import cors from "cors";
import openai from "./config/openai.js";
import testRoute from "./routes/test.js";
import chatRoute from "./routes/chat.js";
import uploadRoute from "./routes/upload.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", uploadRoute);
app.use("/api", testRoute);
app.use("/api", chatRoute);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "AI Assistant Running" });
});

// OpenAI test endpoint
app.get("/test-openai", async (req, res) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "hello world",
    });

    const embedding = response.data[0].embedding;

    res.json({
      length: embedding.length,
      firstFive: embedding.slice(0, 5),
    });
  } catch (error) {
    console.error("OpenAI test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 IMPORTANT FOR RENDER
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});