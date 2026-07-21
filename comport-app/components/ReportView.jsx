import { User, Unlock, Flame, Star, AlertTriangle, ChevronDown, FlaskConical } from "lucide-react";
import {
  DIMENSION_LABELS,
  dimensionGroup,
  GROUP_PILL_CLASSES,
  STATUS_LABELS,
  STATUS_PILL_CLASSES,
  CONFIDENCE_LABELS,
  CONFIDENCE_PILL_CLASSES,
  CATEGORY_GROUPS,
  SPEED_LABELS,
  COST_LABELS,
} from "@/lib/labels";

const CARD = "bg-surface border border-border rounded-[10px] p-[22px_24px] shadow-card";
const LABEL = "text-[11.5px] font-semibold tracking-[0.08em] uppercase text-ink-faint mb-2.5";

function CombIcon({ group }) {
  const cls = `inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3 ${GROUP_PILL_CLASSES[group]}`;
  if (group === "capability") return <span className={cls}><User className="h-4 w-4" strokeWidth={1.75} /></span>;
  if (group === "opportunity") return <span className={cls}><Unlock className="h-4 w-4" strokeWidth={1.75} /></span>;
  return (
    <span className={cls}>
      <Flame className="h-4 w-4" fill="currentColor" strokeWidth={0} />
    </span>
  );
}

function ReportHeader({ generatedAt }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-ink-faint">Izvještaj</p>
      <span className="text-xs text-ink-faint tabular-nums">Generirano {generatedAt}</span>
    </div>
  );
}

function ModeToggle({ mode, setMode }) {
  const options = [
    ["summary", "Upravljački pregled"],
    ["detailed", "Detaljan operativni plan"],
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex border border-border rounded-lg p-[3px] bg-surface-alt">
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors ${
              mode === key ? "bg-surface text-ink shadow-card" : "text-ink-muted"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-faint">Detaljan prikaz dodaje vlasnike, rokove i pilot-protokol.</p>
    </div>
  );
}

function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <article className={CARD}>
      <p className={LABEL}>Sažetak</p>
      <p className="font-display text-[16.5px] leading-relaxed text-ink max-w-[68ch]">{summary}</p>
    </article>
  );
}

function TargetBehaviourCard({ targetBehaviour }) {
  if (!targetBehaviour?.statement) return null;
  return (
    <article className="bg-accent-soft border-l-[3px] border-accent rounded-[10px] p-[22px_24px]">
      <p className={`${LABEL} text-accent`}>Ciljano ponašanje</p>
      <p className="font-display text-[19px] font-semibold leading-snug text-ink text-balance">
        {targetBehaviour.statement}
      </p>
      {targetBehaviour.split_note && (
        <p className="text-[13px] text-ink-muted mt-3 leading-relaxed">{targetBehaviour.split_note}</p>
      )}
    </article>
  );
}

function CombGrid({ combAnalysis }) {
  if (!combAnalysis?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className={LABEL}>COM-B analiza</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {combAnalysis.map((item, i) => {
          const group = dimensionGroup(item.dimension);
          return (
            <article key={i} className="bg-surface border border-border rounded-[10px] p-[18px]">
              <CombIcon group={group} />
              <p className="text-[14.5px] font-semibold mb-1.5">{DIMENSION_LABELS[item.dimension]}</p>
              <span
                className={`inline-flex items-center text-[11px] font-semibold px-2 py-[3px] rounded-full ${STATUS_PILL_CLASSES[item.status]}`}
              >
                {STATUS_LABELS[item.status]}
              </span>
              <p className="text-[13.5px] leading-relaxed text-ink-muted mt-2">{item.barrier}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ActionPlan({ actionPlan, isDetailed }) {
  if (!actionPlan?.length) return null;
  return (
    <div className="flex flex-col gap-4">
      <p className={LABEL}>Akcijski plan</p>
      {CATEGORY_GROUPS.map(({ key, title }) => {
        const rows = actionPlan.filter((r) => r.category === key);
        if (!rows.length) return null;
        return (
          <div key={key} className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-ink flex items-center gap-2">
              {title}
              <span className="text-[11px] font-semibold text-ink-faint bg-surface-alt border border-border rounded-full px-[7px] py-px">
                {rows.length}
              </span>
            </p>
            <div className="overflow-x-auto border border-border rounded-[10px] bg-surface">
              <table className="w-full border-collapse min-w-[680px]">
                <thead>
                  <tr>
                    {["COM-B element", "Prepreka", "Etična intervencija", "Sigurnost"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold tracking-wide uppercase text-ink-faint px-4 py-3 border-b border-border-strong bg-surface-alt"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const group = dimensionGroup(row.comb_element);
                    const meta = [
                      row.owner && `Vlasnik: ${row.owner}`,
                      row.timeframe && `Rok: ${row.timeframe}`,
                      row.resources && `Resursi: ${row.resources}`,
                    ].filter(Boolean);
                    return (
                      <tr key={i} className="hover:bg-surface-alt">
                        <td className="px-4 py-3.5 border-b border-border align-top">
                          <span
                            className={`inline-flex items-center text-[11.5px] font-semibold px-[9px] py-1 rounded-full whitespace-nowrap ${GROUP_PILL_CLASSES[group]}`}
                          >
                            {DIMENSION_LABELS[row.comb_element]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 border-b border-border align-top text-[13.5px] text-ink-muted">
                          {row.barrier_or_driver}
                        </td>
                        <td className="px-4 py-3.5 border-b border-border align-top text-[13.5px] text-ink">
                          <p>{row.intervention}</p>
                          <p className="text-xs italic text-ink-faint mt-1">BCT: {row.bct_function}</p>
                          {isDetailed && meta.length > 0 && (
                            <p className="text-[11.5px] text-ink-faint mt-1.5 leading-relaxed">{meta.join(" · ")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 border-b border-border align-top">
                          <span
                            className={`inline-flex text-[11.5px] font-semibold px-[9px] py-1 rounded-full ${CONFIDENCE_PILL_CLASSES[row.confidence]}`}
                          >
                            {CONFIDENCE_LABELS[row.confidence]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreRow({ label, criterion }) {
  if (!criterion) return null;
  if (criterion.score == null) {
    return (
      <div className="grid grid-cols-[66px_1fr] items-center gap-2 text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="text-[11.5px] font-semibold text-warning">
          {criterion.qualitative ? `${criterion.qualitative} sigurnost` : "nepoznato"}
        </span>
      </div>
    );
  }
  const pct = (criterion.score / 5) * 100;
  const low = criterion.score <= 2;
  return (
    <div className="grid grid-cols-[66px_1fr_20px] items-center gap-2 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span className="h-1.5 rounded-full bg-surface-alt overflow-hidden block">
        <span className={`block h-full rounded-full ${low ? "bg-warning" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-right font-semibold text-ink tabular-nums">{criterion.score}</span>
    </div>
  );
}

function PriorityCard({ row }) {
  const flagged = row.eligible_as_priority === false;
  return (
    <article
      className={`bg-surface border rounded-[10px] p-[18px] flex flex-col gap-3 ${flagged ? "border-critical" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <p className="text-[14.5px] font-semibold leading-snug">{row.intervention}</p>
        <div className="flex flex-col items-center flex-shrink-0">
          <span className={`text-[19px] font-bold tabular-nums ${flagged ? "text-critical" : "text-accent"}`}>
            {flagged ? "—" : row.weighted_priority != null ? row.weighted_priority.toFixed(2) : "?"}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">
            {flagged ? "isključeno" : "prioritet"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <ScoreRow label="Učinak" criterion={row.impact} />
        <ScoreRow label="Dokazi" criterion={row.evidence_quality} />
        <ScoreRow label="Izvedivost" criterion={row.feasibility} />
        <ScoreRow label="Etika" criterion={row.ethical_acceptability} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-surface-alt border border-border-strong text-ink-muted">
          {SPEED_LABELS[row.speed]}
        </span>
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-surface-alt border border-border-strong text-ink-muted">
          {COST_LABELS[row.cost]}
        </span>
      </div>

      {flagged && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-critical bg-critical-soft px-2.5 py-2 rounded-lg">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
          Ne preporučuje se — etička ograda (etika &lt; 4/5)
        </p>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-accent font-semibold flex items-center gap-1.5 list-none [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          Obrazloženje ocjena
        </summary>
        <dl className="mt-2.5 text-ink-muted leading-relaxed space-y-1.5">
          <div>
            <dt className="font-semibold text-ink inline">Učinak: </dt>
            <dd className="inline">{row.impact.rationale}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink inline">Dokazi: </dt>
            <dd className="inline">{row.evidence_quality.rationale}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink inline">Izvedivost: </dt>
            <dd className="inline">{row.feasibility.rationale}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink inline">Etika: </dt>
            <dd className="inline">{row.ethical_acceptability.rationale}</dd>
          </div>
        </dl>
      </details>
    </article>
  );
}

function PriorityMatrix({ matrix }) {
  if (!matrix?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className={LABEL}>Matrica prioritizacije</p>
      <p className="text-[13px] leading-relaxed text-ink-muted max-w-[74ch]">
        Ocjena 1–5 po kriteriju: učinak 40&nbsp;%, dokazna osnova 25&nbsp;%, izvedivost 20&nbsp;%, etička
        prihvatljivost 15&nbsp;%. Etička prihvatljivost ispod 4/5 automatski isključuje intervenciju iz
        prioriteta, bez obzira na ukupni rezultat.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {matrix.map((row, i) => (
          <PriorityCard key={i} row={row} />
        ))}
      </div>
    </div>
  );
}

function MetricList({ title, items, tone }) {
  if (!items?.length) return null;
  const pillTone =
    tone === "lead" ? "bg-accent-soft text-accent" : tone === "lag" ? "bg-surface-alt text-ink-muted border border-border-strong" : "bg-warning-soft text-warning";
  return (
    <div className={`rounded-[10px] border p-[18px] ${tone === "safeguard" ? "bg-warning-soft border-transparent" : "bg-surface border-border"}`}>
      <span className={`inline-flex text-[11.5px] font-semibold px-2.5 py-1 rounded-full mb-3 ${pillTone}`}>{title}</span>
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-[13.5px] text-ink leading-relaxed flex gap-2">
            <span className="text-ink-faint">–</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricsSection({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className={LABEL}>Ključni pokazatelji</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricList title="Vodeći" items={metrics.leading} tone="lead" />
        <MetricList title="Zaostali" items={metrics.lagging} tone="lag" />
        <MetricList title="Zaštitni" items={metrics.safeguard} tone="safeguard" />
      </div>
    </div>
  );
}

function EvidenceCard({ text }) {
  if (!text) return null;
  return (
    <article className={CARD}>
      <p className={LABEL}>Dokazna osnova i ograničenja</p>
      <p className="font-display text-[16.5px] leading-relaxed text-ink max-w-[68ch]">{text}</p>
    </article>
  );
}

function PilotCard({ pilot }) {
  if (!pilot) return null;
  const rows = [
    ["Hipoteza", pilot.hypothesis],
    ["Ciljana skupina", pilot.target_group],
    ["Trajanje", pilot.duration],
    ["Prag uspjeha", pilot.success_threshold],
    ["Pravilo zaustavljanja", pilot.stopping_rules],
  ];
  return (
    <article className="flex gap-4 rounded-[10px] border-l-[3px] border-warning bg-warning-soft p-[22px_24px]">
      <span className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-surface text-warning flex-shrink-0">
        <FlaskConical className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className={`${LABEL} text-warning`}>Predloženi pilot-test</p>
        <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-2">
          {rows.map(([dt, dd]) =>
            dd ? (
              <div className="contents" key={dt}>
                <dt className="text-xs font-semibold text-ink">{dt}</dt>
                <dd className="text-[13px] text-ink-muted leading-relaxed">{dd}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>
    </article>
  );
}

function FirstStepCard({ text }) {
  if (!text) return null;
  return (
    <article className="flex gap-4 rounded-[10px] border-l-[3px] border-success bg-success-soft p-[22px_24px]">
      <span className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-surface text-success flex-shrink-0">
        <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
      </span>
      <div>
        <p className={`${LABEL} text-success`}>Prvi korak</p>
        <p className="font-display text-[17.5px] font-semibold leading-snug text-ink text-balance">{text}</p>
      </div>
    </article>
  );
}

function ClarifyingQuestions({ questions }) {
  return (
    <div className="max-w-[640px] mx-auto bg-surface border border-border rounded-[10px] p-[26px_28px] flex flex-col gap-4">
      <p className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-accent">Trebam još par informacija</p>
      <p className="text-[14.5px] text-ink-muted leading-relaxed">
        Opis problema je prekratak za pouzdanu COM-B dijagnozu. Dopunite opis u lijevom panelu odgovorima na
        pitanja ispod i ponovno kliknite &quot;Generiraj Akcijski Plan&quot;.
      </p>
      <ol className="flex flex-col gap-2.5 list-decimal list-inside">
        {questions?.map((q, i) => (
          <li key={i} className="text-[14.5px] text-ink leading-relaxed">
            {q}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ReportView({ plan, mode, setMode, generatedAt }) {
  if (!plan) return null;

  if (plan.mode === "needs_clarification") {
    return <ClarifyingQuestions questions={plan.clarifying_questions} />;
  }

  const isDetailed = mode === "detailed";

  return (
    <div className="flex flex-col gap-[22px] max-w-[900px] mx-auto">
      <ReportHeader generatedAt={generatedAt} />
      <ModeToggle mode={mode} setMode={setMode} />
      <SummaryCard summary={plan.summary} />
      <TargetBehaviourCard targetBehaviour={plan.target_behaviour} />
      <CombGrid combAnalysis={plan.comb_analysis} />
      <ActionPlan actionPlan={plan.action_plan} isDetailed={isDetailed} />
      <PriorityMatrix matrix={plan.prioritisation_matrix} />
      <MetricsSection metrics={plan.metrics} />
      <EvidenceCard text={plan.evidence_and_limitations} />
      {isDetailed && <PilotCard pilot={plan.pilot} />}
      <FirstStepCard text={plan.first_step} />
      <p className="text-xs text-ink-faint italic text-center pt-2">
        Analiza je generirana putem Gemini API-ja na temelju unesenog opisa i priložene dokumentacije.
      </p>
    </div>
  );
}
