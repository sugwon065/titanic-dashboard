from typing import Optional

import pandas as pd
from fastapi import Query


def parse_filters(
    sex: Optional[str] = Query(None, description="male or female"),
    pclass: Optional[int] = Query(None, ge=1, le=3),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, ge=0),
    embarked: Optional[str] = Query(None, description="S, C, or Q"),
) -> dict:
    return {
        "sex": sex,
        "pclass": pclass,
        "age_min": age_min,
        "age_max": age_max,
        "embarked": embarked,
    }


def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    filtered = df.copy()

    if filters["sex"] is not None:
        filtered = filtered[filtered["Sex"] == filters["sex"]]

    if filters["pclass"] is not None:
        filtered = filtered[filtered["Pclass"] == filters["pclass"]]

    if filters["age_min"] is not None:
        filtered = filtered[filtered["Age"] >= filters["age_min"]]

    if filters["age_max"] is not None:
        filtered = filtered[filtered["Age"] <= filters["age_max"]]

    if filters["embarked"] is not None:
        filtered = filtered[filtered["Embarked"] == filters["embarked"]]

    return filtered
