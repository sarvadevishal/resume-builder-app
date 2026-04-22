import OpenAI from "openai";

let openAiClient;

export function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openAiClient;
}
