"""
Uvoz sluzbenog Google Trends CSV exporta (iz web sucelja) u shemu koju
ocekuju analyze.py i analyze_hourly.py.

ISTRAZIVACKI ALAT ZA GENERIRANJE HIPOTEZA — NE klinicki prediktivni sustav.

Zasto postoji: analyze.py i analyze_hourly.py ne trebaju mrezu - citaju samo
CSV. Ako stroj na kojem se vrti analiza nema pristup trends.google.com,
podatke mozes izvesti rucno iz preglednika (gumb za download na grafu
"Interest over time") i uvesti ih ovime.

Googleov UI export ima drukciji format od onoga sto vraca trendspy:

    Category: All categories
    <prazan redak>
    Month,insomnia: (United Kingdom),suicide: (United Kingdom)
    2015-01,45,60

Razlike koje ovaj modul rjesava:
  - dva redka zaglavlja prije stvarnog CSV-a
  - naziv vremenske kolone ovisi o rezoluciji: Month / Week / Day / Time
  - nazivi kolona nose sufiks ': (United Kingdom)' koji treba skinuti
  - vrijednost '<1' znaci "manje od 1", nije broj

VAZNO - vremenska zona satnog exporta:
Google UI izvozi satne oznake u vremenskoj zoni PREGLEDNIKA iz kojeg si
izvezao, ne u UTC-u. Zato --tz mora opisivati zonu exporta; skripta zatim
pretvara u UTC koji analyze_hourly.py ocekuje. Kriva zona = pomak akrofaze
za cijeli sat (ili dva ljeti), sto tiho iskrivi cijeli kosinor nalaz.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("import_csv")

ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "output"

# Naziv vremenske kolone -> (vrsta, je li satna)
TIME_COLUMN_KINDS = {
    "month": "monthly",
    "week": "weekly",
    "day": "daily",
    "time": "hourly",
}

MONTHLY_OUT = OUTPUT_DIR / "raw_interest_over_time.csv"
HOURLY_OUT = OUTPUT_DIR / "raw_interest_over_time_hourly.csv"


class TrendsCsvFormatError(ValueError):
    """CSV ne izgleda kao sluzbeni Google Trends export."""


def find_header_row(lines: list[str]) -> tuple[int, str]:
    """Pronadi redak zaglavlja i vrati (indeks, naziv vremenske kolone).

    Ne pretpostavlja fiksan broj uvodnih redaka - Google je mijenjao broj
    praznih redaka izmedu 'Category:' i zaglavlja.
    """
    for i, line in enumerate(lines):
        first_cell = line.split(",")[0].strip().strip('"').lower()
        if first_cell in TIME_COLUMN_KINDS:
            return i, first_cell
    raise TrendsCsvFormatError(
        "Nije pronaden redak zaglavlja s vremenskom kolonom "
        f"({'/'.join(sorted(TIME_COLUMN_KINDS))}). Je li ovo doista Google Trends "
        "export s grafa 'Interest over time'? Exporti s 'Interest by region' ili "
        "'Related queries' imaju drugu strukturu i nisu upotrebljivi za ovu analizu."
    )


def clean_column_name(raw: str) -> str:
    """'insomnia: (United Kingdom)' -> 'insomnia'."""
    return raw.split(":")[0].strip().strip('"')


def parse_values(series: pd.Series, column: str) -> pd.Series:
    """Pretvori RSV stupac u brojeve, uz eksplicitno rukovanje '<1'.

    '<1' je stvarni Googleov izlaz (ne nedostajuci podatak) i znaci "manje od
    1". Mapira se u 0 jer je to donja granica RSV skale, ali se GLASNO
    prijavljuje - to je supstantivna odluka, ne tiha konverzija.
    """
    as_text = series.astype(str).str.strip()
    below_one = as_text.str.startswith("<")
    if below_one.any():
        log.warning(
            "Stupac '%s': %d vrijednosti '<1' mapirano u 0 (Google tako oznacava "
            "RSV manji od 1). To su stvarne niske vrijednosti, ne praznine.",
            column, int(below_one.sum()),
        )
    as_text = as_text.where(~below_one, "0")

    values = pd.to_numeric(as_text, errors="coerce")
    if values.isna().any():
        bad = as_text[values.isna()].unique()[:5]
        raise TrendsCsvFormatError(
            f"Stupac '{column}' sadrzi vrijednosti koje nisu brojevi: {list(bad)}. "
            "Ne popunjavam ih niti preskacem - provjeri izvornu datoteku."
        )
    return values


def load_export(path: Path, tz: str, kind_override: str | None = None) -> tuple[pd.DataFrame, str]:
    text = path.read_text(encoding="utf-8-sig")
    lines = [ln for ln in text.splitlines() if ln.strip() != ""]
    if not lines:
        raise TrendsCsvFormatError(f"{path} je prazna.")

    header_idx, time_col = find_header_row(lines)
    kind = kind_override or TIME_COLUMN_KINDS[time_col]
    log.info("Prepoznat export: vremenska kolona '%s' -> rezolucija '%s'", time_col, kind)

    df = pd.read_csv(pd.io.common.StringIO("\n".join(lines[header_idx:])))
    df.columns = [clean_column_name(c) for c in df.columns]
    time_name = df.columns[0]

    keyword_cols = list(df.columns[1:])
    if not keyword_cols:
        raise TrendsCsvFormatError("Export nema nijedan stupac s pojmom uz vremensku kolonu.")
    log.info("Pojmovi u exportu: %s", ", ".join(keyword_cols))

    for col in keyword_cols:
        df[col] = parse_values(df[col], col)

    timestamps = pd.to_datetime(df[time_name], errors="coerce")
    if timestamps.isna().any():
        bad = df[time_name][timestamps.isna()].unique()[:5]
        raise TrendsCsvFormatError(f"Neparsabilne vremenske oznake: {list(bad)}")

    if kind == "hourly":
        # Satni UI export je u zoni preglednika; pretvori u UTC za analyze_hourly.py.
        localized = timestamps.dt.tz_localize(tz, ambiguous="infer", nonexistent="shift_forward")
        timestamps = localized.dt.tz_convert("UTC")
        log.info("Satne oznake protumacene kao '%s' i pretvorene u UTC.", tz)

    out = df[keyword_cols].copy()
    out.index = pd.DatetimeIndex(timestamps, name="time [UTC]" if kind == "hourly" else "time")
    out = out.sort_index()

    if out.index.duplicated().any():
        dupes = int(out.index.duplicated().sum())
        raise TrendsCsvFormatError(
            f"Export sadrzi {dupes} duplih vremenskih oznaka. Ne spajam ih automatski."
        )
    return out, kind


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Uvezi sluzbeni Google Trends CSV export u shemu ovog alata."
    )
    parser.add_argument("--input", required=True, type=Path, help="Putanja do CSV-a preuzetog iz Google Trends sucelja.")
    parser.add_argument(
        "--tz", default="Europe/London",
        help="Vremenska zona u kojoj je izvezen SATNI CSV (zona preglednika u trenutku exporta). "
             "Zadano Europe/London jer analiziramo GB. Ignorira se za mjesecne/tjedne exporte.",
    )
    parser.add_argument(
        "--kind", choices=sorted(set(TIME_COLUMN_KINDS.values())), default=None,
        help="Rucno nametni vrstu ako auto-detekcija promasi.",
    )
    parser.add_argument("--output", type=Path, default=None, help="Rucno odredi izlaznu datoteku.")
    args = parser.parse_args(argv)

    if not args.input.exists():
        log.error("Ulazna datoteka ne postoji: %s", args.input)
        return 1

    try:
        df, kind = load_export(args.input, tz=args.tz, kind_override=args.kind)
    except TrendsCsvFormatError as exc:
        log.error("Neispravan format: %s", exc)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if args.output is not None:
        out_path = args.output
    elif kind == "hourly":
        out_path = HOURLY_OUT
    else:
        out_path = MONTHLY_OUT

    df.to_csv(out_path)
    log.info("Spremljeno: %s (%d redaka, %s - %s)", out_path, len(df), df.index.min(), df.index.max())

    if kind == "hourly":
        log.info("Sada mozes pokrenuti: python analyze_hourly.py")
    elif kind == "monthly":
        log.info("Sada mozes pokrenuti: python analyze.py")
    else:
        log.warning(
            "Rezolucija je '%s'. analyze.py ocekuje MJESECNU seriju (STL period=12) i "
            "odbit ce ovu datoteku pri poravnavanju na 'MS' frekvenciju. Izvezi mjesecni "
            "raspon (>=1900 dana, npr. 2015-danas) za glavnu analizu.", kind,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
