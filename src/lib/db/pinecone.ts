import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;

if (!apiKey) {
  throw new Error(
    "No PINECONE_API_KEY environment variable found. Please set one and try again.",
  );
}

const pinecone = new Pinecone({
  environment: "gcp-starter",
  apiKey,
});

export const notesIndex = pinecone.index("nextjs-ai-notes-app");
