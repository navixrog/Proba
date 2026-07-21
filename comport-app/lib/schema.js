import { Type } from "@google/genai";

// Gemini responseSchema forced via generateContent({ config: { responseSchema, responseMimeType: "application/json" } }).
// Mirrors the "BE practical" system prompt's required output sections 1:1 so the UI never has to guess field names.
// Note: Gemini's schema format has no $ref/$defs — the "score" shape is duplicated per criterion.

const DIMENSION_ENUM = [
  "capability_psychological",
  "capability_physical",
  "opportunity_physical",
  "opportunity_social",
  "motivation_reflective",
  "motivation_automatic",
];

const scoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, nullable: true, description: "Ocjena 1-5, ili null ako nema dovoljno podataka." },
    qualitative: {
      type: Type.STRING,
      nullable: true,
      enum: ["niska", "srednja", "visoka"],
      description: "Kvalitativna sigurnost kad brojčana ocjena nije opravdana (bez lažne preciznosti).",
    },
    rationale: { type: Type.STRING },
  },
  required: ["rationale"],
};

export const BE_PRACTICAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING, enum: ["needs_clarification", "management_summary"] },

    clarifying_questions: { type: Type.ARRAY, items: { type: Type.STRING } },

    summary: { type: Type.STRING },

    target_behaviour: {
      type: Type.OBJECT,
      properties: {
        statement: { type: Type.STRING },
        split_note: { type: Type.STRING, nullable: true },
      },
      required: ["statement"],
    },

    comb_analysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING, enum: DIMENSION_ENUM },
          barrier: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["potvrđena", "vjerojatna", "neprovjerena"] },
        },
        required: ["dimension", "barrier", "status"],
      },
    },

    action_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          comb_element: { type: Type.STRING, enum: DIMENSION_ENUM },
          barrier_or_driver: { type: Type.STRING },
          intervention: { type: Type.STRING },
          bct_function: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["niska", "srednja", "visoka"] },
          category: { type: Type.STRING, enum: ["high_impact", "quick_win", "pilot"] },
          owner: { type: Type.STRING, nullable: true },
          timeframe: { type: Type.STRING, nullable: true },
          resources: { type: Type.STRING, nullable: true },
          success_metric: { type: Type.STRING, nullable: true },
        },
        required: ["comb_element", "barrier_or_driver", "intervention", "bct_function", "confidence", "category"],
      },
    },

    prioritisation_matrix: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          intervention: { type: Type.STRING },
          impact: scoreSchema,
          evidence_quality: scoreSchema,
          feasibility: scoreSchema,
          ethical_acceptability: scoreSchema,
          weighted_priority: { type: Type.NUMBER, nullable: true },
          speed: { type: Type.STRING, enum: ["brzo", "srednje", "sporo"] },
          cost: { type: Type.STRING, enum: ["nizak", "srednji", "visok"] },
          eligible_as_priority: { type: Type.BOOLEAN },
        },
        required: [
          "intervention",
          "impact",
          "evidence_quality",
          "feasibility",
          "ethical_acceptability",
          "speed",
          "cost",
          "eligible_as_priority",
        ],
      },
    },

    metrics: {
      type: Type.OBJECT,
      properties: {
        leading: { type: Type.ARRAY, items: { type: Type.STRING } },
        lagging: { type: Type.ARRAY, items: { type: Type.STRING } },
        safeguard: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["leading", "lagging", "safeguard"],
    },

    evidence_and_limitations: { type: Type.STRING },

    first_step: { type: Type.STRING },

    pilot: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        hypothesis: { type: Type.STRING },
        target_group: { type: Type.STRING },
        duration: { type: Type.STRING },
        stopping_rules: { type: Type.STRING },
        success_threshold: { type: Type.STRING },
      },
    },
  },
  required: [
    "mode",
    "clarifying_questions",
    "summary",
    "target_behaviour",
    "comb_analysis",
    "action_plan",
    "prioritisation_matrix",
    "metrics",
    "evidence_and_limitations",
    "first_step",
  ],
};
