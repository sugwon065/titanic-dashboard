from functools import lru_cache
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CSV_PATH = DATA_DIR / "titanic.csv"


@lru_cache(maxsize=1)
def get_dataframe() -> pd.DataFrame:
    return pd.read_csv(CSV_PATH)
