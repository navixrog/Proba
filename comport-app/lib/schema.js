// JSON Schema forced on the Assistant run via response_format: { type: "json_schema", json_schema: BE_PRACTICAL_SCHEMA }
// Mirrors the "BE practical" system prompt's required output sections 1:1 so the UI never has to guess field names.
export const BE_PRACTICAL_SCHEMA = {
  name: "behavioural_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      mode: {
        type: "string",
        enum: ["needs_clarification", "management_summary"],
      },

      clarifying_questions: {
        type: "array",
        items: { type: "string" },
        maxItems: 4,
      },

      summary: { type: "string" },

      target_behaviour: {
        type: "object",
        additionalProperties: false,
        properties: {
          statement: { type: "string" },
          split_note: { type: ["string", "null"] },
        },
        required: ["statement", "split_note"],
      },

      comb_analysis: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            dimension: {
              type: "string",
              enum: [
                "capability_psychological",
                "capability_physical",
                "opportunity_physical",
                "opportunity_social",
                "motivation_reflective",
                "motivation_automatic",
              ],
            },
            barrier: { type: "string" },
            status: { type: "string", enum: ["potvrđena", "vjerojatna", "neprovjerena"] },
          },
          required: ["dimension", "barrier", "status"],
        },
      },

      action_plan: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            comb_element: { type: "string" },
            barrier_or_driver: { type: "string" },
            intervention: { type: "string" },
            bct_function: { type: "string" },
            confidence: { type: "string", enum: ["niska", "srednja", "visoka"] },
            category: { type: "string", enum: ["high_impact", "quick_win", "pilot"] },
            owner: { type: ["string", "null"] },
            timeframe: { type: ["string", "null"] },
            resources: { type: ["string", "null"] },
            success_metric: { type: ["string", "null"] },
          },
          required: [
            "comb_element",
            "barrier_or_driver",
            "intervention",
            "bct_function",
            "confidence",
            "category",
            "owner",
            "timeframe",
            "resources",
            "success_metric",
          ],
        },
      },

      prioritisation_matrix: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            intervention: { type: "string" },
            impact: { $ref: "#/$defs/score" },
            evidence_quality: { $ref: "#/$defs/score" },
            feasibility: { $ref: "#/$defs/score" },
            ethical_acceptability: { $ref: "#/$defs/score" },
            weighted_priority: { type: ["number", "null"] },
            speed: { type: "string", enum: ["brzo", "srednje", "sporo"] },
            cost: { type: "string", enum: ["nizak", "srednji", "visok"] },
            eligible_as_priority: { type: "boolean" },
          },
          required: [
            "intervention",
            "impact",
            "evidence_quality",
            "feasibility",
            "ethical_acceptability",
            "weighted_priority",
            "speed",
            "cost",
            "eligible_as_priority",
          ],
        },
      },

      metrics: {
        type: "object",
        additionalProperties: false,
        properties: {
          leading: { type: "array", items: { type: "string" } },
          lagging: { type: "array", items: { type: "string" } },
          safeguard: { type: "array", items: { type: "string" } },
        },
        required: ["leading", "lagging", "safeguard"],
      },

      evidence_and_limitations: { type: "string" },

      first_step: { type: "string" },

      pilot: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          hypothesis: { type: "string" },
          target_group: { type: "string" },
          duration: { type: "string" },
          stopping_rules: { type: "string" },
          success_threshold: { type: "string" },
        },
        required: ["hypothesis", "target_group", "duration", "stopping_rules", "success_threshold"],
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
      "pilot",
    ],
    $defs: {
      score: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: ["integer", "null"] },
          qualitative: { type: ["string", "null"], enum: ["niska", "srednja", "visoka", null] },
          rationale: { type: "string" },
        },
        required: ["score", "qualitative", "rationale"],
      },
    },
  },
};
