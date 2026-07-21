# Comport

Web aplikacija za bihevioralni dizajn (COM-B / Behaviour Change Wheel) namijenjena javnoj upravi, bolnicama
i ESG timovima. Korisnik opiše problem i/ili priloži PDF, a aplikacija poziva Gemini API (persona
"BE practical") i vraća strukturiran, prioritiziran i etički provjeren akcijski plan.

## Postavljanje (korak po korak)

### 1. Nabavi Gemini API ključ

1. Otvori [aistudio.google.com/apikey](https://aistudio.google.com/apikey) i prijavi se Google računom.
2. Klikni **Create API key** (po potrebi odaberi/kreiraj Google Cloud projekt — AI Studio to nudi
   automatski).
3. Kopiraj ključ koji počinje s `AIza...`.

Za razliku od OpenAI Assistants API-ja, kod Gemini-ja **nema posebnog koraka kreiranja "Assistanta"** —
sustavska uputa (persona) šalje se sa svakim pozivom iz `lib/systemPrompt.js`, pa je ključ jedino što
trebaš prije pokretanja.

### 2. Instaliraj i pokreni

```bash
cd comport-app
npm install
cp .env.example .env.local
# otvori .env.local i zalijepi svoj GEMINI_API_KEY
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

### 3. Testiraj

Upiši opis problema (ili priloži PDF), klikni "Generiraj Akcijski Plan". Prvi poziv modelu obično traje
10–30 sekundi (dulje ako su priloženi PDF-ovi, jer se prije analize moraju obraditi preko Gemini Files
API-ja).

## Arhitektura

```
lib/systemPrompt.js     # "BE practical" persona — cjeloviti System Prompt
lib/schema.js           # Gemini responseSchema (Type.OBJECT/...) — prisiljava strukturirani JSON izlaz
lib/labels.js           # Mapiranja enum vrijednosti -> hrvatski labeli i Tailwind klase za UI
lib/gemini.js           # Inicijalizacija @google/genai klijenta
app/api/analyze/route.js  # Upload PDF-ova (Gemini Files API) -> generateContent -> JSON odgovor
components/IntakePanel.jsx  # Lijevi panel: opis problema, drag & drop PDF, gumb s loading stanjem
components/ReportView.jsx   # Desni panel: cijeli izvještaj (sažetak, COM-B, akcijski plan, matrica
                             # prioritizacije, KPI, pilot-protokol, prvi korak)
app/page.js              # Spaja sve, drži state i poziva /api/analyze
```

## Bitne napomene

- **Bez lažnih brojki**: `metrics.leading/lagging/safeguard` su nizovi naziva indikatora, ne izmišljeni
  brojevi ili trendovi — model nema pristup stvarnim podacima institucije osim onoga što mu proslijediš, pa
  UI namjerno ne prikazuje fabricirane vrijednosti.
- **Etička ograda** provjerava se i na serveru (`app/api/analyze/route.js`), ne samo u System Promptu — ako
  je `ethical_acceptability.score < 4`, `eligible_as_priority` se prisilno postavlja na `false` bez obzira
  na model.
- **GDPR higijena**: svaki priloženi PDF briše se s Gemini Files API-ja odmah nakon analize (`finally` blok
  u API ruti).
- **Model**: zadano `gemini-2.5-flash` (brz i jeftin). Za složenije slučajeve s više/dužih PDF-ova postavi
  `GEMINI_MODEL=gemini-2.5-pro` u `.env.local`.
- Ako Gemini vrati grešku tipa "schema too complex", pojednostavi `lib/schema.js` (najčešće pomaže micanje
  `nullable` gdje nije nužno).

## Poznata ograničenja (za budući rad)

- Nema perzistencije — svaki generirani izvještaj živi samo u memoriji preglednika (nema baze/spremanja
  povijesti slučajeva).
- Nema autentikacije — prije produkcijskog korištenja u stvarnoj instituciji dodaj login (npr. NextAuth) i
  rate limiting.
