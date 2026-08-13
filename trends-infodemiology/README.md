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
# 1. Dohvat mjesecne/tjedne serije (treba internetski pristup trends.google.com)
python fetch.py

# 2. Statisticka analiza glavne (mjesecne) serije - STL, prewhitening, CCF
python analyze.py

# 3. Dohvat satne rezolucije (nedavni tjedni, za dnevnu/24h komponentu)
python fetch_hourly.py

# 4. Kosinor analiza dnevne (24h) komponente + testovi povezanosti
python analyze_hourly.py
```

`fetch.py` sprema sirove odgovore u `data/raw/` (cache, ponovno se koristi
ako je mlađi od 24h) i glavni output u `output/raw_interest_over_time.csv`
plus tri `output/zoom_NOT_COMPARABLE_*.csv` datoteke. `analyze.py` čita
`output/raw_interest_over_time.csv` i generira sve ostale datoteke u
`output/`. Koraci 3-4 su neovisni o koracima 1-2 (druga vremenska skala,
vidi niže) i mogu se pokrenuti zasebno.

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

### Dnevna (24h) komponenta — `fetch_hourly.py` + `analyze_hourly.py`

Ovo je ODVOJENA analiza na SASVIM DRUGOJ vremenskoj skali od gornje mjesecne
serije — pita se "u koje doba dana ljudi u UK-u pretražuju ove pojmove", ne
"kako se traend mijenja kroz godine".

- **Dohvat**: Google Trends vraća satnu rezoluciju samo za prozore duljine
  72h-8 dana (vidi tablicu rezolucija u `fetch.py`). Zato je nemoguće dobiti
  satnu rezoluciju za cijelo razdoblje 2015.-2026. u jednom pozivu.
  `fetch_hourly.py` umjesto toga dohvaća **6 uzastopnih nedavnih punih
  tjedana** (zadano; ~1008 satnih točaka, insomnia+suicide zajedno kao i
  uvijek) i sprema ih u `output/raw_interest_over_time_hourly.csv`. Ovo je
  namjerno **snimka nedavnog obrasca**, ne povijesna analiza — jasno
  označeno u `summary_hourly.md`.
- **Analiza** (`analyze_hourly.py`):
  1. Satne oznake (Google ih vraća u UTC-u) konvertiraju se u UK lokalno
     vrijeme (`Europe/London`, hvata BST automatski) — "sat u danu" ima
     smisla samo u lokalnom vremenu regije.
  2. **Kosinor model** (Nelson, Tong, Lee & Halberg 1979) po pojmu:
     `y = M + β·cos(2πh/24) + γ·sin(2πh/24)`, h = sat dana. Iz toga se čita
     mesor `M`, amplituda `A`, akrofaza (sat predviđenog dnevnog maksimuma)
     i "zero-amplitude" F-test (postoji li uopće značajan 24h ritam) →
     `output/cosinor_insomnia.png`, `output/cosinor_suicide.png`,
     `output/cosinor_results.csv`.
  3. **Tri testa povezanosti** dnevnog obrasca između `insomnia` i
     `suicide`, namjerno razdvojena da se ne pomiješu:
     - sirova korelacija svih uparenih satnih točaka (naivna, dijelom je
       nužno posljedica toga što obje serije imaju vlastiti 24h ritam),
     - korelacija REZIDUALA nakon što je svakoj seriji oduzet njezin
       vlastiti kosinor fit (povezanost IZVAN zajedničkog dnevnog oblika —
       konceptualno isto kao prewhitening+CCF u `analyze.py`, samo na
       satnoj/24h skali),
     - korelacija prosječnih profila po satu dana (24 uparene točke) — 
       najizravnije mjeri poklapaju li se vrhovi/padovi dana.
     Rezultati u `output/hourly_association.csv` i `output/residual_scatter.png`.
  4. `output/summary_hourly.md` — isto upozorenje s vrha ovog README-a PLUS
     dodatna napomena da je ovo snimka nedavnih tjedana, da dan tjedna
     (radni dan/vikend) nije kontroliran, i da kosinor model hvata samo
     jednu (24h) periodičnu komponentu.

## Struktura

```
trends-infodemiology/
  fetch.py
  analyze.py
  fetch_hourly.py
  analyze_hourly.py
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
    raw_interest_over_time_hourly.csv
    cosinor_insomnia.png
    cosinor_suicide.png
    hourly_profiles_overlay.png
    residual_scatter.png
    cosinor_results.csv
    hourly_association.csv
    summary_hourly.md
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
- `fetch_hourly.py`/`analyze_hourly.py` analiziraju samo NEDAVNE tjedne
  (zadano 6), ne cijelo povijesno razdoblje, i ne stratificiraju po danu
  tjedna — obrazac radnog dana i vikenda je pomiješan u istom kosinor fitu.
  Kosinor model pretpostavlja jedan glatki 24h ciklus; ne modelira nagle
  promjene niti sub-dnevne (npr. 12h) komponente.
