import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["model"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@router.get("/model-metrics")
def get_model_metrics():
    path = DATA_DIR / "model_metrics.json"
    if not path.exists():
        raise HTTPException(status_code=503, detail="model_metrics.json not found")

    with path.open(encoding="utf-8") as file:
        data = json.load(file)

    return {
        "accuracy": data["accuracy"],
        "auc_roc": data["auc_roc"],
    }
