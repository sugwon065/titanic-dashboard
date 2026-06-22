"""Attach waterfall blocks to passenger_predictions.json for frontend rendering.

Run from backend folder:
    py scripts/attach_waterfall.py

Expected input per passenger (already in file):
    base_value, shap_values

Optional pre-exported waterfall (used as-is if present):
    "waterfall": {
        "base_value": -0.339,
        "output_value": 1.707,
        "steps": [
            {"feature": "Sex", "value": 0.72, "start": -0.339, "end": 0.381}
        ]
    }
"""

import json
from pathlib import Path


def build_waterfall(passenger: dict) -> dict:
    existing = passenger.get("waterfall")
    if isinstance(existing, dict) and existing.get("steps"):
        return existing

    base = float(passenger["base_value"])
    cursor = base
    steps = []

    for feature, value in sorted(
        passenger["shap_values"].items(),
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


def main() -> None:
    path = Path(__file__).resolve().parent.parent / "data" / "passenger_predictions.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    passengers = data["passengers"]

    for passenger in passengers:
        passenger["waterfall"] = build_waterfall(passenger)

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated waterfall for {len(passengers)} passengers -> {path}")


if __name__ == "__main__":
    main()
