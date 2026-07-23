import { NextRequest, NextResponse } from "next/server";
import { TRANSLATOR_SYSTEM_PROMPT } from "@/lib/prompts";
import { MOCK_MODE } from "@/lib/config";
import { MOCK_SUMMARIES, buildGenericMockSummary } from "@/lib/mockData";
import { SEED_TENDERS } from "@/lib/seedTenders";
import { callClaudeForJson, ClaudeJsonError } from "@/lib/anthropicClient";
import { TenderSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  let tenderText: string;
  try {
    const body = await req.json();
    tenderText = typeof body?.tenderText === "string" ? body.tenderText : "";
  } catch {
    return NextResponse.json(
      { error: "Neispravan zahtjev — nedostaje tekst natječaja." },
      { status: 400 }
    );
  }

  if (!tenderText.trim()) {
    return NextResponse.json(
      { error: "Tekst natječaja ne smije biti prazan." },
      { status: 400 }
    );
  }

  if (MOCK_MODE) {
    const seed = SEED_TENDERS.find((s) => s.tekst === tenderText);
    const summary = seed ? MOCK_SUMMARIES[seed.id] : buildGenericMockSummary(tenderText);
    return NextResponse.json({ summary });
  }

  try {
    const summary = await callClaudeForJson<TenderSummary>(
      TRANSLATOR_SYSTEM_PROMPT,
      tenderText
    );
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof ClaudeJsonError) {
      return NextResponse.json(
        { error: "AI je vratio odgovor koji nije bilo moguće protumačiti. Pokušajte ponovno." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Došlo je do greške prilikom poziva AI servisa. Pokušajte ponovno." },
      { status: 502 }
    );
  }
}
