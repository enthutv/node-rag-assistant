import openai from "../config/openai.js";

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message.content;
}
