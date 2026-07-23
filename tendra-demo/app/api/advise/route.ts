import { NextRequest, NextResponse } from "next/server";
import { ADVISOR_SYSTEM_PROMPT } from "@/lib/prompts";
import { MOCK_MODE } from "@/lib/config";
import {
  buildGenericMockFitScore,
  findTenderIdBySummary,
  getMockFitScore,
} from "@/lib/mockData";
import { callClaudeForJson, ClaudeJsonError } from "@/lib/anthropicClient";
import { CompanyProfile, FitScore, TenderSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  let summary: TenderSummary;
  let profile: CompanyProfile;
  try {
    const body = await req.json();
    summary = body?.summary;
    profile = body?.profile;
    if (!summary || !profile) {
      throw new Error("missing fields");
    }
  } catch {
    return NextResponse.json(
      { error: "Neispravan zahtjev — nedostaje sažetak natječaja ili profil tvrtke." },
      { status: 400 }
    );
  }

  if (MOCK_MODE) {
    const tenderId = findTenderIdBySummary(summary);
    const fitScore = tenderId ? getMockFitScore(profile, tenderId) : buildGenericMockFitScore(profile);
    return NextResponse.json({ fitScore });
  }

  const userMessage = JSON.stringify({ sazetak_natjecaja: summary, profil_tvrtke: profile });

  try {
    const fitScore = await callClaudeForJson<FitScore>(ADVISOR_SYSTEM_PROMPT, userMessage);
    return NextResponse.json({ fitScore });
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
