"use client";

import { useState } from "react";
import SeedExamples from "@/components/SeedExamples";
import ProfileSelector, { CUSTOM_ID, EMPTY_CUSTOM_PROFILE } from "@/components/ProfileSelector";
import LoadingSteps from "@/components/LoadingSteps";
import SummaryCard from "@/components/SummaryCard";
import FitScoreCard from "@/components/FitScoreCard";
import { PREDEFINED_PROFILES } from "@/lib/companyProfiles";
import { CompanyProfile, FitScore, TenderSummary } from "@/lib/types";

type LoadingStep = null | 1 | 2;

export default function Home() {
  const [tenderText, setTenderText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(PREDEFINED_PROFILES[0].id);
  const [customProfile, setCustomProfile] = useState<CompanyProfile>(EMPTY_CUSTOM_PROFILE);

  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  const [fitScore, setFitScore] = useState<FitScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProfile: CompanyProfile =
    selectedProfileId === CUSTOM_ID
      ? customProfile
      : PREDEFINED_PROFILES.find((p) => p.id === selectedProfileId) ?? PREDEFINED_PROFILES[0];

  const isBusy = loadingStep !== null;

  async function handleAnalyze() {
    setError(null);
    setSummary(null);
    setFitScore(null);

    if (!tenderText.trim()) {
      setError("Zalijepite tekst natječaja prije analize.");
      return;
    }

    try {
      setLoadingStep(1);
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderText }),
      });
      const translateData = await translateRes.json();
      if (!translateRes.ok) {
        throw new Error(translateData?.error ?? "Greška prilikom analize natječaja.");
      }
      const newSummary: TenderSummary = translateData.summary;
      setSummary(newSummary);

      setLoadingStep(2);
      const adviseRes = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: newSummary, profile: activeProfile }),
      });
      const adviseData = await adviseRes.json();
      if (!adviseRes.ok) {
        throw new Error(adviseData?.error ?? "Greška prilikom procjene prihvatljivosti.");
      }
      setFitScore(adviseData.fitScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Došlo je do neočekivane greške. Pokušajte ponovno.");
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-tendra-purple">Tendra</h1>
        <p className="mt-1 text-slate-600">
          AI pomoćnik koji pojednostavljuje tekst javnog natječaja i procjenjuje koliko vaša tvrtka
          odgovara njegovim uvjetima.
        </p>
      </header>

      <section className="mb-6 space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Tekst natječaja
        </label>
        <SeedExamples onSelect={setTenderText} disabled={isBusy} />
        <textarea
          value={tenderText}
          disabled={isBusy}
          onChange={(e) => setTenderText(e.target.value)}
          rows={10}
          placeholder="Zalijepite ovdje sirovi tekst natječaja..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed focus:border-tendra-purple focus:outline-none focus:ring-1 focus:ring-tendra-purple disabled:opacity-50"
        />
      </section>

      <section className="mb-6">
        <ProfileSelector
          selectedId={selectedProfileId}
          customProfile={customProfile}
          onSelectId={setSelectedProfileId}
          onCustomProfileChange={setCustomProfile}
          disabled={isBusy}
        />
      </section>

      <section className="mb-8">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isBusy}
          className="rounded-lg bg-tendra-purple px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tendra-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Analiziram..." : "Analiziraj"}
        </button>
      </section>

      {loadingStep && (
        <div className="mb-6">
          <LoadingSteps step={loadingStep} />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-tendra-red/40 bg-tendra-red/5 px-4 py-3 text-sm font-medium text-tendra-red">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {summary && <SummaryCard summary={summary} />}
        {fitScore && <FitScoreCard fitScore={fitScore} />}
      </div>
    </main>
  );
}
