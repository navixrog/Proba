"use client";

import { useState } from "react";
import SeedExamples from "@/components/SeedExamples";
import ProfileSelector, {
  CUSTOM_ID,
  EMPTY_CUSTOM_PROFILE,
  isCustomProfileComplete,
} from "@/components/ProfileSelector";
import LoadingSteps from "@/components/LoadingSteps";
import SummaryCard from "@/components/SummaryCard";
import FitScoreCard from "@/components/FitScoreCard";
import { PREDEFINED_PROFILES } from "@/lib/companyProfiles";
import { CompanyProfile, FitScore, TenderSummary } from "@/lib/types";

type LoadingStep = null | 1 | 2;

export default function HomeClient({ mockMode }: { mockMode: boolean }) {
  const [tenderText, setTenderText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(PREDEFINED_PROFILES[0].id);
  const [customProfile, setCustomProfile] = useState<CompanyProfile>(EMPTY_CUSTOM_PROFILE);
  const [showValidation, setShowValidation] = useState(false);

  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  const [fitScore, setFitScore] = useState<FitScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProfile: CompanyProfile =
    selectedProfileId === CUSTOM_ID
      ? customProfile
      : PREDEFINED_PROFILES.find((p) => p.id === selectedProfileId) ?? PREDEFINED_PROFILES[0];

  const isBusy = loadingStep !== null;
  const hasResults = summary !== null || fitScore !== null;

  function resetAll() {
    setTenderText("");
    setSummary(null);
    setFitScore(null);
    setError(null);
    setShowValidation(false);
  }

  async function handleAnalyze() {
    setError(null);
    setSummary(null);
    setFitScore(null);

    if (!tenderText.trim()) {
      setError("Zalijepite tekst natječaja prije analize.");
      return;
    }

    if (selectedProfileId === CUSTOM_ID && !isCustomProfileComplete(customProfile)) {
      setShowValidation(true);
      setError("Popunite obavezna polja profila tvrtke (djelatnost, broj zaposlenih, županija).");
      return;
    }
    setShowValidation(false);

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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-tendra-purple">Tendra</h1>
          {mockMode ? (
            <span
              className="rounded-full bg-tendra-yellow/15 px-2.5 py-1 text-xs font-semibold text-tendra-yellow"
              title="Odgovori su unaprijed pripremljeni, bez stvarnog poziva Claude API-ju."
            >
              MOCK način rada
            </span>
          ) : (
            <span
              className="rounded-full bg-tendra-green/15 px-2.5 py-1 text-xs font-semibold text-tendra-green"
              title="Aplikacija stvarno poziva Claude API."
            >
              Uživo (Claude API)
            </span>
          )}
        </div>
        <p className="mt-2 text-slate-600">
          AI pomoćnik koji pojednostavljuje tekst javnog natječaja i procjenjuje koliko vaša tvrtka
          odgovara njegovim uvjetima.
        </p>
      </header>

      <section className="mb-6 space-y-3">
        <label htmlFor="tender-text" className="block text-sm font-semibold text-slate-700">
          Tekst natječaja
        </label>
        <SeedExamples onSelect={setTenderText} disabled={isBusy} />
        <textarea
          id="tender-text"
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
          showValidation={showValidation}
        />
      </section>

      <section className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isBusy}
          className="rounded-lg bg-tendra-purple px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tendra-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Analiziram..." : "Analiziraj"}
        </button>
        {hasResults && !isBusy && (
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Nova analiza
          </button>
        )}
      </section>

      <div aria-live="polite" className="contents">
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
      </div>

      <div className="space-y-6">
        {summary && <SummaryCard summary={summary} />}
        {fitScore && <FitScoreCard fitScore={fitScore} />}
      </div>
    </main>
  );
}
