# Titanic Survival Dashboard — Components & API Spec

전제: 원본 데이터는 `backend/data/titanic.csv` (표준 Kaggle 컬럼: PassengerId, Survived, Pclass, Name, Sex, Age, SibSp, Parch, Ticket, Fare, Cabin, Embarked)

SHAP 관련 값은 **사전 계산 후 JSON 파일로 저장**해서 백엔드가 그대로 읽어 서빙한다 (실시간 모델 추론 없음).
지도는 **Leaflet + OpenStreetMap** 타일 사용 (API 키 불필요).

---

## 0. 공통 — Global Filter

모든 통계 API는 아래 쿼리 파라미터를 공통으로 지원 (옵션, 없으면 전체 데이터 기준).

| 파라미터 | 값 | 설명 |
|---|---|---|
| `sex` | male / female | 성별 필터 |
| `pclass` | 1 / 2 / 3 | 객실 등급 필터 |
| `age_min`, `age_max` | 정수 | 나이 범위 필터 |
| `embarked` | S / C / Q | 출발항 필터 |

---

## 1. KPI 카드

**컴포넌트**: `KpiCards`
**API**: `GET /api/summary`

```json
{
  "total_passengers": 891,
  "survival_rate": 0.384
}
```

- 디자인: 카드 2개, 큰 숫자 + 작은 라벨. survival_rate는 `38.4%`로 포맷.

---

## 2. 성별 생존율 (도넛 차트)

**컴포넌트**: `GenderSurvivalDonut`
**API**: `GET /api/survival-by-sex`

```json
{
  "female": { "survived_rate": 0.74, "died_rate": 0.26, "count": 314 },
  "male": { "survived_rate": 0.19, "died_rate": 0.81, "count": 577 }
}
```

- 디자인: 도넛 차트 중앙에 사람 아이콘, 좌측 라벨 "Female 74% Survived / 26% Died" (초록 텍스트), 우측 "Male 19% Survived / 81% Died" (파랑 텍스트). 도넛 자체는 male(파랑)/female(회색 or 핑크) 비율.

---

## 3. 객실등급별 생존율 (바 차트)

**컴포넌트**: `ClassSurvivalBar`
**API**: `GET /api/survival-by-class`

```json
{
  "1": { "survived_rate": 0.63, "death_rate": 0.37, "count": 216 },
  "2": { "survived_rate": 0.47, "death_rate": 0.53, "count": 184 },
  "3": { "survived_rate": 0.24, "death_rate": 0.76, "count": 491 }
}
```

- 디자인: 등급별 2-bar (Survived 파랑 / Death 회색), Y축 0~100%, 막대 위 퍼센트 라벨.

---

## 4. 연령대별 생존 히스토그램

**컴포넌트**: `AgeSurvivalHistogram`
**API**: `GET /api/survival-by-age?bin_size=10`

- Age를 `bin_size`(기본 10) 단위로 binning, 구간: 0-10, 11-20, 21-30, ... 70+
- 결측 Age는 집계에서 제외

```json
{
  "bins": ["0-10","11-20","21-30","31-40","41-50","51-60","61-70","70+"],
  "survived": [38, 18, 60, 35, 20, 10, 5, 2],
  "died": [14, 30, 105, 55, 30, 15, 8, 3]
}
```

- 디자인: stacked 또는 grouped bar (Survived 파랑 / Died 회색), 툴팁에 "20-30 Age distribution peak 20-30" 같은 하이라이트 텍스트 표시(선택).

---

## 5. 연령대별 생존율 — 등급별 (히스토그램, 등급 토글)

**컴포넌트**: `AgeSurvivalByClassHistogram`
**API**: `GET /api/survival-by-age-class`

```json
{
  "1": { "survived_rate": 0.625, "death_rate": 0.375 },
  "2": { "survived_rate": 0.606, "death_rate": 0.394 },
  "3": { "survived_rate": 0.353, "death_rate": 0.647 }
}
```

- 디자인: 이미지 하단 차트처럼 등급별 1개 막대씩(%Survival 0~100), 막대 위 퍼센트 라벨.
- 참고: 이미지상 수치(87.2/45.3, 60.6/33.0, 85.3/11.8)는 예시이며 실제 값은 CSV에서 재계산.

---

## 6. 출발항 지도 (Leaflet)

**컴포넌트**: `EmbarkedPortMap`
**API**: `GET /api/embarked-summary`

```json
{
  "S": { "name": "Southampton", "lat": 50.9097, "lng": -1.4044, "count": 644, "survival_rate": 0.337 },
  "C": { "name": "Cherbourg", "lat": 49.6450, "lng": -1.6160, "count": 168, "survival_rate": 0.554 },
  "Q": { "name": "Queenstown", "lat": 51.8500, "lng": -8.2944, "count": 77, "survival_rate": 0.39 }
}
```

- 위경도는 고정 상수(프론트 또는 백엔드에 하드코딩) — 출발항 3곳뿐이라 별도 geocoding API 불필요.
- 디자인: Leaflet 지도 + CircleMarker 3개 (반지름은 count에 비례), 마커 클릭/호버 시 항구명 + 인원 + 생존율 팝업. 타이타닉 항로(S→C→Q→대서양) 표시는 Polyline으로 좌표 순서대로 연결(옵션).
- 타일 레이어: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (무료, 키 불필요)

---

## 7. SHAP Summary Plot (사전 계산 JSON)

**컴포넌트**: `ShapSummaryPlot`
**파일**: `backend/data/shap_summary.json` (또는 `frontend/public/data/`에 정적 배치도 가능)
**API**: `GET /api/shap/summary` (백엔드가 JSON 파일을 그대로 읽어 반환)

```json
{
  "features": ["Sex_male", "Pclass", "Age", "Fare", "Parch", "SibSp", "Embarked_C"],
  "points": [
    { "feature": "Sex_male", "shap_value": 0.82, "feature_value": 1 },
    { "feature": "Sex_male", "shap_value": -0.65, "feature_value": 0 }
  ]
}
```

- `points`는 각 승객(샘플) x 피처 조합의 SHAP 값 배열. 프론트는 feature별로 그룹화해서 beeswarm/dot plot 렌더링.
- `feature_value`는 색상 인코딩용 (Low~High, 보통 0~1 정규화된 원본 피처값).
- 어떻게 생성할지: 별도로 Python(`shap` 라이브러리)으로 모델 학습 후 위 JSON 구조로 export 필요 — 이 파일 생성 스크립트는 별도 요청 시 작성 가능.

---

## 8. Feature Importance (바 차트)

**컴포넌트**: `FeatureImportanceBar`
**API**: `GET /api/shap/feature-importance` (사전 계산 JSON 서빙)

```json
{
  "features": ["Sex_male", "Pclass", "Age", "Fare", "Parch", "SibSp", "Embarked_C"],
  "importance": [12.5, 8.1, 6.4, 5.9, 2.1, 1.8, 0.9]
}
```

- 정렬: importance 내림차순. 디자인: 가로/세로 바 차트, 이미지 기준 세로 바.

---

## 9. Individual Prediction (개별 승객 예측 + Force Plot)

**컴포넌트**: `IndividualPrediction`
**API**: `GET /api/shap/passenger/{passenger_id}` (사전 계산 JSON에서 lookup)

```json
{
  "passenger_id": 711,
  "age": 32,
  "sex": "male",
  "pclass": 3,
  "predicted_survival_rate": 0.22,
  "predicted_label": "Died",
  "base_value": 0.38,
  "shap_contributions": [
    { "feature": "Age", "value": -0.03 },
    { "feature": "Pclass", "value": -0.08 },
    { "feature": "Sex_male", "value": -0.05 },
    { "feature": "Fare", "value": 0.01 }
  ]
}
```

- 입력: 드롭다운 또는 검색창으로 PassengerId 선택 (전체 891명 사전 계산 JSON에 포함되어 있어야 함).
- 디자인: 좌측에 승객 정보 텍스트 카드, 우측에 force plot (base_value에서 시작해 각 feature가 +/- 방향으로 미는 막대형 시각화).

---

## 작업 순서 제안 (Cursor에 줄 때)

1. `GET /api/summary`, `/api/survival-by-sex`, `/api/survival-by-class` — 가장 단순한 것부터 백엔드 라우터 작성
2. `/api/survival-by-age`, `/api/survival-by-age-class` — binning 로직
3. `/api/embarked-summary` + Leaflet 지도 프론트 컴포넌트
4. SHAP 사전 계산 스크립트 작성 (모델 학습 + JSON export) → `/api/shap/*` 라우터는 파일 읽기만 하면 되므로 단순
5. 프론트: 좌측 → 중앙 → 우측 순서로 컴포넌트 하나씩 연결
