# Titanic Survival Dashboard — Layout

## 전체 컨셉
- 다크 테마 (배경 `#0d1b2a` 계열, 카드 배경 `#13263b` 계열, 강조색 블루 `#2e86de` / 핑크 `#e84393`)
- 12-column CSS Grid 기반 반응형 레이아웃
- 데스크탑 기준 4분할 컬럼 구조 (좌측 좁음 - 중앙 2개 - 우측 좁음)

## 와이어프레임

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🚢 TITANIC SURVIVAL PREDICTION DASHBOARD     [Gender][Class][Age][Port] │ ← Header + Global Filter Bar
├───────────────┬─────────────────────────────┬────────────────────────────┤
│ KPI: Total     │ AGE DISTRIBUTION &           │ SHAP MODEL EXPLAINER       │
│ Passengers 891 │ EMBARKED LOCATION             │ (SURVIVAL PREDICTION)      │
│ KPI: Survival  │                               │                            │
│ Rate 38.4%     │ ┌─────────────┬─────────────┐│ SHAP SUMMARY PLOT          │
│                │ │ Survival by  │ Embarked    ││ (Dot/Beeswarm plot)        │
│ Demographics   │ │ Age Range    │ Port & Route ││                            │
│ Overview       │ │ (Histogram)  │ (Leaflet Map)││                            │
│                │ │              │              │├────────────────────────────┤
│ SURVIVAL BY    │ ├─────────────┤              │ FEATURE IMPORTANCE         │
│ GENDER         │ │ Survival by  │              │ (Bar chart)                │
│ (Donut chart)  │ │ Age Range    │              │                            │
│                │ │ (Histogram,  │              │                            │
│                │ │ by class)    │              │                            │
│                │ └─────────────┴─────────────┘│                            │
│ SURVIVAL BY    │                               ├────────────────────────────┤
│ PASSENGER CLASS│                               │ INDIVIDUAL PREDICTION      │
│ (Bar chart)    │                               │ (Passenger lookup +         │
│                │                               │  Force plot)               │
└───────────────┴─────────────────────────────┴────────────────────────────┘
   col-span 3         col-span 6                    col-span 3
```

## Grid 영역 정의

| 영역 | Grid 위치 (12-col 기준) | 비고 |
|---|---|---|
| Header | row 1, col 1-12 | 타이틀 + 글로벌 필터 4개 |
| KPI 카드 2개 | row 2, col 1-3 | Total Passengers / Survival Rate, 세로 스택 |
| Demographics Overview (성별 도넛 + 등급 바차트) | row 3-5, col 1-3 | 카드 2개 세로 스택 |
| Age Distribution 섹션 헤더 | row 2, col 4-9 | |
| Survival by Age Range (히스토그램) | row 3, col 4-9 | |
| Embarked Port & Route (지도) | row 3, col 7-9 (히스토그램 우측 절반 정도와 겹치지 않게 분리 시 col 4-9 내 좌/우 분할) | 실제로는 히스토그램 2개(상/하) + 지도 1개(우측 전체) 배치 — 아래 비고 참고 |
| Survival by Age Range — Class별 히스토그램 | row 4, col 4-6 | |
| SHAP Summary Plot | row 2-3, col 10-12 | |
| Feature Importance | row 4, col 10-12 | |
| Individual Prediction | row 5, col 10-12 | |

**비고 (중앙 영역 상세 배치)**: 이미지 기준으로 중앙 컬럼은 좌측에 히스토그램 2개(생존율 by 연령대, 생존율 by 연령대x등급)가 세로로 쌓이고, 우측에 지도가 두 히스토그램 높이만큼 크게 배치됨. 즉 중앙 영역을 다시 col 4-6 (히스토그램 2개 세로) / col 7-9 (지도 1개, row 3-4 합친 높이)로 나눔.

## 반응형 기준
- Desktop (≥1280px): 위 3컬럼 그리드 그대로
- Tablet (768~1279px): 좌측 패널 → 중앙 위로, 우측(SHAP) 패널은 아래로 떨어짐 (1컬럼 스택)
- Mobile (<768px): 모든 카드 세로 1열 스택, 필터는 드롭다운 아코디언으로 축소

## 공통 카드 스타일
- 카드 radius: 8px, 카드 간 gap: 12px
- 카드 헤더: 제목(흰색, bold) + 우측 상단 `⋮` 메뉴 아이콘(옵션, 기능 없어도 됨)
- 차트 영역 padding: 12px
