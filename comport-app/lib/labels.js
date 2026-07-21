export const DIMENSION_LABELS = {
  capability_psychological: "Sposobnost · psihološka",
  capability_physical: "Sposobnost · fizička",
  opportunity_physical: "Prilika · fizička",
  opportunity_social: "Prilika · socijalna",
  motivation_reflective: "Motivacija · reflektivna",
  motivation_automatic: "Motivacija · automatska",
};

export function dimensionGroup(dimension) {
  if (dimension?.startsWith("capability")) return "capability";
  if (dimension?.startsWith("opportunity")) return "opportunity";
  return "motivation";
}

export const GROUP_PILL_CLASSES = {
  capability: "bg-capability-soft text-capability",
  opportunity: "bg-opportunity-soft text-opportunity",
  motivation: "bg-motivation-soft text-motivation",
};

export const STATUS_LABELS = {
  potvrđena: "Potvrđena barijera",
  vjerojatna: "Vjerojatna barijera",
  neprovjerena: "Neprovjerena",
};

export const STATUS_PILL_CLASSES = {
  potvrđena: "bg-success-soft text-success",
  vjerojatna: "bg-warning-soft text-warning",
  neprovjerena: "bg-surface-alt text-ink-faint border border-border-strong",
};

export const CONFIDENCE_LABELS = {
  visoka: "Visoka",
  srednja: "Srednja",
  niska: "Niska",
};

export const CONFIDENCE_PILL_CLASSES = {
  visoka: "bg-success-soft text-success",
  srednja: "bg-warning-soft text-warning",
  niska: "bg-surface-alt text-ink-faint border border-border-strong",
};

export const CATEGORY_GROUPS = [
  { key: "high_impact", title: "Akcije visokog učinka" },
  { key: "quick_win", title: "Brze pobjede" },
  { key: "pilot", title: "Pilot prije šire primjene" },
];

export const SPEED_LABELS = { brzo: "Brzina: brzo", srednje: "Brzina: srednje", sporo: "Brzina: sporo" };
export const COST_LABELS = { nizak: "Trošak: nizak", srednji: "Trošak: srednji", visok: "Trošak: visok" };
