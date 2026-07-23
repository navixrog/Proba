import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./config";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

export class ClaudeJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeJsonError";
  }
}

export async function callClaudeForJson<T>(
  systemPrompt: string,
  userMessage: string
): Promise<T> {
  const response = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new ClaudeJsonError("Claude nije vratio tekstualni odgovor.");
  }

  const cleaned = stripMarkdownFences(block.text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new ClaudeJsonError("Claude je vratio odgovor koji nije valjan JSON.");
  }
}
