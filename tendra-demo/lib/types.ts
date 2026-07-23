export interface TenderSummary {
  raw_summary: string;
  tko_se_moze_prijaviti: string | null;
  iznos: string | null;
  rokovi: {
    glavni_rok: string | null;
    medjukoraci: string[];
  };
  prihvatljive_aktivnosti: string[];
  neprihvatljive_aktivnosti: string[];
  kriteriji_bodovanja: string[];
  skrivene_zamke: string[];
}

export interface CompanyProfile {
  id: string;
  naziv: string;
  djelatnost: string;
  brojZaposlenih: string;
  zupanija: string;
  reference: string;
}

export type FitLabel = "visok" | "srednji" | "nizak";

export interface FitCondition {
  uvjet: string;
  obrazlozenje: string;
}

export interface UnfitCondition extends FitCondition {
  status: "ne zadovoljava" | "nejasno";
}

export interface FitScore {
  fit_score: number;
  fit_label: FitLabel;
  zadovoljeni_uvjeti: FitCondition[];
  nezadovoljeni_uvjeti: UnfitCondition[];
  preporuka: string;
}

export interface SeedTender {
  id: string;
  naziv: string;
  tekst: string;
}
