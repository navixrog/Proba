/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-soft": "var(--accent-soft)",
        "accent-on-dark": "var(--accent-on-dark)",
        capability: "var(--cat-capability)",
        "capability-soft": "var(--cat-capability-soft)",
        opportunity: "var(--cat-opportunity)",
        "opportunity-soft": "var(--cat-opportunity-soft)",
        motivation: "var(--cat-motivation)",
        "motivation-soft": "var(--cat-motivation-soft)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        critical: "var(--critical)",
        "critical-soft": "var(--critical-soft)",
      },
      fontFamily: {
        display: ['"System Serif"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 27, 40, 0.05)",
      },
    },
  },
  plugins: [],
};
