"""
Dohvat SATNE (hourly) Google Trends rezolucije za "insomnia" i "suicide" (UK),
za analizu dnevne (24h) komponente kosinor modelom (vidi analyze_hourly.py).

ISTRAZIVACKI ALAT ZA GENERIRANJE HIPOTEZA — NE klinicki prediktivni sustav.

Zasto posebni pozivi, odvojeno od fetch.py:
Google Trends vraca satnu rezoluciju SAMO za prozore duljine 72h-8 dana (vidi
tablicu rezolucija u fetch.py). To je posve druga vremenska skala od
glavne mjesecne serije (2015.-danas), pa treba zaseban skup poziva. Kao i kod
glavne serije, insomnia+suicide se DOHVACAJU ZAJEDNO u svakom pozivu da bi
0-100 skala bila usporediva unutar tog poziva.

Zbog satnog ogranicenja duljine prozora, ne mozemo dobiti satnu rezoluciju za
cijelo razdoblje 2015.-2026. u jednom pozivu. Umjesto toga dohvacamo NEDAVNIH
N_WEEKS uzastopnih punih tjedana (zadano 6, tj. ~1008 satnih tocaka, 42
zapazanja po svakom od 24 sata dana) i njih spajamo. Ovo je NAMJERNO ogranicena
snimka nedavnog obrasca - NE povijesna analiza cijelog razdoblja - i tako je
oznaceno u summary_hourly.md.
"""

from __future__ import annotations

import logging
import time
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from fetch import (
    GEO,
    KEYWORDS,
    MIN_REQUEST_DELAY,
    OUTPUT_DIR,
    Trends,
    _cache_is_fresh,
    _cache_path,
    _fetch_with_retry,
    _load_cache,
    _save_cache,
)

log = logging.getLogger("fetch_hourly")

N_WEEKS = 6  # broj uzastopnih punih 7-dnevnih prozora (svaki < 8 dana => satna rezolucija)
WEEK_DAYS = 7

HOURLY_OUT_PATH = OUTPUT_DIR / "raw_interest_over_time_hourly.csv"


def _week_windows(n_weeks: int = N_WEEKS) -> list[tuple[date, date]]:
    """N uzastopnih punih tjedana koji zavrsavaju jucer (danasnji dan moze biti
    nepotpun pa ga izbjegavamo)."""
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=n_weeks * WEEK_DAYS)
    windows = []
    for i in range(n_weeks):
        w_start = start + timedelta(days=i * WEEK_DAYS)
        w_end = w_start + timedelta(days=WEEK_DAYS)
        windows.append((w_start, w_end))
    return windows


def fetch_hourly_window(tr: Trends, w_start: date, w_end: date) -> pd.DataFrame:
    span_days = (w_end - w_start).days
    assert 3 <= span_days < 8, (
        f"Prozor {w_start}-{w_end} ima {span_days} dana - izvan (72h, 8 dana) "
        "raspona koji Google Trends mapira na satnu rezoluciju."
    )
    timeframe = f"{w_start.isoformat()}T00 {w_end.isoformat()}T00"
    cache_key = f"hourly_{GEO}_{w_start.isoformat()}_{w_end.isoformat()}"
    cache_path = _cache_path(cache_key)
    if _cache_is_fresh(cache_path):
        return _load_cache(cache_path)

    df = _fetch_with_retry(
        tr, keywords=KEYWORDS, timeframe=timeframe, geo=GEO,
        context=f"satni prozor {w_start} - {w_end}",
    )
    time.sleep(MIN_REQUEST_DELAY)
    _save_cache(df, cache_path)
    return df


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    tr = Trends(request_delay=MIN_REQUEST_DELAY, max_retries=3)

    windows = _week_windows()
    log.info("=== Satna rezolucija: %d uzastopnih tjedana, %s - %s ===", len(windows), windows[0][0], windows[-1][1])

    frames = []
    for w_start, w_end in windows:
        df = fetch_hourly_window(tr, w_start, w_end)
        frames.append(df)

    hourly = pd.concat(frames)
    hourly = hourly[~hourly.index.duplicated(keep="first")].sort_index()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    hourly.to_csv(HOURLY_OUT_PATH)
    log.info("Spremljeno: %s (%d satnih tocaka, %s - %s)", HOURLY_OUT_PATH, len(hourly), hourly.index.min(), hourly.index.max())


if __name__ == "__main__":
    main()
