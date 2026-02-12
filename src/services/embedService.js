import openai from "../config/openai.js";

export async function createEmbedding(text) {
  console.log("Calling OpenAI for embedding...");
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
