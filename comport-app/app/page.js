"use client";

import { useState } from "react";
import { ShieldCheck, Lock, FileSearch, AlertCircle } from "lucide-react";
import IntakePanel from "@/components/IntakePanel";
import ReportView from "@/components/ReportView";

function EmptyState() {
  return (
    <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-8 py-16">
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-alt border border-border text-ink-faint mb-4">
        <FileSearch className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="font-display text-[19px] font-semibold text-ink mb-2">Izvještaj će se pojaviti ovdje</p>
      <p className="text-[14px] text-ink-muted max-w-[46ch] leading-relaxed">
        Opišite bihevioralni problem u lijevom panelu, po potrebi priložite dokumentaciju, pa kliknite
        &quot;Generiraj Akcijski Plan&quot;.
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="max-w-[560px] mx-auto flex items-start gap-3 rounded-[10px] border border-critical bg-critical-soft p-5">
      <AlertCircle className="h-5 w-5 text-critical flex-shrink-0 mt-0.5" strokeWidth={1.75} />
      <div>
        <p className="text-sm font-semibold text-critical mb-1">Analiza nije uspjela</p>
        <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const [plan, setPlan] = useState(null);
  const [mode, setMode] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  async function handleGenerate({ problem, files }) {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("problem", problem);
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analiza nije uspjela.");
      }

      setPlan(data);
      setMode("summary");
      setGeneratedAt(
        new Date().toLocaleString("hr-HR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(err.message || "Neočekivana greška. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-7 py-3.5 bg-surface border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent text-accent-on-dark">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <span className="font-semibold text-[15px] tracking-tight">Comport</span>
          <span className="hidden sm:inline text-[12.5px] text-ink-faint pl-2.5 ml-0.5 border-l border-border">
            COM-B bihevioralna analitika
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-ink-muted border border-border rounded-full px-2.5 py-1">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Sigurno &amp; povjerljivo
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">
        <IntakePanel onSubmit={handleGenerate} loading={loading} />

        <section aria-label="Izvještaj" className="px-5 sm:px-10 py-10 min-w-0 w-full">
          {error && <ErrorState message={error} />}
          {!error && !plan && <EmptyState />}
          {!error && plan && <ReportView plan={plan} mode={mode} setMode={setMode} generatedAt={generatedAt} />}
        </section>
      </div>
    </div>
  );
}
