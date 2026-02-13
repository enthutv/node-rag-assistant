import openai from "../config/openai.js";
import logger from "../utils/logger.js";

export async function createEmbedding(text) {
  logger.info("Creating embedding", { textLength: text.length });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response.data[0].embedding;

  logger.info("Embedding created", {
    length: embedding.length,
  });

  return embedding;
}