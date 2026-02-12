import { getPineconeIndex } from "../config/pinecone.js";

export async function upsertVector(id, embedding, metadata = {}) {
  const index = getPineconeIndex();

  await index.upsert({
    records: [
      {
        id: id,
        values: embedding,
        metadata: metadata,
      }
    ]
  });
}

export async function queryVector(embedding) {
  const index = getPineconeIndex();

  const result = await index.query({
    vector: embedding,
    topK: 3,
    includeMetadata: true,
  });

  return result.matches;
}