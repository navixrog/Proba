/**
 * MOCK_MODE je uključen po defaultu tako da app radi bez API ključa.
 * Postavi MOCK_MODE=false u .env.local da bi API rute zvale pravi Anthropic API.
 */
export const MOCK_MODE = process.env.MOCK_MODE !== "false";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
