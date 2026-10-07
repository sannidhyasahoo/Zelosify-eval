/**
 * Model factory for LLM agent integration.
 * Supports Groq, Gemini, and deterministic MockChatModel for unit testing.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

/**
 * MockChatModel allows deterministic unit testing of tool calling and agent graphs
 * without consuming external LLM quota or requiring network access.
 */
export class MockChatModel extends BaseChatModel {
  private responses: (AIMessage | string)[];
  private index = 0;

  constructor(responses: (AIMessage | string)[] = []) {
    super({});
    this.responses = responses;
  }

  _llmType(): string {
    return "mock";
  }

  setResponses(responses: (AIMessage | string)[]): void {
    this.responses = responses;
    this.index = 0;
  }

  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    const current =
      this.index < this.responses.length
        ? this.responses[this.index]
        : this.responses[this.responses.length - 1];
    this.index++;

    const message =
      typeof current === "string" ? new AIMessage(current) : current;

    return {
      generations: [
        {
          message: message || new AIMessage("Mock response"),
          text: typeof message?.content === "string" ? message.content : "",
        },
      ],
    };
  }

  bindTools(_tools: any[]): this {
    return this;
  }
}

/**
 * Creates an appropriate chat model based on environment variables.
 */
export function createChatModel(options?: {
  modelName?: string;
  temperature?: number;
}): BaseChatModel {
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: options?.modelName || "llama-3.3-70b-versatile",
      temperature: options?.temperature ?? 0,
    });
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      model: options?.modelName || "gemini-3-flash-preview",
      temperature: options?.temperature ?? 0,
      maxRetries: 4,
    });
  }

  // Fallback for development or test runs if no API key is provided
  throw new Error(
    "No LLM API key configured. Please set GEMINI_API_KEY or GROQ_API_KEY."
  );
}
