import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tendra: {
          purple: "#4F46E5",
          green: "#16A34A",
          yellow: "#CA8A04",
          red: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
