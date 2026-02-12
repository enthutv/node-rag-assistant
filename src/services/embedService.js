import openai from "../config/openai.js";

export async function createEmbedding(text) {
  console.log("Calling OpenAI for embedding...");

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response?.data?.[0]?.embedding;

  if (!embedding) {
    console.log("❌ Embedding missing!");
    throw new Error("Embedding is undefined");
  }

  console.log("Embedding length:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));

  return embedding;
}