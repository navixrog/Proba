"use client";

interface Props {
  step: 1 | 2;
}

export default function LoadingSteps({ step }: Props) {
  const label = step === 1 ? "Čitam natječaj..." : "Uspoređujem s profilom...";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-tendra-purple/20 bg-tendra-purple/5 px-4 py-3 text-sm font-medium text-tendra-purple">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-tendra-purple border-t-transparent" />
      {label}
    </div>
  );
}
