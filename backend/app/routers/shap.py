import json
import math
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/shap", tags=["shap"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _sanitize_for_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _sanitize_for_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_sanitize_for_json(item) for item in value]
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=503, detail=f"{filename} not generated yet")
    with path.open(encoding="utf-8") as file:
        return _sanitize_for_json(json.load(file))


@router.get("/summary")
def get_shap_summary():
    return _load_json("shap_summary.json")


@router.get("/feature-importance")
def get_feature_importance():
    return _load_json("feature_importance.json")


def _get_passengers_data():
    data = _load_json("passenger_predictions.json")
    passengers = data.get("passengers", data)

    if isinstance(passengers, list):
        return data.get("base_value"), passengers

    if isinstance(passengers, dict):
        return data.get("base_value"), list(passengers.values())

    raise HTTPException(
        status_code=503, detail="passenger_predictions.json has invalid format"
    )


@router.get("/passengers")
def get_passenger_list():
    base_value, passengers = _get_passengers_data()
    return {
        "base_value": base_value,
        "passengers": [
            {
                "passenger_id": passenger["passenger_id"],
                "name": passenger.get("name", f"Passenger {passenger['passenger_id']}"),
                "prob_survive": passenger.get("prob_survive"),
                "survived_pred": passenger.get("survived_pred"),
            }
            for passenger in passengers
        ],
    }


def _build_waterfall(passenger: dict) -> dict:
    existing = passenger.get("waterfall")
    if isinstance(existing, dict) and existing.get("steps"):
        return existing

    base = float(passenger.get("base_value", 0))
    shap_values = passenger.get("shap_values", {})
    cursor = base
    steps = []

    for feature, value in sorted(
        shap_values.items(),
        key=lambda item: abs(float(item[1])),
        reverse=True,
    ):
        start = cursor
        cursor += float(value)
        steps.append(
            {
                "feature": feature,
                "value": round(float(value), 6),
                "start": round(start, 6),
                "end": round(cursor, 6),
            }
        )

    return {
        "base_value": round(base, 6),
        "output_value": round(cursor, 6),
        "steps": steps,
    }


@router.get("/passenger/{passenger_id}")
def get_passenger_prediction(passenger_id: int):
    _, passengers = _get_passengers_data()

    for passenger in passengers:
        if passenger.get("passenger_id") == passenger_id:
            result = dict(passenger)
            result["waterfall"] = _build_waterfall(passenger)
            return result

    raise HTTPException(status_code=404, detail="Passenger not found")
