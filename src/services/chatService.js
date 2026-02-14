import openai from "../config/openai.js";
import logger from "../utils/logger.js";

const COST_PER_1K_TOKENS = 0.00015; // Approximate for gpt-4o-mini (adjust if needed)

export async function generateAnswer(context, question) {
  const prompt = `
You are a helpful AI assistant.

Use the following context to answer the question.

Context:
${context}

Question:
${question}

Answer:
`;

  logger.info("Generating chat completion", {
    questionLength: question.length,
    contextLength: context.length,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: prompt }
    ],
  });

  const answer = response.choices[0].message.content;
  const usage = response.usage;

  if (usage) {
    const estimatedCost =
      (usage.total_tokens / 1000) * COST_PER_1K_TOKENS;

    logger.info("Token usage recorded", {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: Number(estimatedCost.toFixed(8)),
    });

    return {
      answer,
      usage,
      estimatedCost: Number(estimatedCost.toFixed(8)),
    };
  }

  // Fallback if usage not returned
  logger.warn("No usage data returned from OpenAI");

  return { answer };
}
