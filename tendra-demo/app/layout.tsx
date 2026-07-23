import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tendra — AI analiza natječaja",
  description: "Proof-of-concept AI sloj za pojednostavljivanje javnih natječaja i procjenu prihvatljivosti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="min-h-screen text-slate-900">{children}</body>
    </html>
  );
}
