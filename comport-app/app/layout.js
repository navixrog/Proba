import "./globals.css";

export const metadata = {
  title: "Comport — Bihevioralni dizajn za institucije",
  description: "COM-B / Behaviour Change Wheel analitika za javnu upravu, bolnice i ESG timove.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
