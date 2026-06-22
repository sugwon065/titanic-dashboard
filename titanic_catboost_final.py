# ╔══════════════════════════════════════════════════════════════╗
# ║     Titanic CatBoost + Optuna + SHAP (Google Colab용)       ║
# ╚══════════════════════════════════════════════════════════════╝

# ── Cell 1. 설치 ──────────────────────────────────────────────
!pip install -q catboost shap optuna


# ── Cell 2. 라이브러리 ────────────────────────────────────────
import pandas as pd
import numpy as np
import json, os, warnings
warnings.filterwarnings("ignore")

from catboost import CatBoostClassifier, Pool
import shap
import optuna
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import accuracy_score, roc_auc_score
from google.colab import files

optuna.logging.set_verbosity(optuna.logging.WARNING)


# ── Cell 3. 파일 업로드 ───────────────────────────────────────
uploaded = files.upload()   # titanic.csv 선택
df_raw = pd.read_csv("titanic.csv")
print(df_raw.shape)
df_raw.head(3)


# ── Cell 4. 전처리 ────────────────────────────────────────────
def preprocess(df):
    df = df.copy()

    # 호칭 추출 (희귀 → "Rare" 통합)
    df["Title"] = df["Name"].str.extract(r", ([A-Za-z]+)\.")
    rare = ["Dr","Rev","Major","Col","Mlle","Lady",
            "Capt","Don","Jonkheer","Mme","Ms","Sir"]
    df["Title"] = df["Title"].replace(rare, "Rare")

    # 가족 크기
    df["FamilySize"] = df["SibSp"] + df["Parch"] + 1

    # 결측 보완
    df["Age"]      = df.groupby("Title")["Age"].transform(lambda x: x.fillna(x.median()))
    df["Fare"]     = df["Fare"].fillna(df["Fare"].median())
    df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

    # 범주형 NaN → "Unknown" (CatBoost는 NaN 범주형 불허)
    for col in ["Sex", "Embarked", "Title"]:
        df[col] = df[col].astype(str).replace("nan", "Unknown")

    return df

df = preprocess(df_raw)

FEATURES     = ["Pclass", "Sex", "Age", "Fare", "Embarked",
                "FamilySize", "Title"]
CAT_FEATURES = ["Sex", "Embarked", "Title"]
TARGET       = "Survived"

train_df = df[df[TARGET].notna()].copy()
X = train_df[FEATURES]
y = train_df[TARGET].astype(int)

# Train / Test split (80:20, stratify)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape}   Test: {X_test.shape}")


# ── Cell 5. 베이지안 하이퍼파라미터 튜닝 ─────────────────────
def objective(trial):
    params = {
        "iterations"         : trial.suggest_int("iterations", 200, 800),
        "learning_rate"      : trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "depth"              : trial.suggest_int("depth", 4, 10),
        "l2_leaf_reg"        : trial.suggest_float("l2_leaf_reg", 1e-3, 10.0, log=True),
        "bagging_temperature": trial.suggest_float("bagging_temperature", 0.0, 1.0),
        "random_strength"    : trial.suggest_float("random_strength", 1e-3, 10.0, log=True),
        "border_count"       : trial.suggest_int("border_count", 32, 255),
        "eval_metric"        : "AUC",
        "random_seed"        : 42,
        "verbose"            : 0,
        "early_stopping_rounds": 50,
    }

    skf    = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = []

    for tr_idx, val_idx in skf.split(X_train, y_train):
        X_tr,  X_val  = X_train.iloc[tr_idx],  X_train.iloc[val_idx]
        y_tr,  y_val  = y_train.iloc[tr_idx],  y_train.iloc[val_idx]

        tr_pool  = Pool(X_tr,  y_tr,  cat_features=CAT_FEATURES)
        val_pool = Pool(X_val, y_val, cat_features=CAT_FEATURES)

        m = CatBoostClassifier(**params)
        m.fit(tr_pool, eval_set=val_pool, use_best_model=True)

        prob = m.predict_proba(val_pool)[:, 1]
        scores.append(roc_auc_score(y_val, prob))

    return np.mean(scores)

study = optuna.create_study(
    direction = "maximize",
    sampler   = optuna.samplers.TPESampler(seed=42),
    pruner    = optuna.pruners.MedianPruner(n_warmup_steps=5),
)
study.optimize(objective, n_trials=50, show_progress_bar=True)

print(f"\n최적 CV AUC : {study.best_value:.4f}")
print(f"최적 파라미터:\n{study.best_params}")


# ── Cell 6. 최적 파라미터로 최종 학습 ────────────────────────
best_params = study.best_params | {
    "eval_metric"          : "AUC",
    "random_seed"          : 42,
    "verbose"              : 100,
    "early_stopping_rounds": 50,
}

train_pool = Pool(X_train, y_train, cat_features=CAT_FEATURES)
test_pool  = Pool(X_test,  y_test,  cat_features=CAT_FEATURES)

model = CatBoostClassifier(**best_params)
model.fit(train_pool, eval_set=test_pool, use_best_model=True)
print(f"\nBest iteration: {model.best_iteration_}")


# ── Cell 7. 성능 확인 (Test 기준) ────────────────────────────
probs = model.predict_proba(test_pool)[:, 1]
preds = (probs >= 0.5).astype(int)
print(f"Accuracy : {accuracy_score(y_test, preds):.4f}")
print(f"ROC-AUC  : {roc_auc_score(y_test, probs):.4f}")


# ── Cell 8. SHAP 계산 ─────────────────────────────────────────
explainer   = shap.TreeExplainer(model)
shap_values = explainer.shap_values(Pool(X_train, cat_features=CAT_FEATURES))
base_value  = float(explainer.expected_value)
print("SHAP 완료. shape:", shap_values.shape)


# ── Cell 9. SHAP 시각화 ───────────────────────────────────────
# (1) Summary plot — beeswarm
shap.summary_plot(shap_values, X_train, feature_names=FEATURES)

# (2) Feature importance — bar
shap.summary_plot(shap_values, X_train, feature_names=FEATURES, plot_type="bar")

# (3) 개별 승객 force plot (0번 인덱스 예시)
shap.initjs()
shap.force_plot(base_value, shap_values[0], X_train.iloc[0], feature_names=FEATURES)

# (4) 튜닝 결과 시각화
import matplotlib.pyplot as plt
optuna.visualization.matplotlib.plot_optimization_history(study)
plt.tight_layout(); plt.show()

optuna.visualization.matplotlib.plot_param_importances(study)
plt.tight_layout(); plt.show()


# ── Cell 10. JSON 저장 & 다운로드 ────────────────────────────
os.makedirs("backend/data", exist_ok=True)

# 전체 데이터 SHAP (JSON용)
all_pool    = Pool(X, cat_features=CAT_FEATURES)
all_shap    = explainer.shap_values(all_pool)
all_probs   = model.predict_proba(all_pool)[:, 1]

# ① shap_summary.json
points = []
for i, feat in enumerate(FEATURES):
    col = X[feat].astype(str) if feat in CAT_FEATURES else X[feat]
    for idx in range(len(X)):
        points.append({
            "feature"      : feat,
            "shap_value"   : round(float(all_shap[idx, i]), 6),
            "feature_value": col.iloc[idx],
            "passenger_id" : int(train_df["PassengerId"].iloc[idx]),
        })
with open("backend/data/shap_summary.json", "w") as f:
    json.dump({"features": FEATURES, "points": points}, f, ensure_ascii=False)

# ② feature_importance.json
mean_abs = np.abs(all_shap).mean(axis=0)
importance = sorted(
    [{"feature": feat, "importance": round(float(v), 6)}
     for feat, v in zip(FEATURES, mean_abs)],
    key=lambda x: x["importance"], reverse=True
)
with open("backend/data/feature_importance.json", "w") as f:
    json.dump({"features": importance}, f, ensure_ascii=False)

# ③ passenger_predictions.json
passengers = []
for idx in range(len(X)):
    row = train_df.iloc[idx]
    sv  = all_shap[idx].tolist()
    passengers.append({
        "passenger_id"   : int(row["PassengerId"]),
        "name"           : row["Name"],
        "survived_actual": int(row[TARGET]),
        "survived_pred"  : int(all_probs[idx] >= 0.5),
        "prob_survive"   : round(float(all_probs[idx]), 4),
        "base_value"     : round(base_value, 6),
        "features"       : {feat: (str(X[feat].iloc[idx]) if feat in CAT_FEATURES
                                   else round(float(X[feat].iloc[idx]), 4))
                            for feat in FEATURES},
        "shap_values"    : {feat: round(float(sv[i]), 6)
                            for i, feat in enumerate(FEATURES)},
    })
with open("backend/data/passenger_predictions.json", "w") as f:
    json.dump({"base_value": round(base_value, 6),
               "passengers": passengers}, f, ensure_ascii=False)

print("JSON 3개 저장 완료!")
files.download("backend/data/shap_summary.json")
files.download("backend/data/feature_importance.json")
files.download("backend/data/passenger_predictions.json")
