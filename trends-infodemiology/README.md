# Infodemiologija: "insomnia" i "suicide" na Google Trendsu (UK, 2015.-danas)

> **UPOZORENJE:** Google Trends RSV je relativan, ne apsolutan volumen. Klinička
> veza nesanica→suicidalnost (Pigeon et al. 2012, RR 1.95–2.95) NE prenosi se
> automatski na razinu agregiranih pretraživanja — Lee (2020) je na američkim
> podacima našao suprotan (negativan) predznak za pojmove vezane uz spavanje.
> Ovaj alat generira hipoteze, ne klinička predviđanja. Ekološka pogreška
> (prijelaz s individualne na populacijsku razinu) je stalan rizik pri
> interpretaciji.

Ovo je **istraživački alat za generiranje hipoteza**, ne klinički prediktivni
sustav. Dohvaća Google Trends Relative Search Volume (RSV) za pojmove
`insomnia` i `suicide` u Ujedinjenom Kraljevstvu (geo=`GB`) od 2015. do danas
i primjenjuje standardnu vremensko-serijsku metodologiju (STL dekompozicija,
prewhitening, cross-correlation) za pretragu vremenskih pomaka između serija.
Svaki output (grafovi, CSV, `summary.md`) nosi gornje upozorenje i sadrži
isključivo numeričke nalaze — bez narativnih zaključaka.

## Zahtjevi

- Python 3.11+
- Nema potrebe za API ključem — `trendspy` scrapea javno dostupne Google
  Trends podatke (ne koristimo `pytrends`, arhiviran 17.4.2025.)

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Pokretanje

```bash
# 1. Dohvat podataka (treba internetski pristup trends.google.com)
python fetch.py

# 2. Statisticka analiza glavne serije
python analyze.py
```

`fetch.py` sprema sirove odgovore u `data/raw/` (cache, ponovno se koristi
ako je mlađi od 24h) i glavni output u `output/raw_interest_over_time.csv`
plus tri `output/zoom_NOT_COMPARABLE_*.csv` datoteke. `analyze.py` čita
`output/raw_interest_over_time.csv` i generira sve ostale datoteke u
`output/`.

Napomena o okruženju: ako pokrećete u sandboxu/CI bez pristupa
`trends.google.com`, `fetch.py` će pasti na prvom pokušaju dohvata (nakon
iscrpljenih retryja) — to je očekivano; struktura i sintaksa koda su
testirane, ali stvarni fetch zahtijeva mrežni pristup s vašeg lokalnog stroja.

## Metodologija

### Dohvat (`fetch.py`)

- **Glavna serija**: JEDAN poziv `interest_over_time(keywords=["insomnia",
  "suicide"], geo="GB", timeframe="2015-01-01 <danas>")`. Oba pojma se
  dohvaćaju zajedno jer Google Trends skalira 0-100 *po zahtjevu* — odvojeni
  pozivi ne bi bili međusobno usporedivi. Raspon >1900 dana automatski daje
  **mjesečnu** rezoluciju (Lee 2020 metodologija).
- **Zoom prozori** (tjedna rezolucija) oko poznatih strukturnih lomova:
  ožujak-travanj 2017. (13 Reasons Why), veljača-lipanj 2020. (COVID),
  2022.-2024. (cost of living crisis). Google Trends mapira duljinu
  timeframea na rezoluciju: `<270 dana` → dnevno, `270-1900 dana` → tjedno,
  `>=1900 dana` → mjesečno. Da bi zumiranja stvarno dobila tjednu (ne
  dnevnu) rezoluciju, prozori u kodu su namjerno širi od "golog" perioda
  događaja (npr. ~13 mjeseci oko ožujka 2017., ne samo ožujak-travanj) — vidi
  komentare u `fetch.py`. **Svaki zoom prozor ima svoju vlastitu 0-100 skalu
  i NIJE usporediv s glavnom serijom niti s drugim zoom prozorima** — koristi
  se isključivo za oblik/vrijeme signala unutar vlastitog prozora, i nije dio
  CCF analize u `analyze.py`.
- Exponential backoff na HTTP 429 (min. 3s, dvostruko rastuće), min. 2.5s
  pauza između svih poziva.
- Cache sirovih odgovora u `data/raw/*.csv`, ponovno iskorišten ako je mlađi
  od 24h.
- Prazan ili blokiran odgovor **diže exception** (`EmptyTrendsResponseError` /
  `RuntimeError`) — nikad se ne popunjava interpolacijom ili izmišljenim
  vrijednostima.

### Analiza (`analyze.py`)

1. **STL dekompozicija** (`statsmodels.tsa.seasonal.STL`, `period=12`) za obje
   mjesečne serije zasebno → `output/stl_insomnia.png`, `output/stl_suicide.png`
   (trend/sezonalnost/rezidual, sa označenim strukturnim lomovima).
2. **Prewhitening**: ARIMA(p,d,q) grid search po AIC (do reda `(3,1,3)`) fitan
   na `insomnia` seriji. ISTI (fiksni) parametri primijenjeni na `suicide`
   seriju bez ponovnog fitanja (`model.filter(params)`), čime se dobiju dvije
   prewhitened rezidualne serije.
3. **Cross-correlation function (CCF)** rezidualnih serija za pomake -12 do
   +12 mjeseci. Pozitivan pomak = `insomnia` prethodi `suicide`; negativan =
   obrnuto. Prikazane su i naivna granica (`±1.96/√N`) i
   Bonferroni-korigirana granica (`α/25`, 25 = broj testiranih pomaka) →
   `output/cross_correlation.png` + `output/cross_correlation.csv` (kolone:
   `lag, r, prekoracuje_naivnu, prekoracuje_bonferroni`).
4. `output/summary.md` — čisto numerički sažetak (raspon podataka, odabrani
   ARIMA red, CCF tablica, koji pomaci prelaze koju granicu), s upozorenjem
   s vrha ovog README-a na vrhu datoteke.

## Struktura

```
trends-infodemiology/
  fetch.py
  analyze.py
  requirements.txt
  data/raw/          # cache sirovih Google Trends odgovora (CSV, 24h TTL)
  output/
    raw_interest_over_time.csv
    zoom_NOT_COMPARABLE_*.csv
    stl_insomnia.png
    stl_suicide.png
    cross_correlation.png
    cross_correlation.csv
    summary.md
```

## Ograničenja i poznata odstupanja

- Ovaj alat NE tvrdi da agregirano pretraživanje predviđa individualni rizik
  suicidalnosti. Vidi upozorenje na vrhu.
- Google Trends RSV je noisy i podložan promjenama Google-ove metodologije
  uzorkovanja kroz vrijeme; usporedbe kroz duže periode treba tumačiti
  oprezno.
- `analyze.py` baca iznimku ako serija nakon poravnavanja na mjesečnu
  frekvenciju sadrži praznine (nedostajuće mjesece) — namjerno, da se ne
  prikrije problem s podacima interpolacijom.
