import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data import get_dataframe
from app.routers import age, embarked, model, shap, survival

app = FastAPI(title="Titanic Survival Dashboard API")

default_origins = "http://localhost:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", default_origins).split(",")
    if origin.strip()
]
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(survival.router)
app.include_router(age.router)
app.include_router(embarked.router)
app.include_router(model.router)
app.include_router(shap.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def load_data_on_startup():
    get_dataframe()
