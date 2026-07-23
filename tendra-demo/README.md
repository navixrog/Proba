# Tendra — AI demo (proof of concept)

Radni demo-prototip AI sloja za pojednostavljivanje javnih natječaja/poziva za sufinanciranje i procjenu
koliko im konkretna tvrtka odgovara ("fit score"). Ovo je dokazni materijal (proof of concept), ne cijela
platforma — nema baze podataka, autentikacije, niti automatskog prikupljanja natječaja.

## Pokretanje

```bash
npm install
npm run dev
```

Otvorite http://localhost:3000. Aplikacija radi odmah, bez API ključa, zahvaljujući **MOCK modu** (vidi
niže) koji je uključen po defaultu.

## Gdje upisati API ključ

1. Kopirajte `.env.example` u `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. U `.env.local` upišite svoj Anthropic API ključ u varijablu `ANTHROPIC_API_KEY`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Da bi aplikacija stvarno zvala Claude API (a ne mock odgovore), postavite u `.env.local`:
   ```
   MOCK_MODE=false
   ```
4. Ponovno pokrenite `npm run dev`.

`.env.local` je u `.gitignore` i nikad se ne commita.

## MOCK_MODE

`MOCK_MODE` je uključen po defaultu (svaka vrijednost osim točno `"false"` znači "uključeno" — vidi
`lib/config.ts`). Kad je uključen:

- API rute (`/api/translate`, `/api/advise`) vraćaju unaprijed pripremljene, realistične JSON odgovore bez
  ijednog poziva Anthropic API-ju.
- Sva tri seed primjera natječaja (gumbi iznad polja za tekst) imaju svoj ručno pripremljeni mock sažetak i
  rade s bilo kojim od tri predefinirana profila tvrtke.
- Ako zalijepite proizvoljan tekst koji ne odgovara nijednom seed primjeru, vraća se generički mock
  odgovor koji to jasno naznačuje (umjesto da izgleda kao stvarna analiza).

Cijeli UI tok — učitavanje, loading stanja, prikaz kartica, prikaz grešaka — testiran je i razvijen u ovom
modu, bez trošenja API poziva.

Za isključivanje MOCK moda postavite `MOCK_MODE=false` u `.env.local` (vidi gore).

## Arhitektura

```
app/
  page.tsx                    # Jedina stranica: unos teksta, odabir profila, gumb "Analiziraj", prikaz rezultata
  api/translate/route.ts      # Sloj 1 (Prevoditelj) — server-side poziv Anthropic API-ju
  api/advise/route.ts         # Sloj 2 (Savjetnik) — server-side poziv Anthropic API-ju
lib/
  prompts.ts                  # System promptovi za oba sloja (mijenjaj samo ovdje)
  config.ts                   # MOCK_MODE flag + naziv modela
  anthropicClient.ts          # Zajednički wrapper oko @anthropic-ai/sdk (JSON parsing, greške)
  types.ts                    # TypeScript tipovi za sažetak natječaja i fit score
  seedTenders.ts              # 3 seed primjera natječaja (izmišljeni, realistični tekstovi)
  companyProfiles.ts          # 3 predefinirana profila tvrtke
  mockData.ts                 # Mock sažeci i mock fit-score logika za MOCK_MODE
components/
  SeedExamples.tsx            # Gumbi za učitavanje seed primjera
  ProfileSelector.tsx         # Dropdown profila + forma za "vlastiti" profil
  LoadingSteps.tsx            # Loading indikator s nazivom trenutnog koraka
  SummaryCard.tsx             # Kartica "Sažetak natječaja" (uključujući "Skrivene zamke")
  FitScoreCard.tsx            # Kartica "Vaš fit score"
```

Tok klika na "Analiziraj":

1. `POST /api/translate` — Claude (Sloj 1 / Prevoditelj) pretvara sirovi tekst natječaja u strukturirani
   JSON sažetak prema shemi definiranoj u `lib/prompts.ts`.
2. `POST /api/advise` — Claude (Sloj 2 / Savjetnik) prima taj sažetak + profil tvrtke i vraća fit score.

Pozivi su namjerno odvojeni (dva zasebna API poziva na dvije zasebne rute) — Savjetnik nikad ne vidi sirovi
tekst natječaja, samo strukturirani izlaz Prevoditelja.

## Poznata ograničenja / pretpostavke (proof of concept)

- Nema baze podataka — stanje je samo u React stateu, ništa se ne pamti nakon reloada.
- Nema automatskog prikupljanja natječaja s EOJN/TED/fondovieu.gov.hr — tekst natječaja korisnik ručno
  zalijepi.
- Nema uploada PDF-ova, logina, naplate ni email obavijesti.
- Mock fit-score logika u `lib/mockData.ts` je pojednostavljena heuristika namijenjena isključivo
  demonstraciji UI toka — stvarna procjena dolazi iz Claude API-ja kad je `MOCK_MODE=false`.
