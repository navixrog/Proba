"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Sparkles, Loader2 } from "lucide-react";

export default function IntakePanel({ onSubmit, loading }) {
  const [problem, setProblem] = useState("");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function addFiles(fileList) {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...pdfs]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    onSubmit({ problem, files });
  }

  return (
    <section
      aria-label="Unos slučaja"
      className="lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] overflow-y-auto border-b lg:border-b-0 lg:border-r border-border bg-accent-strong text-accent-on-dark"
    >
      <div className="px-7 py-10 lg:px-8 lg:py-10 max-w-[460px]">
        <p className="text-[11.5px] font-semibold tracking-[0.09em] uppercase text-white/45 mb-2.5">
          Novi slučaj
        </p>
        <h1 className="font-display text-[29px] leading-[1.22] font-semibold tracking-tight text-balance mb-3.5">
          Pretvorite izazov u ponašanju u provediv, etičan plan.
        </h1>
        <p className="text-[14.5px] leading-relaxed text-white/70 mb-7">
          Opišite situaciju u vašoj instituciji ili priložite postojeću dokumentaciju. Comport analizira problem
          prema COM-B modelu i Behaviour Change Wheelu te izrađuje prioritiziran, etičan akcijski plan.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="problem" className="block text-[12.5px] font-semibold text-white/75 mb-2">
              Opis problema
            </label>
            <textarea
              id="problem"
              rows={7}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Opišite bihevioralni problem ili izazov u vašoj instituciji..."
              className="w-full min-h-[148px] resize-y rounded-lg bg-white/5 border border-white/15 px-3.5 py-3 text-sm leading-relaxed text-accent-on-dark placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            />
          </div>

          <div className="mb-5">
            <span className="block text-[12.5px] font-semibold text-white/75 mb-2">Dokumentacija (neobavezno)</span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
              }}
              className={`rounded-xl border-[1.5px] border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                isDragging ? "bg-white/10 border-white/60" : "border-white/25 hover:bg-white/5 hover:border-white/40"
              }`}
            >
              <UploadCloud className="mx-auto h-7 w-7 text-white/65" strokeWidth={1.75} />
              <p className="text-[13.5px] font-semibold text-accent-on-dark mt-2.5">
                Prenesite pravilnik, izvještaj ili studiju
              </p>
              <p className="text-xs text-white/50 mt-1">PDF datoteke, do 20&nbsp;MB · ili kliknite za odabir</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {files.map((f, idx) => (
                  <li
                    key={`${f.name}-${idx}`}
                    className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-white/55 flex-shrink-0" strokeWidth={1.75} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      aria-label={`Ukloni ${f.name}`}
                      className="text-white/55 hover:text-accent-on-dark hover:bg-white/10 rounded p-0.5"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-on-dark text-accent-strong px-4 py-3.5 text-[14.5px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.99] disabled:cursor-wait disabled:opacity-85"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Sparkles className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            )}
            <span>{loading ? "Generiram analizu…" : "Generiraj Akcijski Plan"}</span>
          </button>
          <p className="text-[11.5px] text-white/45 mt-2.5 text-center leading-relaxed">
            Analiza traje otprilike 30 sekundi. Dokumenti se obrađuju isključivo za potrebe ove analize.
          </p>
        </form>
      </div>
    </section>
  );
}
