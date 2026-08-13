"""
Dohvat Google Trends podataka (Ujedinjeno Kraljevstvo) za pojmove "insomnia" i "suicide".

ISTRAZIVACKI ALAT ZA GENERIRANJE HIPOTEZA — NE klinicki prediktivni sustav.
Vidi README.md i output/summary.md za puno metodolosko upozorenje.

Koristi trendspy (NE pytrends — pytrends je arhiviran 17.4.2025. i vise ne radi
pouzdano protiv trenutnog Google Trends frontenda).

Rezolucija podataka koju Google Trends vraca ovisi ISKLJUCIVO o duljini timeframea
(vidi trendspy.Trends.interest_over_time docstring / stvarnu implementaciju):
    8 dana  <= duljina < 270 dana  -> dnevna rezolucija
    270 dana <= duljina < 1900 dana -> tjedna rezolucija
    duljina >= 1900 dana            -> mjesecna rezolucija

Glavna serija (2015-01-01 do danas) je >1900 dana pa Google automatski vraca
mjesecnu rezoluciju — to je namjerno, u skladu s metodologijom Lee (2020).

Za "fina zumiranja" oko strukturnih lomova zelimo TJEDNU rezoluciju, sto znaci
da prozor mora biti >=270 i <1900 dana. Uska zumiranja od par mjeseci (npr. bas
ozujak-travanj 2017.) bi po ovoj tablici pala u dnevni razred, ne tjedni — zato
su dolje definirani prozori siri (10-13 mjeseci oko 2017. i 2020. dogadaja, ~3
godine za 2022.-2024.) kako bi stvarno pao u tjedni razred. Ovo je namjerno
odstupanje od doslovno najuzeg moguceg prozora, ne bug.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import date, datetime, timezone
from pathlib import Path

import pandas as pd
from trendspy import Trends

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("fetch")

KEYWORDS = ["insomnia", "suicide"]
GEO = "GB"

MAIN_START = "2015-01-01"
MAIN_END = date.today().isoformat()

# min. pauza izmedu poziva (sekunde) - Google agresivno rate-limita
MIN_REQUEST_DELAY = 2.5
CACHE_MAX_AGE_HOURS = 24
MAX_FETCH_ATTEMPTS = 6
BACKOFF_BASE_SECONDS = 3.0

# --- Cookie / User-Agent (opcionalno, samo za lokalno pokretanje) -------------
# Google cesto odbija anonimne scrape zahtjeve (prazan odgovor, 429, ili
# redirect na consent stranicu) dok se ne posalju consent/NID cookiei i
# realistican User-Agent. Oboje se cita IZ OKOLINE - nikad se ne hardkodira
# niti sprema u repozitorij:
#
#   export GOOGLE_TRENDS_COOKIE='NID=...; CONSENT=...; SOCS=...'
#   export GOOGLE_TRENDS_USER_AGENT='Mozilla/5.0 (...) Chrome/...'
#
# Cookie se kopira iz preglednika: otvori trends.google.com prijavljen/nakon
# prihvacanja consenta -> DevTools -> Network -> bilo koji zahtjev prema
# trends.google.com -> Request Headers -> cijela vrijednost 'cookie' zaglavlja.
#
# Cookie je osobni podatak i vrijedi kao vjerodajnica: NE commitaj ga, ne
# dijeli ga i ne stavljaj u logove. Ovaj modul logira samo IMENA cookieja i
# njihov broj, nikad vrijednosti.
COOKIE_ENV_VAR = "GOOGLE_TRENDS_COOKIE"
USER_AGENT_ENV_VAR = "GOOGLE_TRENDS_USER_AGENT"
COOKIE_DOMAIN = ".google.com"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "output"
RAW_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Prozori za tjednu rezoluciju oko poznatih strukturnih lomova.
# Svaki prozor je >=270 i <1900 dana da bi Google zaista vratio tjednu
# rezoluciju (vidi objasnjenje u docstringu modula). Ove serije IMAJU SVOJU
# VLASTITU 0-100 SKALU i NISU direktno usporedive s glavnom serijom niti
# medusobno - koriste se samo za oblik/vrijeme signala unutar svog prozora.
ZOOM_WINDOWS = [
    dict(
        label="2017_13_reasons_why",
        start="2016-09-01",
        end="2017-09-30",
        note="13 Reasons Why (Netflix) objavljen 31.3.2017.",
    ),
    dict(
        label="2020_covid",
        start="2019-10-01",
        end="2020-10-31",
        note="Prvi UK lockdown 23.3.2020.",
    ),
    dict(
        label="2022_2024_cost_of_living",
        start="2022-01-01",
        end="2024-12-31",
        note="Cost of living crisis, UK, 2022.-2024.",
    ),
]


class EmptyTrendsResponseError(RuntimeError):
    """Google Trends je vratio prazan ili blokiran odgovor. NIKAD ne popunjavati izmisljenim vrijednostima."""


def parse_cookie_header(raw: str) -> dict[str, str]:
    """Pretvori sirovo 'cookie' zaglavlje ('k=v; k2=v2') u dict.

    Tolerira visak razmaka, prazne segmente i vrijednosti koje same sadrze '='
    (npr. base64), jer se dijeli samo na PRVOM '='.
    """
    cookies: dict[str, str] = {}
    for segment in raw.split(";"):
        segment = segment.strip()
        if not segment or "=" not in segment:
            continue
        name, value = segment.split("=", 1)
        name = name.strip()
        if name:
            cookies[name] = value.strip()
    return cookies


def build_client() -> Trends:
    """Konstruiraj trendspy klijenta i, ako su postavljeni u okolini,
    primijeni cookie i User-Agent.

    Bez cookieja alat i dalje radi (Google ponekad posluzi anonimne zahtjeve),
    ali s njim je bitno manja vjerojatnost praznog odgovora / 429 / consent
    redirecta pri lokalnom pokretanju.
    """
    tr = Trends(request_delay=MIN_REQUEST_DELAY, max_retries=3)

    user_agent = os.environ.get(USER_AGENT_ENV_VAR, "").strip() or DEFAULT_USER_AGENT
    tr.session.headers.update({"user-agent": user_agent})

    raw_cookie = os.environ.get(COOKIE_ENV_VAR, "").strip()
    if not raw_cookie:
        log.warning(
            "%s nije postavljen - saljem anonimne zahtjeve. Ako Google vrati prazan "
            "odgovor ili 429, kopiraj 'cookie' zaglavlje iz preglednika i postavi ga: "
            "export %s='NID=...; CONSENT=...'",
            COOKIE_ENV_VAR, COOKIE_ENV_VAR,
        )
        return tr

    cookies = parse_cookie_header(raw_cookie)
    if not cookies:
        raise ValueError(
            f"{COOKIE_ENV_VAR} je postavljen ali iz njega nije procitan nijedan "
            "cookie. Ocekivan format je sirovo 'cookie' zaglavlje: 'NID=...; CONSENT=...'."
        )

    for name, value in cookies.items():
        tr.session.cookies.set(name, value, domain=COOKIE_DOMAIN)

    # NIKAD ne logiraj vrijednosti - cookie je vjerodajnica.
    log.info(
        "Primijenjeno %d cookieja iz %s (domena %s): %s",
        len(cookies), COOKIE_ENV_VAR, COOKIE_DOMAIN, ", ".join(sorted(cookies)),
    )
    return tr


def _cache_path(cache_key: str) -> Path:
    return RAW_DIR / f"{cache_key}.csv"


def _cache_is_fresh(path: Path) -> bool:
    if not path.exists():
        return False
    age_hours = (time.time() - path.stat().st_mtime) / 3600
    return age_hours < CACHE_MAX_AGE_HOURS


def _load_cache(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    log.info("Ucitano iz cachea: %s (%d redaka)", path.name, len(df))
    return df


def _save_cache(df: pd.DataFrame, path: Path) -> None:
    df.to_csv(path)
    log.info("Spremljeno u cache: %s (%d redaka, dohvaceno %s)", path.name, len(df), datetime.now(timezone.utc).isoformat())


def _validate_not_empty(df: pd.DataFrame, context: str) -> None:
    if df is None or df.empty:
        raise EmptyTrendsResponseError(
            f"Prazan odgovor za '{context}'. Google Trends je vjerojatno blokirao "
            "zahtjev ili rezultat ne postoji za zadani raspon/regiju. Prekidam - "
            "podaci se NE popunjavaju interpolacijom ni izmisljenim vrijednostima."
        )
    value_cols = [c for c in df.columns if c != "isPartial"]
    if df[value_cols].isna().all(axis=None):
        raise EmptyTrendsResponseError(
            f"Svi podaci za '{context}' su NaN - vjerojatno blokiran/nevaljan odgovor. Prekidam."
        )


def _fetch_with_retry(tr: Trends, *, keywords: list[str], timeframe: str, geo: str, context: str) -> pd.DataFrame:
    last_exc: Exception | None = None
    for attempt in range(1, MAX_FETCH_ATTEMPTS + 1):
        try:
            log.info("Dohvacam '%s' (pokusaj %d/%d): timeframe=%r geo=%r", context, attempt, MAX_FETCH_ATTEMPTS, timeframe, geo)
            df = tr.interest_over_time(keywords=keywords, timeframe=timeframe, geo=geo)
            _validate_not_empty(df, context)
            return df
        except EmptyTrendsResponseError:
            raise
        except Exception as exc:  # trendspy/requests mogu dici razlicite iznimke (HTTPError, ValueError, ...)
            last_exc = exc
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            is_rate_limited = status_code == 429 or "429" in str(exc)
            if attempt == MAX_FETCH_ATTEMPTS:
                break
            delay = BACKOFF_BASE_SECONDS * (2 ** (attempt - 1))
            log.warning(
                "Greska pri dohvatu '%s' (%s%s). Cekam %.1fs prije ponovnog pokusaja.",
                context, exc, " - rate limit (429)" if is_rate_limited else "", delay,
            )
            time.sleep(delay)
    raise RuntimeError(f"Dohvat '{context}' nije uspio nakon {MAX_FETCH_ATTEMPTS} pokusaja.") from last_exc


def fetch_main_series(tr: Trends) -> pd.DataFrame:
    cache_key = f"main_insomnia_suicide_{GEO}_{MAIN_START}_{MAIN_END}"
    cache_path = _cache_path(cache_key)
    if _cache_is_fresh(cache_path):
        return _load_cache(cache_path)

    timeframe = f"{MAIN_START} {MAIN_END}"
    span_days = (date.fromisoformat(MAIN_END) - date.fromisoformat(MAIN_START)).days
    if span_days < 1900:
        log.warning(
            "Glavni raspon je %d dana (<1900) - Google ce vjerojatno vratiti TJEDNU, "
            "ne mjesecnu rezoluciju. Provjeri stvarni broj redaka u vracenom CSV-u.",
            span_days,
        )

    df = _fetch_with_retry(tr, keywords=KEYWORDS, timeframe=timeframe, geo=GEO, context="glavna serija (2015-danas)")
    time.sleep(MIN_REQUEST_DELAY)
    _save_cache(df, cache_path)
    return df


def fetch_zoom_window(tr: Trends, window: dict) -> pd.DataFrame:
    start = date.fromisoformat(window["start"])
    end = date.fromisoformat(window["end"])
    span_days = (end - start).days
    assert 270 <= span_days < 1900, (
        f"Prozor '{window['label']}' ima {span_days} dana - izvan [270,1900) raspona "
        "koji Google Trends mapira na tjednu rezoluciju. Prilagodi start/end."
    )

    cache_key = f"zoom_{window['label']}_{GEO}_{window['start']}_{window['end']}"
    cache_path = _cache_path(cache_key)
    if _cache_is_fresh(cache_path):
        return _load_cache(cache_path)

    timeframe = f"{window['start']} {window['end']}"
    df = _fetch_with_retry(
        tr, keywords=KEYWORDS, timeframe=timeframe, geo=GEO,
        context=f"zoom prozor '{window['label']}' ({window['note']})",
    )
    time.sleep(MIN_REQUEST_DELAY)
    _save_cache(df, cache_path)
    return df


def main() -> None:
    tr = build_client()

    log.info("=== Glavna serija (insomnia + suicide, GB, %s do %s, ZAJEDNICKI poziv) ===", MAIN_START, MAIN_END)
    main_df = fetch_main_series(tr)
    main_out_path = OUTPUT_DIR / "raw_interest_over_time.csv"
    main_df.to_csv(main_out_path)
    log.info("Glavna serija spremljena: %s (%d redaka, rezolucija ~%s)", main_out_path, len(main_df), _infer_resolution(main_df))

    log.info("=== Zoom prozori (tjedna rezolucija, VLASTITA skala po prozoru) ===")
    for window in ZOOM_WINDOWS:
        zoom_df = fetch_zoom_window(tr, window)
        zoom_out_path = OUTPUT_DIR / f"zoom_NOT_COMPARABLE_{window['label']}.csv"
        zoom_df.to_csv(zoom_out_path)
        log.info(
            "Zoom '%s' spremljen: %s (%d redaka, rezolucija ~%s) - NIJE usporediv s glavnom serijom niti drugim zoom prozorima.",
            window["label"], zoom_out_path, len(zoom_df), _infer_resolution(zoom_df),
        )

    log.info("Gotovo. Sirovi podaci u %s, glavni output u %s.", RAW_DIR, OUTPUT_DIR)


def _infer_resolution(df: pd.DataFrame) -> str:
    if len(df.index) < 2:
        return "nepoznato (premalo tocaka)"
    delta_days = (df.index[1] - df.index[0]).days
    if delta_days >= 27:
        return "mjesecna"
    if delta_days >= 6:
        return "tjedna"
    return "dnevna/finija"


if __name__ == "__main__":
    main()
