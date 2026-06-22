from fastapi import APIRouter, Depends

from app.data import get_dataframe
from app.filters import apply_filters, parse_filters

router = APIRouter(prefix="/api", tags=["embarked"])

PORT_INFO = {
    "S": {"name": "Southampton", "lat": 50.9097, "lng": -1.4044},
    "C": {"name": "Cherbourg", "lat": 49.6337, "lng": -1.6221},
    "Q": {"name": "Queenstown", "lat": 51.8490, "lng": -8.2940},
}


@router.get("/embarked-summary")
def get_embarked_summary(filters: dict = Depends(parse_filters)):
    df = apply_filters(get_dataframe(), filters)
    result = {}

    for code, info in PORT_INFO.items():
        subset = df[df["Embarked"] == code]
        count = len(subset)
        survival_rate = float(subset["Survived"].mean()) if count else 0.0

        result[code] = {
            "name": info["name"],
            "lat": info["lat"],
            "lng": info["lng"],
            "count": count,
            "survival_rate": round(survival_rate, 3),
        }

    return result
