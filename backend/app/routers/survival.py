from fastapi import APIRouter, Depends

import pandas as pd
from app.data import get_dataframe
from app.filters import apply_filters, parse_filters

router = APIRouter(prefix="/api", tags=["survival"])

TITLE_ORDER = ["Mr", "Miss", "Mrs", "Master", "Dr", "Rev"]


def _extract_title(name: object) -> str:
    if not isinstance(name, str) or "," not in name:
        return "Other"
    after_comma = name.split(",", 1)[1].strip()
    return after_comma.split(".")[0].strip()


@router.get("/summary")
def get_summary(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    total = len(df)
    survival_rate = float(df["Survived"].mean()) if total else 0.0
    return {
        "total_passengers": total,
        "survival_rate": round(survival_rate, 3),
    }


@router.get("/survival-by-sex")
def get_survival_by_sex(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    result = {}

    for sex_key, sex_value in [("female", "female"), ("male", "male")]:
        subset = df[df["Sex"] == sex_value]
        count = len(subset)
        if count == 0:
            result[sex_key] = {
                "survived_rate": 0.0,
                "died_rate": 0.0,
                "count": 0,
            }
            continue

        survived_rate = float(subset["Survived"].mean())
        result[sex_key] = {
            "survived_rate": round(survived_rate, 2),
            "died_rate": round(1 - survived_rate, 2),
            "count": count,
        }

    return result


@router.get("/survival-by-class")
def get_survival_by_class(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    result = {}

    for pclass in [1, 2, 3]:
        subset = df[df["Pclass"] == pclass]
        count = len(subset)
        if count == 0:
            result[str(pclass)] = {
                "survived_rate": 0.0,
                "death_rate": 0.0,
                "count": 0,
                "survived_count": 0,
                "died_count": 0,
            }
            continue

        survived_count = int(subset["Survived"].sum())
        died_count = count - survived_count
        survived_rate = float(survived_count / count)

        result[str(pclass)] = {
            "survived_rate": round(survived_rate, 3),
            "death_rate": round(1 - survived_rate, 3),
            "count": count,
            "survived_count": survived_count,
            "died_count": died_count,
        }

    return result


@router.get("/survival-by-title")
def get_survival_by_title(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    df = df.copy()
    df["Title"] = df["Name"].map(_extract_title)

    titles = []
    for title in TITLE_ORDER:
        subset = df[df["Title"] == title]
        count = len(subset)
        if count == 0:
            continue

        survived_count = int(subset["Survived"].sum())
        died_count = count - survived_count
        survival_rate = float(survived_count / count)

        titles.append(
            {
                "title": title,
                "count": count,
                "survived_count": survived_count,
                "died_count": died_count,
                "survival_rate": round(survival_rate, 3),
                "death_rate": round(1 - survival_rate, 3),
            }
        )

    return {"titles": titles}
