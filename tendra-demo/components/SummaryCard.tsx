import { TenderSummary } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-600">{title}</h4>
      {children}
    </div>
  );
}

function ListOrEmpty({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm italic text-slate-400">Nije navedeno u tekstu.</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function TextOrNull({ value }: { value: string | null }) {
  if (!value) {
    return <p className="text-sm italic text-slate-400">Nije navedeno u tekstu.</p>;
  }
  return <p className="text-sm text-slate-800">{value}</p>;
}

export default function SummaryCard({ summary }: { summary: TenderSummary }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Sažetak natječaja</h3>

      <p className="mb-5 rounded-lg bg-tendra-purple/5 p-3 text-sm font-medium text-slate-900">
        {summary.raw_summary}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Tko se može prijaviti">
          <TextOrNull value={summary.tko_se_moze_prijaviti} />
        </Section>
        <Section title="Iznos financiranja">
          <TextOrNull value={summary.iznos} />
        </Section>
        <Section title="Glavni rok">
          <TextOrNull value={summary.rokovi.glavni_rok} />
        </Section>
        <Section title="Međukoraci / ostali rokovi">
          <ListOrEmpty items={summary.rokovi.medjukoraci} />
        </Section>
        <Section title="Prihvatljive aktivnosti">
          <ListOrEmpty items={summary.prihvatljive_aktivnosti} />
        </Section>
        <Section title="Neprihvatljive aktivnosti">
          <ListOrEmpty items={summary.neprihvatljive_aktivnosti} />
        </Section>
      </div>

      <div className="mt-4">
        <Section title="Kriteriji bodovanja">
          <ListOrEmpty items={summary.kriteriji_bodovanja} />
        </Section>
      </div>

      {summary.skrivene_zamke.length > 0 && (
        <div className="mt-5 rounded-lg border-2 border-tendra-red/40 bg-tendra-red/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-tendra-red">
            <span aria-hidden>⚠</span> Skrivene zamke
          </h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-800">
            {summary.skrivene_zamke.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
