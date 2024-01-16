import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "No OPENAI_API_KEY environment variable found. Please set one and try again."
  );
} 

const openai = new OpenAI({ apiKey });

export default openai;

export async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  const embedding = response.data[0].embedding;

  if (!embedding) throw Error("Error generating embedding");

  console.log(embedding);

  return embedding;
}