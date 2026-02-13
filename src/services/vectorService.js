import { getPineconeIndex } from "../config/pinecone.js";
import logger from "../utils/logger.js";

export async function upsertVector(id, embedding, metadata = {}) {
  logger.info("Upserting vector to Pinecone", { id });

  const index = getPineconeIndex();

  await index.upsert({
    records: [
      {
        id,
        values: embedding,
        metadata,
      },
    ],
  });
}

export async function queryVector(embedding) {
  const index = getPineconeIndex();

  logger.info("Querying Pinecone");

  const result = await index.query({
    vector: embedding,
    topK: 3,
    includeMetadata: true,
  });

  logger.info("Query completed", {
    matchCount: result.matches.length,
  });

  return result.matches;
}