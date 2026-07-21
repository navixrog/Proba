import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY nije postavljen — vidi .env.example");
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
