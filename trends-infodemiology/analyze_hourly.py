"""
Analiza dnevne (24h, "vrijeme u danu po satima") komponente za "insomnia" i
"suicide" (UK) kosinor modelom, te testovi povezanosti dnevnog obrasca
izmedu dvije serije.

ISTRAZIVACKI ALAT ZA GENERIRANJE HIPOTEZA — NE klinicki prediktivni sustav.
Vidi output/summary_hourly.md (generira ga ovaj skript) za puno metodolosko
upozorenje, koje MORA biti procitano prije bilo kakve interpretacije.

Metodologija:
    1. Kosinor model (Nelson, Tong, Lee & Halberg 1979) po seriji:
           y = M + beta*cos(2*pi*h/24) + gamma*sin(2*pi*h/24) + e
       gdje je h sat dana (0-23) PO UK LOKALNOM VREMENU (Europe/London,
       ukljucujuci BST) - Google Trends vraca satne oznake u UTC-u, konverzija
       se radi eksplicitno u load_hourly().
       - M = mesor (dnevni prosjek)
       - A = amplituda = sqrt(beta^2 + gamma^2)
       - akrofaza = sat dana (0-23) predvidenog dnevnog maksimuma
       - "zero-amplitude" F-test (H0: beta=gamma=0, tj. nema 24h ritma)
    2. Povezanost izmedu insomnia i suicide dnevnog obrasca testira se na TRI
       nacina koji se ne smiju mijesati:
           a) sirova korelacija uparenih satnih tocaka (naivna - dijelom je
              nuzno posljedica toga sto obje serije imaju vlastiti 24h ritam)
           b) korelacija REZIDUALA nakon sto je svakoj seriji oduzet njezin
              vlastiti kosinor fit (analogno prewhiteningu u analyze.py -
              mjeri povezanost IZVAN zajednickog 24h oblika)
           c) korelacija prosjecnih profila po satu dana (24 uparene tocke;
              mean RSV po satu, pooled preko svih dana) - najizravnije mjeri
              "poklapaju li se vrhovi/padovi dana"
"""

from __future__ import annotations

import logging
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats

from fetch_hourly import HOURLY_OUT_PATH
from fetch import OUTPUT_DIR, KEYWORDS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("analyze_hourly")

LOCAL_TZ = "Europe/London"
PERIOD_HOURS = 24

WARNING_BANNER = """> **UPOZORENJE:** Google Trends RSV je relativan, ne apsolutan volumen. Klinička
> veza nesanica→suicidalnost (Pigeon et al. 2012, RR 1.95–2.95) NE prenosi se
> automatski na razinu agregiranih pretraživanja — Lee (2020) je na američkim
> podacima našao suprotan (negativan) predznak za pojmove vezane uz spavanje.
> Ovaj alat generira hipoteze, ne klinička predviđanja. Ekološka pogreška
> (prijelaz s individualne na populacijsku razinu) je stalan rizik pri
> interpretaciji.
>
> **Dodatno za satnu (dnevnu) analizu:** ovo je snimka NEDAVNIH tjedana
> (vidi fetch_hourly.py), ne povijesna analiza 2015.-2026.; dan tjedna
> (radni dan/vikend) nije kontroliran niti stratificiran; kosinor model
> pretpostavlja jedan 24h ciklus i ne hvata sub-dnevne (npr. 12h) komponente.
"""


def load_hourly() -> pd.DataFrame:
    if not HOURLY_OUT_PATH.exists():
        raise FileNotFoundError(
            f"{HOURLY_OUT_PATH} ne postoji. Pokreni prvo fetch_hourly.py."
        )
    df = pd.read_csv(HOURLY_OUT_PATH, index_col=0, parse_dates=True)
    df.index.name = "time"

    if "isPartial" in df.columns:
        partial_mask = df["isPartial"].astype(str).str.lower().isin({"true", "1"})
        if partial_mask.any():
            log.warning("Uklanjam %d nepotpuni(h) satni(h) redak(a) (isPartial=True).", partial_mask.sum())
            df = df[~partial_mask]
        df = df.drop(columns=["isPartial"])

    if df.isna().any(axis=None):
        raise ValueError(
            "Satna serija sadrzi NaN vrijednosti. Ne popunjavam interpolacijom - "
            "provjeri output/raw_interest_over_time_hourly.csv i ponovno pokreni fetch_hourly.py."
        )

    # trendspy vraca index kao 'time [UTC]' (naivan, bez tz oznake, ali u UTC-u).
    # Eksplicitno lokaliziramo na UTC pa konvertiramo na UK lokalno vrijeme
    # (Europe/London, automatski hvata BST) jer "sat u danu" ima smisla samo
    # u lokalnom vremenu regije koju analiziramo (geo=GB).
    idx_utc = df.index.tz_localize("UTC") if df.index.tz is None else df.index.tz_convert("UTC")
    df.index = idx_utc.tz_convert(LOCAL_TZ)
    df.index.name = f"time [{LOCAL_TZ}]"
    df["hour_of_day"] = df.index.hour
    return df


def fit_cosinor(y: np.ndarray, hour_of_day: np.ndarray):
    theta = 2 * np.pi * hour_of_day / PERIOD_HOURS
    X = np.column_stack([np.cos(theta), np.sin(theta)])
    X = sm.add_constant(X)
    model = sm.OLS(y, X).fit()

    M, beta, gamma = model.params
    amplitude = float(np.hypot(beta, gamma))
    acrophase_hour = float((np.arctan2(gamma, beta) % (2 * np.pi)) * PERIOD_HOURS / (2 * np.pi))

    return {
        "model": model,
        "M": float(M),
        "beta": float(beta),
        "gamma": float(gamma),
        "amplitude": amplitude,
        "acrophase_hour": acrophase_hour,
        "F": float(model.fvalue),
        "df_model": int(model.df_model),
        "df_resid": int(model.df_resid),
        "p_value": float(model.f_pvalue),
        "n": int(model.nobs),
        "residuals": model.resid,
        "fitted": model.fittedvalues,
    }


def plot_cosinor(df: pd.DataFrame, keyword: str, fit: dict) -> Path:
    hours_grid = np.linspace(0, 24, 200)
    theta_grid = 2 * np.pi * hours_grid / PERIOD_HOURS
    curve = fit["M"] + fit["beta"] * np.cos(theta_grid) + fit["gamma"] * np.sin(theta_grid)

    hourly_stats = df.groupby("hour_of_day")[keyword].agg(["mean", "std"])

    fig, ax = plt.subplots(figsize=(9, 5))
    rng = np.random.default_rng(0)
    jitter = rng.uniform(-0.15, 0.15, size=len(df))
    ax.scatter(df["hour_of_day"] + jitter, df[keyword], s=8, alpha=0.25, color="steelblue", label="satne tocke (sve pooled)")
    ax.errorbar(
        hourly_stats.index, hourly_stats["mean"], yerr=hourly_stats["std"],
        fmt="o", color="navy", capsize=3, markersize=4, label="prosjek +- SD po satu",
    )
    ax.plot(hours_grid, curve, color="crimson", linewidth=2, label="kosinor fit")
    ax.axvline(fit["acrophase_hour"], color="crimson", linestyle="--", linewidth=1, alpha=0.7)

    sig = "p < 0.001" if fit["p_value"] < 0.001 else f"p = {fit['p_value']:.4f}"
    ax.set_title(
        f"Kosinor model - '{keyword}' (UK lokalno vrijeme)\n"
        f"M={fit['M']:.2f}  A={fit['amplitude']:.2f}  akrofaza={fit['acrophase_hour']:.1f}h  "
        f"F({fit['df_model']},{fit['df_resid']})={fit['F']:.2f}  {sig}  N={fit['n']}"
    )
    ax.set_xlabel("Sat dana (UK lokalno vrijeme, 0-23)")
    ax.set_ylabel("RSV")
    ax.set_xticks(range(0, 25, 2))
    ax.set_xlim(-0.5, 23.5)
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()

    out_path = OUTPUT_DIR / f"cosinor_{keyword}.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log.info("Spremljeno: %s", out_path)
    return out_path


def plot_hourly_overlay(df: pd.DataFrame) -> Path:
    profiles = df.groupby("hour_of_day")[KEYWORDS].mean()
    fig, ax = plt.subplots(figsize=(9, 5))
    for kw, color in zip(KEYWORDS, ["steelblue", "crimson"]):
        ax.plot(profiles.index, profiles[kw], marker="o", markersize=4, color=color, label=kw)
    ax.set_xlabel("Sat dana (UK lokalno vrijeme, 0-23)")
    ax.set_ylabel("Prosjecni RSV")
    ax.set_title("Prosjecni dnevni profil po satu - insomnia vs suicide (UK)\n(iz istog zajednickog poziva, skala je uporediva)")
    ax.set_xticks(range(0, 25, 2))
    ax.legend()
    fig.tight_layout()
    out_path = OUTPUT_DIR / "hourly_profiles_overlay.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log.info("Spremljeno: %s", out_path)
    return out_path


def plot_residual_scatter(resid_x: np.ndarray, resid_y: np.ndarray, r: float, p: float) -> Path:
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(resid_x, resid_y, s=10, alpha=0.35, color="darkorange")
    if len(resid_x) > 1:
        slope, intercept = np.polyfit(resid_x, resid_y, 1)
        xs = np.linspace(resid_x.min(), resid_x.max(), 50)
        ax.plot(xs, slope * xs + intercept, color="black", linewidth=1)
    ax.axhline(0, color="gray", linewidth=0.5)
    ax.axvline(0, color="gray", linewidth=0.5)
    ax.set_xlabel("insomnia rezidual (nakon kosinor fita)")
    ax.set_ylabel("suicide rezidual (nakon kosinor fita)")
    ax.set_title(f"Rezidualna korelacija (izvan 24h ritma): r={r:.4f}, p={p:.4f}")
    fig.tight_layout()
    out_path = OUTPUT_DIR / "residual_scatter.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log.info("Spremljeno: %s", out_path)
    return out_path


def association_tests(df: pd.DataFrame, fits: dict) -> pd.DataFrame:
    x_raw = df[KEYWORDS[0]].to_numpy(dtype=float)
    y_raw = df[KEYWORDS[1]].to_numpy(dtype=float)
    r_raw, p_raw = stats.pearsonr(x_raw, y_raw)

    resid_x = np.asarray(fits[KEYWORDS[0]]["residuals"])
    resid_y = np.asarray(fits[KEYWORDS[1]]["residuals"])
    r_resid, p_resid = stats.pearsonr(resid_x, resid_y)

    profiles = df.groupby("hour_of_day")[KEYWORDS].mean()
    r_profile, p_profile = stats.pearsonr(profiles[KEYWORDS[0]], profiles[KEYWORDS[1]])

    rows = [
        {
            "test": "sirova_korelacija_satnih_tocaka",
            "opis": "Pearson r na svim uparenim satnim tockama (naivno, ukljucuje zajednicki 24h oblik)",
            "r": r_raw, "p_value": p_raw, "n": len(x_raw),
        },
        {
            "test": "korelacija_rezidua_nakon_kosinor_fita",
            "opis": "Pearson r na rezidualima nakon sto je svakoj seriji oduzet njezin vlastiti kosinor fit",
            "r": r_resid, "p_value": p_resid, "n": len(resid_x),
        },
        {
            "test": "korelacija_prosjecnih_profila_po_satu",
            "opis": "Pearson r izmedu 24 uparene tocke (mean RSV po satu dana, pooled)",
            "r": r_profile, "p_value": p_profile, "n": len(profiles),
        },
    ]
    result_df = pd.DataFrame(rows)
    plot_residual_scatter(resid_x, resid_y, r_resid, p_resid)
    return result_df


def write_summary(df: pd.DataFrame, fits: dict, assoc_df: pd.DataFrame) -> None:
    lines = [WARNING_BANNER, ""]
    lines.append("# Dnevna (24h) komponenta: insomnia / suicide (UK, Google Trends, kosinor model)")
    lines.append("")
    lines.append("## Podaci")
    lines.append(f"- Raspon (lokalno UK vrijeme): {df.index.min()} - {df.index.max()}")
    lines.append(f"- Broj satnih tocaka nakon ciscenja: {len(df)}")
    lines.append("- Vremenska zona satnih oznaka: Europe/London (konvertirano iz UTC-a koji vraca Google Trends)")
    lines.append("")
    lines.append("## Kosinor model po pojmu (period = 24h)")
    lines.append("| pojam | M (mesor) | A (amplituda) | akrofaza (sat, UK lokalno) | F | df | p-vrijednost | N |")
    lines.append("|---|---:|---:|---:|---:|---|---:|---:|")
    for kw in KEYWORDS:
        f = fits[kw]
        lines.append(
            f"| {kw} | {f['M']:.3f} | {f['amplitude']:.3f} | {f['acrophase_hour']:.2f} | {f['F']:.3f} | "
            f"({f['df_model']},{f['df_resid']}) | {f['p_value']:.5f} | {f['n']} |"
        )
    lines.append("")
    lines.append(
        "Napomena: p-vrijednost je 'zero-amplitude' F-test (H0: nema 24h ritma, tj. beta=gamma=0). "
        "Amplituda i akrofaza su opisne tocke procjene bez izracunatog intervala pouzdanosti u ovom alatu."
    )
    lines.append("")
    lines.append("## Testovi povezanosti dnevnog obrasca (insomnia <-> suicide)")
    lines.append("| test | r | p-vrijednost | N | opis |")
    lines.append("|---|---:|---:|---:|---|")
    for _, row in assoc_df.iterrows():
        lines.append(f"| {row['test']} | {row['r']:.4f} | {row['p_value']:.5f} | {row['n']} | {row['opis']} |")
    lines.append("")
    delta_acro = fits[KEYWORDS[1]]["acrophase_hour"] - fits[KEYWORDS[0]]["acrophase_hour"]
    delta_acro = (delta_acro + 12) % 24 - 12  # najkraca razlika u [-12, 12]
    lines.append(
        f"- Razlika akrofaza (suicide - insomnia), najkraci put po 24h krugu: {delta_acro:+.2f}h"
    )
    lines.append("")
    lines.append("## Datoteke")
    lines.append("- `cosinor_insomnia.png`, `cosinor_suicide.png` - kosinor fit po pojmu")
    lines.append("- `hourly_profiles_overlay.png` - preklop prosjecnih dnevnih profila")
    lines.append("- `residual_scatter.png` - rezidualna korelacija (izvan 24h ritma)")
    lines.append("- `cosinor_results.csv`, `hourly_association.csv` - numericki rezultati")

    out_path = OUTPUT_DIR / "summary_hourly.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    log.info("Spremljeno: %s", out_path)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_hourly()

    fits = {}
    for kw in KEYWORDS:
        fit = fit_cosinor(df[kw].to_numpy(dtype=float), df["hour_of_day"].to_numpy(dtype=float))
        fits[kw] = fit
        plot_cosinor(df, kw, fit)
        log.info(
            "%s: M=%.2f A=%.2f akrofaza=%.1fh F(%d,%d)=%.2f p=%.5f N=%d",
            kw, fit["M"], fit["amplitude"], fit["acrophase_hour"],
            fit["df_model"], fit["df_resid"], fit["F"], fit["p_value"], fit["n"],
        )

    cosinor_rows = [
        {
            "pojam": kw, "M": f["M"], "beta": f["beta"], "gamma": f["gamma"],
            "amplituda": f["amplitude"], "akrofaza_sat_UK_lokalno": f["acrophase_hour"],
            "F": f["F"], "df_model": f["df_model"], "df_resid": f["df_resid"],
            "p_value": f["p_value"], "n": f["n"],
        }
        for kw, f in fits.items()
    ]
    pd.DataFrame(cosinor_rows).to_csv(OUTPUT_DIR / "cosinor_results.csv", index=False)

    plot_hourly_overlay(df)

    assoc_df = association_tests(df, fits)
    assoc_df.to_csv(OUTPUT_DIR / "hourly_association.csv", index=False)

    write_summary(df, fits, assoc_df)
    log.info("Gotovo. Svi outputi u %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()
