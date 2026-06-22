from fastapi import APIRouter, Depends, Query

import pandas as pd
from app.data import get_dataframe
from app.filters import apply_filters, parse_filters

router = APIRouter(prefix="/api", tags=["age"])


def _survival_rates_by_age_bins(
    df: pd.DataFrame, bin_size: int = 5, last_bin_start: int = 60
) -> tuple[list[int], list[float]]:
    df = df[df["Age"].notna()]
    age_starts = list(range(0, last_bin_start, bin_size))
    age_starts.append(last_bin_start)
    rates: list[float] = []

    for start in age_starts:
        if start >= last_bin_start:
            subset = df[df["Age"] >= last_bin_start]
        else:
            subset = df[(df["Age"] >= start) & (df["Age"] < start + bin_size)]

        if len(subset) == 0:
            rates.append(0.0)
        else:
            rates.append(round(float(subset["Survived"].mean()) * 100, 1))

    return age_starts, rates


@router.get("/survival-rate-by-age")
def get_survival_rate_by_age(
    bin_size: int = Query(5, ge=1),
    filters: dict = Depends(parse_filters),
):
    df = apply_filters(get_dataframe(), filters)
    ages, overall = _survival_rates_by_age_bins(df, bin_size)
    _, male = _survival_rates_by_age_bins(df[df["Sex"] == "male"], bin_size)
    _, female = _survival_rates_by_age_bins(df[df["Sex"] == "female"], bin_size)

    return {
        "ages": ages,
        "overall": overall,
        "male": male,
        "female": female,
    }


def _build_age_bins(bin_size: int) -> list[tuple[str, float, float | None]]:
    bins: list[tuple[str, float, float | None]] = []
    lower = 0

    while lower < 70:
        if lower == 0:
            upper = float(bin_size)
            label = f"0-{bin_size}"
        else:
            upper = float(lower + bin_size - 1)
            label = f"{lower}-{int(upper)}"

        bins.append((label, float(lower), upper))
        lower = bin_size + 1 if lower == 0 else lower + bin_size

    bins.append(("70+", 70.0, None))
    return bins


@router.get("/survival-by-age")
def get_survival_by_age(
    bin_size: int = Query(10, ge=1),
    filters: dict = Depends(parse_filters),
):
    df = apply_filters(get_dataframe(), filters)
    df = df[df["Age"].notna()]

    bins = _build_age_bins(bin_size)
    labels: list[str] = []
    survived_counts: list[int] = []
    died_counts: list[int] = []

    for label, lower, upper in bins:
        if upper is None:
            subset = df[df["Age"] >= lower]
        else:
            subset = df[(df["Age"] >= lower) & (df["Age"] <= upper)]

        labels.append(label)
        survived_counts.append(int(subset["Survived"].sum()))
        died_counts.append(int((subset["Survived"] == 0).sum()))

    return {
        "bins": labels,
        "survived": survived_counts,
        "died": died_counts,
    }


@router.get("/survival-by-age-class")
def get_survival_by_age_class(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    result = {}

    for pclass in [1, 2, 3]:
        subset = df[df["Pclass"] == pclass]
        if len(subset) == 0:
            result[str(pclass)] = {
                "survived_rate": 0.0,
                "death_rate": 0.0,
            }
            continue

        survived_rate = float(subset["Survived"].mean())
        result[str(pclass)] = {
            "survived_rate": round(survived_rate, 3),
            "death_rate": round(1 - survived_rate, 3),
        }

    return result
