"""
Statisticka obrada Google Trends podataka za "insomnia" i "suicide" (UK, 2015.-danas).

ISTRAZIVACKI ALAT ZA GENERIRANJE HIPOTEZA — NE klinicki prediktivni sustav.
Vidi output/summary.md (generira ga ovaj skript) za puno metodolosko upozorenje,
koje MORA biti procitano prije bilo kakve interpretacije rezultata.

Koraci (metodologija Faze 2 izvjestaja, nadahnuta Lee 2020):
    1. STL dekompozicija (period=12) svake mjesecne serije.
    2. Prewhitening: ARIMA(p,d,q) fitan na insomnia seriji (grid search po AIC,
       do reda (3,1,3)), ISTI filter primijenjen na obje serije (bez ponovnog
       fitanja na suicide seriji) da se dobiju rezidualne (prewhitened) serije.
    3. Cross-correlation function (CCF) rezidualnih serija za pomake -12..+12
       mjeseci, s naivnom (+-1.96/sqrt(N)) i Bonferroni-korigiranom granicom.

Output je iskljucivo numericki - ovaj skript ne generira narativne zakljucke
tipa "pronaden signal" niti klinicku interpretaciju.
"""

from __future__ import annotations

import itertools
import logging
import warnings
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import STL

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("analyze")

ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "output"
RAW_CSV = OUTPUT_DIR / "raw_interest_over_time.csv"

STL_PERIOD = 12
MAX_LAG = 12
ARIMA_MAX_P = 3
ARIMA_MAX_D = 1
ARIMA_MAX_Q = 3
ALPHA = 0.05

# Strukturni lomovi oznaceni na STL grafovima (kalendarske pozicije - CCF graf
# ima os pomaka u mjesecima, ne kalendarsko vrijeme, pa se lomovi ne mogu
# smisleno prikazati na njemu; prikazuju se na STL grafovima observed/trend panela).
STRUCTURAL_BREAKS = [
    ("2017-03", "13 Reasons Why (ozujak/travanj 2017.)"),
    ("2020-03", "COVID-19 / prvi UK lockdown (ozujak 2020.)"),
]
STRUCTURAL_BREAK_SPAN = ("2022-01", "2024-12", "Cost of living crisis (2022.-2024.)")

WARNING_BANNER = """> **UPOZORENJE:** Google Trends RSV je relativan, ne apsolutan volumen. Klinička
> veza nesanica→suicidalnost (Pigeon et al. 2012, RR 1.95–2.95) NE prenosi se
> automatski na razinu agregiranih pretraživanja — Lee (2020) je na američkim
> podacima našao suprotan (negativan) predznak za pojmove vezane uz spavanje.
> Ovaj alat generira hipoteze, ne klinička predviđanja. Ekološka pogreška
> (prijelaz s individualne na populacijsku razinu) je stalan rizik pri
> interpretaciji.
"""


def load_series() -> pd.DataFrame:
    if not RAW_CSV.exists():
        raise FileNotFoundError(
            f"{RAW_CSV} ne postoji. Pokreni prvo fetch.py da dohvatis podatke."
        )
    df = pd.read_csv(RAW_CSV, index_col=0, parse_dates=True)
    df.index.name = "time"

    if "isPartial" in df.columns:
        partial_mask = df["isPartial"].astype(str).str.lower().isin({"true", "1"})
        if partial_mask.any():
            dropped = df.index[partial_mask].tolist()
            log.warning("Uklanjam %d nepotpuni(h) redak(a) (isPartial=True): %s", len(dropped), dropped)
            df = df[~partial_mask]
        df = df.drop(columns=["isPartial"])

    df = df.asfreq("MS")
    if df.isna().any(axis=None):
        raise ValueError(
            "Serija sadrzi praznine (NaN) nakon poravnavanja na mjesecnu frekvenciju. "
            "Ovo znaci da su neki mjeseci nedostajali u sirovom odgovoru. Ne popunjavam "
            "interpolacijom - provjeri output/raw_interest_over_time.csv i ponovno "
            "pokreni fetch.py."
        )
    return df


def _add_structural_break_lines(ax, x_is_datetime=True) -> None:
    for month_str, label in STRUCTURAL_BREAKS:
        x = pd.Timestamp(month_str) if x_is_datetime else month_str
        ax.axvline(x, color="crimson", linestyle="--", linewidth=1, alpha=0.8)
    start = pd.Timestamp(STRUCTURAL_BREAK_SPAN[0]) if x_is_datetime else STRUCTURAL_BREAK_SPAN[0]
    end = pd.Timestamp(STRUCTURAL_BREAK_SPAN[1]) if x_is_datetime else STRUCTURAL_BREAK_SPAN[1]
    ax.axvspan(start, end, color="crimson", alpha=0.08)


def run_stl(series: pd.Series, keyword: str) -> STL:
    log.info("STL dekompozicija za '%s' (period=%d, N=%d)", keyword, STL_PERIOD, len(series))
    result = STL(series, period=STL_PERIOD, robust=True).fit()

    fig, axes = plt.subplots(4, 1, figsize=(11, 9), sharex=True)
    panels = [
        (series, "Observed (RSV)"),
        (result.trend, "Trend"),
        (result.seasonal, "Seasonal"),
        (result.resid, "Residual"),
    ]
    for ax, (data, title) in zip(axes, panels):
        ax.plot(data.index, data.values, linewidth=1)
        ax.set_ylabel(title)
        ax.axhline(0, color="gray", linewidth=0.5) if title in {"Seasonal", "Residual"} else None
        _add_structural_break_lines(ax)
    axes[0].set_title(f"STL dekompozicija - '{keyword}' (UK, mjesecno RSV, 2015.-danas)")
    axes[-1].set_xlabel("Vrijeme")
    fig.tight_layout()
    out_path = OUTPUT_DIR / f"stl_{keyword}.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log.info("Spremljeno: %s", out_path)
    return result


def select_arima_order(series: pd.Series) -> tuple[tuple[int, int, int], object, float]:
    log.info(
        "Grid search ARIMA reda za prewhitening (p<=%d, d<=%d, q<=%d) na osnovnoj seriji...",
        ARIMA_MAX_P, ARIMA_MAX_D, ARIMA_MAX_Q,
    )
    best_order = None
    best_res = None
    best_aic = np.inf
    for p, d, q in itertools.product(range(ARIMA_MAX_P + 1), range(ARIMA_MAX_D + 1), range(ARIMA_MAX_Q + 1)):
        if p == 0 and q == 0:
            continue
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = ARIMA(series, order=(p, d, q))
                res = model.fit()
            if np.isfinite(res.aic) and res.aic < best_aic:
                best_aic = res.aic
                best_order = (p, d, q)
                best_res = res
        except Exception as exc:  # nekonvergirajuce/singularne kombinacije - preskoci
            log.debug("ARIMA(%d,%d,%d) nije konvergirao: %s", p, d, q, exc)
            continue

    if best_order is None:
        raise RuntimeError("Nijedna ARIMA kombinacija u grid searchu nije konvergirala.")

    log.info("Odabran ARIMA red: %s (AIC=%.2f)", best_order, best_aic)
    return best_order, best_res, best_aic


def prewhiten(series: pd.Series, order: tuple[int, int, int], fitted_params) -> pd.Series:
    """Primijeni FIKSNE parametre (dobivene fitanjem na insomnia seriji) na `series`
    bez ponovnog fitanja, i vrati rezidual (prewhitened seriju)."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = ARIMA(series, order=order)
        filtered = model.filter(fitted_params)
    resid = filtered.resid.dropna()
    return resid


def cross_correlation(x: pd.Series, y: pd.Series, max_lag: int) -> pd.DataFrame:
    """r(lag) = corr(x[t], y[t+lag]) za lag u [-max_lag, max_lag].
    lag > 0  => x (insomnia) prethodi y (suicide) za `lag` mjeseci.
    lag < 0  => y (suicide) prethodi x (insomnia) za |lag| mjeseci.
    Normalizacija dijeli s FIKSNIM N (ne s brojem preklapajucih tocaka po pomaku),
    sto je standardna Box-Jenkins konvencija i pretpostavka iza granice +-1.96/sqrt(N).
    """
    common_index = x.index.intersection(y.index)
    xv = x.loc[common_index].to_numpy(dtype=float)
    yv = y.loc[common_index].to_numpy(dtype=float)
    n = len(xv)
    if n < (2 * max_lag + 5):
        raise ValueError(
            f"Premalo preklapajucih tocaka ({n}) nakon prewhiteninga za pouzdan CCF do pomaka +-{max_lag}."
        )

    xv = xv - xv.mean()
    yv = yv - yv.mean()
    sx = xv.std(ddof=0)
    sy = yv.std(ddof=0)

    rows = []
    for lag in range(-max_lag, max_lag + 1):
        if lag >= 0:
            xs = xv[: n - lag] if lag > 0 else xv
            ys = yv[lag:]
        else:
            xs = xv[-lag:]
            ys = yv[: n + lag]
        r = float(np.sum(xs * ys) / (n * sx * sy))
        rows.append({"lag": lag, "r": r})

    naive_bound = 1.96 / np.sqrt(n)
    n_tests = 2 * max_lag + 1
    bonferroni_alpha = ALPHA / n_tests
    bonferroni_z = stats.norm.ppf(1 - bonferroni_alpha / 2)
    bonferroni_bound = bonferroni_z / np.sqrt(n)

    ccf_df = pd.DataFrame(rows)
    ccf_df["prekoracuje_naivnu"] = ccf_df["r"].abs() > naive_bound
    ccf_df["prekoracuje_bonferroni"] = ccf_df["r"].abs() > bonferroni_bound
    ccf_df.attrs["n"] = n
    ccf_df.attrs["naive_bound"] = naive_bound
    ccf_df.attrs["bonferroni_bound"] = bonferroni_bound
    ccf_df.attrs["bonferroni_alpha_per_test"] = bonferroni_alpha
    ccf_df.attrs["n_tests"] = n_tests
    return ccf_df


def plot_ccf(ccf_df: pd.DataFrame) -> Path:
    naive_bound = ccf_df.attrs["naive_bound"]
    bonferroni_bound = ccf_df.attrs["bonferroni_bound"]

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.stem(ccf_df["lag"], ccf_df["r"], basefmt=" ")
    ax.axhline(naive_bound, color="orange", linestyle="--", linewidth=1, label=f"naivna granica (+-1.96/sqrt(N)) = {naive_bound:.3f}")
    ax.axhline(-naive_bound, color="orange", linestyle="--", linewidth=1)
    ax.axhline(bonferroni_bound, color="crimson", linestyle=":", linewidth=1.3, label=f"Bonferroni granica (alpha/{ccf_df.attrs['n_tests']}) = {bonferroni_bound:.3f}")
    ax.axhline(-bonferroni_bound, color="crimson", linestyle=":", linewidth=1.3)
    ax.axhline(0, color="gray", linewidth=0.6)
    ax.set_xlabel("Pomak (mjeseci); pozitivno = insomnia prethodi suicide")
    ax.set_ylabel("Cross-korelacija prewhitened rezidua")
    ax.set_title("CCF: insomnia <-> suicide (prewhitened rezidualne serije, UK)")
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    out_path = OUTPUT_DIR / "cross_correlation.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log.info("Spremljeno: %s", out_path)
    return out_path


def write_summary(
    df: pd.DataFrame,
    arima_order: tuple[int, int, int],
    arima_aic: float,
    ccf_df: pd.DataFrame,
) -> None:
    n = ccf_df.attrs["n"]
    naive_bound = ccf_df.attrs["naive_bound"]
    bonferroni_bound = ccf_df.attrs["bonferroni_bound"]
    bonferroni_alpha = ccf_df.attrs["bonferroni_alpha_per_test"]

    exceeds_naive = ccf_df[ccf_df["prekoracuje_naivnu"]]
    exceeds_bonferroni = ccf_df[ccf_df["prekoracuje_bonferroni"]]

    lines = [WARNING_BANNER, ""]
    lines.append("# Infodemioloska analiza: insomnia / suicide (UK, Google Trends)")
    lines.append("")
    lines.append("## Podaci")
    lines.append(f"- Raspon: {df.index.min().date()} - {df.index.max().date()}")
    lines.append(f"- Broj mjesecnih tocaka (nakon uklanjanja nepotpunih): {len(df)}")
    lines.append(f"- Regija: GB (geo kod koristen u Google Trends upitu)")
    lines.append("")
    lines.append("## Prewhitening (ARIMA)")
    lines.append(f"- Red modela fitanog na 'insomnia' seriji (grid search po AIC, do (3,1,3)): ARIMA{arima_order}")
    lines.append(f"- AIC odabranog modela: {arima_aic:.3f}")
    lines.append("- Isti (fiksni) parametri primijenjeni na 'suicide' seriju bez ponovnog fitanja.")
    lines.append(f"- N tocaka koristenih u CCF-u nakon prewhiteninga (uklonjen burn-in diferenciranja): {n}")
    lines.append("")
    lines.append("## Cross-korelacija (CCF), pomaci -12..+12 mjeseci")
    lines.append(f"- Naivna granica znacajnosti (+-1.96/sqrt(N)): +-{naive_bound:.4f}")
    lines.append(
        f"- Bonferroni-korigirana granica (alpha=0.05 / {ccf_df.attrs['n_tests']} testiranih pomaka "
        f"= alpha po testu {bonferroni_alpha:.5f}): +-{bonferroni_bound:.4f}"
    )
    lines.append("")
    lines.append("| lag (mjeseci) | r | prekoracuje_naivnu | prekoracuje_bonferroni |")
    lines.append("|---:|---:|:---:|:---:|")
    for _, row in ccf_df.iterrows():
        lines.append(
            f"| {int(row['lag']):+d} | {row['r']:.4f} | {'DA' if row['prekoracuje_naivnu'] else 'ne'} | "
            f"{'DA' if row['prekoracuje_bonferroni'] else 'ne'} |"
        )
    lines.append("")
    lines.append(
        f"- Pomaci koji prelaze naivnu granicu: "
        + (", ".join(f"{int(l):+d}" for l in exceeds_naive["lag"]) if len(exceeds_naive) else "nijedan")
    )
    lines.append(
        f"- Pomaci koji prelaze Bonferroni granicu: "
        + (", ".join(f"{int(l):+d}" for l in exceeds_bonferroni["lag"]) if len(exceeds_bonferroni) else "nijedan")
    )
    lines.append("")
    lines.append("## Oznaceni strukturni lomovi (na STL grafovima)")
    for month_str, label in STRUCTURAL_BREAKS:
        lines.append(f"- {month_str}: {label}")
    lines.append(f"- {STRUCTURAL_BREAK_SPAN[0]} - {STRUCTURAL_BREAK_SPAN[1]}: {STRUCTURAL_BREAK_SPAN[2]}")
    lines.append("")
    lines.append("## Datoteke")
    lines.append("- `stl_insomnia.png`, `stl_suicide.png` - STL dekompozicija (trend/sezonalnost/rezidual)")
    lines.append("- `cross_correlation.png`, `cross_correlation.csv` - CCF rezultat")
    lines.append(
        "- `zoom_NOT_COMPARABLE_*.csv` (ako postoje, generira ih fetch.py) - tjedni zoom prozori "
        "oko strukturnih lomova, SVAKI SA SVOJOM VLASTITOM 0-100 SKALOM, nisu ukljuceni u CCF analizu."
    )

    out_path = OUTPUT_DIR / "summary.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    log.info("Spremljeno: %s", out_path)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_series()

    stl_insomnia = run_stl(df["insomnia"], "insomnia")
    stl_suicide = run_stl(df["suicide"], "suicide")

    order, arima_res, aic = select_arima_order(df["insomnia"])
    prewhitened_insomnia = arima_res.resid.dropna()
    prewhitened_suicide = prewhiten(df["suicide"], order, arima_res.params)

    ccf_df = cross_correlation(prewhitened_insomnia, prewhitened_suicide, MAX_LAG)
    ccf_csv_path = OUTPUT_DIR / "cross_correlation.csv"
    ccf_df[["lag", "r", "prekoracuje_naivnu", "prekoracuje_bonferroni"]].to_csv(ccf_csv_path, index=False)
    log.info("Spremljeno: %s", ccf_csv_path)

    plot_ccf(ccf_df)
    write_summary(df, order, aic, ccf_df)

    log.info("Gotovo. Svi outputi u %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()
