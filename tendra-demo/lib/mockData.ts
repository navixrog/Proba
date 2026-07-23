import { CompanyProfile, FitScore, TenderSummary } from "./types";

export const MOCK_SUMMARIES: Record<string, TenderSummary> = {
  "ruralni-turizam": {
    raw_summary:
      "Poziv financira ulaganja u ruralni turizam do 200.000 EUR uz sufinanciranje 70%. Ukupno je raspoloživo 25 milijuna EUR. Prijave se podnose elektronički najkasnije do 15. rujna 2024.",
    tko_se_moze_prijaviti:
      "Nositelji nepoljoprivrednih djelatnosti u ruralnim područjima — detaljni uvjeti (kategorija subjekta, broj zaposlenih) nalaze se samo u Prilogu 1 i nisu navedeni u glavnom tekstu.",
    iznos: "Sufinanciranje do 70% troškova, potpora od 5.000 do 200.000 EUR.",
    rokovi: {
      glavni_rok: "15. rujna 2024. do 12:00 sati",
      medjukoraci: [
        "Obvezan prethodni uvid stručnog povjerenstva na lokaciji ulaganja, potrebno zatražiti najmanje 30 dana prije isteka roka.",
      ],
    },
    prihvatljive_aktivnosti: [
      "Građenje i/ili opremanje objekata za turističke i ugostiteljske usluge (do 20 kreveta)",
      "Turistička infrastruktura za aktivni i seoski turizam",
      "Kupnja opreme i strojeva za obavljanje djelatnosti",
    ],
    neprihvatljive_aktivnosti: [
      "Kupnja zemljišta i objekata",
      "Plaćanje poreza",
      "Kupnja rabljene opreme",
      "Ulaganja započeta prije podnošenja zahtjeva (osim općih troškova)",
    ],
    kriteriji_bodovanja: [
      "Ulaganje na području s indeksom razvijenosti I. ili II. skupine — 15 bodova",
      "Nositelj mlađi od 41 godine — 10 bodova",
      "Otvaranje najmanje jednog novog radnog mjesta — 20 bodova",
      "Prijavitelj ranije nije koristio potpore iz javnih izvora — 10 bodova",
      "Mjere energetske učinkovitosti u ulaganju — 15 bodova",
      "Usklađenost s lokalnom razvojnom strategijom — 10 bodova",
    ],
    skrivene_zamke: [
      "Detaljni uvjeti prihvatljivosti korisnika nalaze se samo u Prilogu 1, ne u glavnom tekstu poziva.",
      "Prethodni uvid na lokaciji mora se zatražiti 30 dana unaprijed — lako se propusti jer je spomenuto tek u dijelu o rokovima.",
      "Zahtjevi bez zapisnika o uvidu na lokaciji automatski se smatraju nepotpunima, bez mogućnosti naknadne dopune.",
    ],
  },
  "digitalizacija-msp": {
    raw_summary:
      "Poziv sufinancira digitalizaciju poslovanja MSP-ova s do 150.000 EUR potpore, ovisno o veličini poduzeća. Ukupna alokacija je 40 milijuna EUR, poziv otvoren do 31. listopada 2024. ili do iskorištenja sredstava.",
    tko_se_moze_prijaviti:
      "Trgovačka društva ili obrti registrirani najmanje 12 mjeseci, iz prerađivačke industrije, trgovine ili usluga, bez predstečajnog/stečajnog postupka. Popis isključenih djelatnosti nalazi se u Dodatku A.",
    iznos:
      "10.000-150.000 EUR, intenzitet 50% (srednja), 60% (mala) ili 70% (mikro poduzeća).",
    rokovi: {
      glavni_rok: "31. listopada 2024. ili do iskorištenja sredstava",
      medjukoraci: [
        "Tehnički upit u sustavu potrebno podnijeti najmanje 15 dana prije prijave ako se odgovor želi uzeti u obzir kod ocjene formalne ispravnosti.",
      ],
    },
    prihvatljive_aktivnosti: [
      "Računalna oprema i softver za automatizaciju (ERP, CRM, upravljanje skladištem)",
      "Izrada/unaprjeđenje web-shopa i digitalnih prodajnih kanala",
      "Edukacija zaposlenika (do 10% proračuna projekta)",
      "Rješenja za kibernetičku sigurnost",
    ],
    neprihvatljive_aktivnosti: [
      "Oprema koja se koristi izvan poslovnih prostora prijavitelja",
      "Softverske licence za osobne potrebe",
      "Redovno održavanje postojećih sustava bez unaprjeđenja",
    ],
    kriteriji_bodovanja: [
      "Doprinos zelenoj tranziciji — do 20 bodova",
      "Niži stupanj digitalne zrelosti prije projekta — do 25 bodova",
      "Udio vlastitih sredstava iznad minimuma — do 15 bodova",
      "Broj zaposlenih koji koriste rješenja — do 20 bodova",
      "Postojanje prethodne strategije digitalizacije — do 20 bodova",
    ],
    skrivene_zamke: [
      "Prijavitelj mora sam izračunati status povezanog/partnerskog poduzeća prema Prilogu 3 — lako se pogrešno procijeni veličina poduzeća.",
      "Popis isključenih NKD djelatnosti nalazi se samo u Dodatku A, ne u glavnom tekstu.",
      "Tehnički upit 15 dana unaprijed nije obavezan za samu prijavu, ali njegov izostanak može značiti da se eventualna greška u dokumentaciji ne ispravi na vrijeme.",
    ],
  },
  "energetska-ucinkovitost": {
    raw_summary:
      "Poziv financira energetsku obnovu i obnovljive izvore energije u poduzećima s do 100.000 EUR potpore (65% troškova), u okviru pravila de minimis. Poziv je trajno otvoren do iskorištenja sredstava.",
    tko_se_moze_prijaviti:
      "Poduzetnici s djelatnošću na području županije koja sufinancira poziv, bez nepodmirenih obveza prema županiji i državi. Isključeni su pojedini sektori (poljoprivreda, ribarstvo, dio cestovnog prijevoza) prema Prilogu 1.",
    iznos: "Do 65% prihvatljivih troškova, najviše 100.000 EUR po poduzetniku (de minimis, limit 300.000 EUR u 3 fiskalne godine).",
    rokovi: {
      glavni_rok: "Trajno otvoren do objave obustave zbog iskorištenosti sredstava",
      medjukoraci: [
        "Obvezni energetski pregled objekta (o trošku poduzetnika) mora se dostaviti u roku 60 dana od obavijesti o formalnoj ispravnosti, inače se gubi pravo prvenstva.",
      ],
    },
    prihvatljive_aktivnosti: [
      "Toplinska izolacija ovojnice zgrade",
      "Zamjena vanjske stolarije",
      "Fotonaponske elektrane za vlastitu potrošnju do 500 kW",
      "Dizalice topline",
      "Energetski pregled kao prateća aktivnost",
    ],
    neprihvatljive_aktivnosti: [
      "Fotonaponske elektrane namijenjene prodaji energije na tržištu",
      "Generatori na fosilna goriva",
      "Troškovi nastali prije podnošenja iskaza interesa",
    ],
    kriteriji_bodovanja: [
      "Očekivana ušteda energije u odnosu na investiciju — 30 bodova",
      "Postojanje energetskog certifikata prije ulaganja — 15 bodova",
      "Udio obnovljivih izvora u ulaganju — 25 bodova",
      "Manji broj zaposlenih nosi više bodova — 15 bodova",
      "Ranije korištenje sredstava Fonda smanjuje bodove (0 ako je korišteno u zadnje 3 godine) — 15 bodova",
    ],
    skrivene_zamke: [
      "Rok od 60 dana za dostavu energetskog pregleda nakon formalne ispravnosti lako se propusti jer je naveden tek u dijelu o postupku, ne u sažetku roka.",
      "Ranije korištenje potpore Fonda u zadnje 3 godine nosi 0 bodova na tom kriteriju — nije jasno rečeno na početku teksta.",
      "De minimis limit od 300.000 EUR odnosi se na sve potpore primljene u tekućoj i prethodne dvije fiskalne godine, ne samo na ovaj poziv.",
    ],
  },
};

function heuristicFit(profile: CompanyProfile, tenderId: string): FitScore {
  const zaposlenih = parseInt(profile.brojZaposlenih, 10) || 0;

  if (tenderId === "ruralni-turizam") {
    const zadovoljeni = [
      {
        uvjet: "Djelatnost vezana uz turizam/seoski turizam",
        obrazlozenje: `Profil navodi djelatnost "${profile.djelatnost}", što odgovara prihvatljivim aktivnostima poziva.`,
      },
    ];
    const nezadovoljeni: FitScore["nezadovoljeni_uvjeti"] = [
      {
        uvjet: "Ulaganje na području s indeksom razvijenosti I. ili II. skupine",
        obrazlozenje:
          "Profil tvrtke navodi samo županiju, ne i indeks razvijenosti jedinice lokalne samouprave.",
        status: "nejasno",
      },
      {
        uvjet: "Otvaranje najmanje jednog novog radnog mjesta",
        obrazlozenje: "Profil ne navodi planira li se novo zapošljavanje u sklopu ulaganja.",
        status: "nejasno",
      },
    ];
    if (zaposlenih > 20) {
      nezadovoljeni.push({
        uvjet: "Detaljni uvjeti veličine poduzetnika (Prilog 1)",
        obrazlozenje:
          "Broj zaposlenih premašuje uobičajene pragove za male ruralne subjekte, a detaljni prag nije naveden u glavnom tekstu.",
        status: "nejasno",
      });
    }
    return buildScore(zadovoljeni, nezadovoljeni);
  }

  if (tenderId === "digitalizacija-msp") {
    const zadovoljeni: FitScore["zadovoljeni_uvjeti"] = [];
    const nezadovoljeni: FitScore["nezadovoljeni_uvjeti"] = [];

    if (/it|softver|digital/i.test(profile.djelatnost)) {
      zadovoljeni.push({
        uvjet: "Sektorska prihvatljivost djelatnosti",
        obrazlozenje: `Djelatnost "${profile.djelatnost}" je digitalno-tehnološke prirode, no poziv izričito traži prerađivačku industriju, trgovinu ili usluge — potrebna dodatna provjera NKD oznake.`,
      });
      nezadovoljeni.push({
        uvjet: "Usklađenost NKD oznake s Dodatkom A",
        obrazlozenje:
          "Profil ne sadrži točnu NKD oznaku pa se ne može potvrditi je li djelatnost na popisu isključenih iz Dodatka A.",
        status: "nejasno",
      });
    } else {
      zadovoljeni.push({
        uvjet: "Sektorska prihvatljivost djelatnosti",
        obrazlozenje: `Djelatnost "${profile.djelatnost}" odgovara prerađivačkoj industriji/uslugama koje poziv navodi kao prihvatljive.`,
      });
    }

    if (zaposlenih <= 9) {
      zadovoljeni.push({
        uvjet: "Kategorija mikro poduzeća (viši intenzitet potpore 70%)",
        obrazlozenje: `Profil navodi ${zaposlenih} zaposlenih, što odgovara kategoriji mikro poduzeća.`,
      });
    } else if (zaposlenih <= 49) {
      zadovoljeni.push({
        uvjet: "Kategorija malog poduzeća (intenzitet potpore 60%)",
        obrazlozenje: `Profil navodi ${zaposlenih} zaposlenih, što odgovara kategoriji malog poduzeća.`,
      });
    }

    nezadovoljeni.push({
      uvjet: "Registracija najmanje 12 mjeseci prije objave Poziva",
      obrazlozenje:
        "Profil ne navodi točan datum osnivanja/registracije, pa se uvjet ne može potvrditi.",
      status: "nejasno",
    });

    return buildScore(zadovoljeni, nezadovoljeni);
  }

  // energetska-ucinkovitost
  const zadovoljeni: FitScore["zadovoljeni_uvjeti"] = [
    {
      uvjet: "Poduzetnik s registriranom gospodarskom djelatnošću",
      obrazlozenje: `Profil potvrđuje registriranu djelatnost "${profile.djelatnost}" u ${profile.zupanija}.`,
    },
  ];
  const nezadovoljeni: FitScore["nezadovoljeni_uvjeti"] = [
    {
      uvjet: "Vlasništvo ili drugo odgovarajuće pravo na objektu",
      obrazlozenje: "Profil ne sadrži podatak o vlasničkom statusu poslovnog objekta.",
      status: "nejasno",
    },
    {
      uvjet: "Nepostojanje nepodmirenih obveza prema županiji/državi",
      obrazlozenje: "Profil ne navodi status podmirenja obveza.",
      status: "nejasno",
    },
    {
      uvjet: "Ranije korištenje sredstava Fonda u zadnje 3 godine",
      obrazlozenje:
        "Profil ne navodi je li tvrtka ranije koristila sredstva Fonda, što izravno utječe na broj bodova.",
      status: "nejasno",
    },
  ];
  return buildScore(zadovoljeni, nezadovoljeni);
}

function buildScore(
  zadovoljeni: FitScore["zadovoljeni_uvjeti"],
  nezadovoljeni: FitScore["nezadovoljeni_uvjeti"]
): FitScore {
  const neZadovoljava = nezadovoljeni.filter((u) => u.status === "ne zadovoljava").length;
  const nejasno = nezadovoljeni.filter((u) => u.status === "nejasno").length;
  const ukupno = zadovoljeni.length + nezadovoljeni.length || 1;

  const raw =
    (zadovoljeni.length * 100 - neZadovoljava * 60 - nejasno * 25) / ukupno;
  const fit_score = Math.max(5, Math.min(95, Math.round(raw)));

  let fit_label: FitScore["fit_label"] = "nizak";
  if (fit_score >= 70) fit_label = "visok";
  else if (fit_score >= 40) fit_label = "srednji";

  const preporuka =
    nejasno > 0
      ? `Prije prijave prikupite dodatne podatke za ${nejasno} nejasan/a uvjet/a — bez toga nije moguće pouzdano procijeniti prihvatljivost.`
      : neZadovoljava > 0
      ? "Trenutni profil ne zadovoljava ključne uvjete poziva, prijava se ne preporučuje bez izmjene ulaganja."
      : "Profil dobro odgovara uvjetima poziva, preporučuje se pripremiti prijavu.";

  return {
    fit_score,
    fit_label,
    zadovoljeni_uvjeti: zadovoljeni,
    nezadovoljeni_uvjeti: nezadovoljeni,
    preporuka,
  };
}

export function getMockFitScore(profile: CompanyProfile, tenderId: string): FitScore {
  if (MOCK_SUMMARIES[tenderId]) {
    return heuristicFit(profile, tenderId);
  }
  return heuristicFit(profile, "energetska-ucinkovitost");
}

/** Pronalazi id seed natječaja čiji se sažetak podudara s danim TenderSummary objektom. */
export function findTenderIdBySummary(summary: TenderSummary): string | null {
  const entry = Object.entries(MOCK_SUMMARIES).find(
    ([, value]) => value.raw_summary === summary.raw_summary
  );
  return entry ? entry[0] : null;
}

/** Generički mock sažetak za tekst koji ne odgovara nijednom pripremljenom primjeru. */
export function buildGenericMockSummary(rawText: string): TenderSummary {
  const preview = rawText.trim().slice(0, 220);
  return {
    raw_summary: `MOCK način rada: uneseni tekst ne odgovara nijednom pripremljenom primjeru, pa je ovo generički prikaz. Početak unesenog teksta: "${preview}${
      rawText.trim().length > 220 ? "..." : ""
    }"`,
    tko_se_moze_prijaviti: null,
    iznos: null,
    rokovi: { glavni_rok: null, medjukoraci: [] },
    prihvatljive_aktivnosti: [],
    neprihvatljive_aktivnosti: [],
    kriteriji_bodovanja: [],
    skrivene_zamke: [
      "MOCK način rada ne analizira stvarni sadržaj unesenog teksta — uključite pravi API poziv (MOCK_MODE=false) za stvarnu analizu.",
    ],
  };
}

/** Generički mock fit score kad sažetak ne potječe ni od jednog pripremljenog primjera. */
export function buildGenericMockFitScore(profile: CompanyProfile): FitScore {
  return buildScore(
    [],
    [
      {
        uvjet: "Uvjeti prihvatljivosti natječaja",
        obrazlozenje:
          "MOCK način rada ne može procijeniti stvarne uvjete jer sažetak natječaja nije prepoznat kao jedan od pripremljenih primjera.",
        status: "nejasno",
      },
      {
        uvjet: `Usklađenost profila "${profile.naziv}" s natječajem`,
        obrazlozenje: "Potrebna je stvarna AI analiza (isključite MOCK_MODE) za pouzdanu procjenu.",
        status: "nejasno",
      },
    ]
  );
}

export const GENERIC_MOCK_SUMMARY: TenderSummary = MOCK_SUMMARIES["ruralni-turizam"];
