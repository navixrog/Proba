import { FitScore } from "@/lib/types";

const LABEL_STYLES: Record<FitScore["fit_label"], { text: string; bg: string; ring: string }> = {
  visok: { text: "text-tendra-green", bg: "bg-tendra-green/10", ring: "ring-tendra-green/30" },
  srednji: { text: "text-tendra-yellow", bg: "bg-tendra-yellow/10", ring: "ring-tendra-yellow/30" },
  nizak: { text: "text-tendra-red", bg: "bg-tendra-red/10", ring: "ring-tendra-red/30" },
};

export default function FitScoreCard({ fitScore }: { fitScore: FitScore }) {
  const style = LABEL_STYLES[fitScore.fit_label];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Vaš fit score</h3>

      <div className={`mb-5 flex items-center gap-4 rounded-lg ${style.bg} p-4 ring-1 ${style.ring}`}>
        <div className={`text-5xl font-extrabold ${style.text}`}>{fitScore.fit_score}</div>
        <div>
          <div className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>
            {fitScore.fit_label} fit
          </div>
          <p className="text-sm text-slate-700">{fitScore.preporuka}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-tendra-green">Zadovoljeni uvjeti</h4>
          {fitScore.zadovoljeni_uvjeti.length === 0 ? (
            <p className="text-sm italic text-slate-400">Nema jasno zadovoljenih uvjeta.</p>
          ) : (
            <ul className="space-y-2">
              {fitScore.zadovoljeni_uvjeti.map((u, i) => (
                <li key={i} className="rounded-md bg-tendra-green/5 p-2 text-sm">
                  <span className="font-medium text-slate-900">{u.uvjet}</span>
                  <p className="text-slate-600">{u.obrazlozenje}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Nezadovoljeni / nejasni uvjeti</h4>
          {fitScore.nezadovoljeni_uvjeti.length === 0 ? (
            <p className="text-sm italic text-slate-400">Nema nezadovoljenih ili nejasnih uvjeta.</p>
          ) : (
            <ul className="space-y-2">
              {fitScore.nezadovoljeni_uvjeti.map((u, i) => {
                const isBad = u.status === "ne zadovoljava";
                return (
                  <li
                    key={i}
                    className={`rounded-md p-2 text-sm ${isBad ? "bg-tendra-red/5" : "bg-tendra-yellow/5"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{u.uvjet}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isBad ? "bg-tendra-red/15 text-tendra-red" : "bg-tendra-yellow/15 text-tendra-yellow"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{u.obrazlozenje}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
