"use client";

import { SEED_TENDERS } from "@/lib/seedTenders";

interface Props {
  onSelect: (tekst: string) => void;
  disabled?: boolean;
}

export default function SeedExamples({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {SEED_TENDERS.map((seed) => (
        <button
          key={seed.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(seed.tekst)}
          className="rounded-full border border-tendra-purple/30 bg-white px-4 py-1.5 text-sm font-medium text-tendra-purple transition hover:bg-tendra-purple/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {seed.naziv}
        </button>
      ))}
    </div>
  );
}
