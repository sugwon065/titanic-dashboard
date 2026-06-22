# Titanic Dashboard — Visual Spec (이미지 기반 상세 레이어 정보)

이미지를 직접 픽셀 단위로 분석해서 뽑은 색상/타이포/배치 정보. Cursor에게 "최대한 비슷하게" 요청할 때 이 문서를 그대로 첨부.

---

## 1. 컬러 팔레트 (실측값)

| 용도 | HEX | RGB |
|---|---|---|
| 페이지 배경 (가장 어두운 네이비) | `#041222` | rgb(4, 19, 34) |
| 카드 배경 (기본) | `#142230` | rgb(20, 34, 48) |
| 카드 배경 (약간 밝은 버전, KPI 등) | `#17212e` | rgb(23, 33, 46) |
| Primary Blue (Survived, 강조, 버튼) | `#1d94f2` | rgb(29, 148, 242) |
| Secondary Grey (Died/Death 막대) | `#9aa5b1` | rgb(154, 165, 177) — 막대 자체는 밝은 회색, 배경과 구분되는 중간톤 |
| 텍스트 - 흰색 (제목, 숫자) | `#ffffff` | |
| 텍스트 - 회색 (라벨, 서브텍스트) | `#aab4c0` | rgb(170, 180, 190) |
| Female 강조 텍스트 | `#9aa5b1` (회색 계열) | |
| Male 강조 텍스트 / 초록 포인트 | `#2ecc71` 계열 (생존율 옆 작은 초록 마커) | |
| SHAP Low (파랑~보라) | `#3b4cca` ~ `#5b6fd8` | |
| SHAP High (핑크~마젠타) | `#e84393` ~ `#ff4d8d` | |
| 위험/사망 강조 텍스트 (Individual Prediction "22% Died") | `#ff5c7a` (빨강 계열) | |
| 지도 배경 (다크 모드 지도 타일) | `#1a1c20` 근처 | rgb(23-30, 24-32, 28-33) |
| 카드 border / divider | `#23303f` 근처 (배경보다 살짝 밝은 라인) | |

> 전체적으로 **딱 2가지 핵심색**만 반복 사용: Primary Blue(`#1d94f2`)와 무채색 Grey. 강조가 필요한 곳(SHAP 영향도, 사망률 텍스트)에만 핑크/레드 포인트 컬러 사용.

---

## 2. 타이포그래피

| 요소 | 스타일 |
|---|---|
| 메인 타이틀 ("TITANIC SURVIVAL PREDICTION DASHBOARD") | bold, all-caps, 흰색, ~16-18px, letter-spacing 살짝 넓음 |
| 카드 섹션 제목 ("SURVIVAL BY GENDER" 등) | bold, all-caps, 흰색, ~11-12px |
| 카드 서브라벨 ("Pie Chart", "Bar Chart" 등) | regular, 회색(`#aab4c0`), ~9-10px, 제목 바로 아래 |
| KPI 숫자 (891, 38.4%) | bold, 흰색, ~24-28px |
| KPI 라벨 (Total Passengers) | regular, 회색, ~10-11px |
| 차트 축/라벨 텍스트 | regular, 회색, ~9-10px |
| 막대 위 퍼센트 라벨 | bold, 흰색, 막대 내부에 배치 |

전반적으로 폰트는 **sans-serif (Inter, Roboto, 또는 system-ui 계열)** 느낌. 전체 톤이 "금융/BI 대시보드"라 폰트 크기는 전반적으로 작고 촘촘함(정보 밀도 높음).

---

## 3. 레이아웃 — 정확한 그리드 비율 (1024px 기준 실측)

```
전체 폭 1024px 기준
├─ 좌측 컬럼:   0 ~ 250px   (약 24%)
├─ 중앙 컬럼: 250 ~ 740px   (약 48%)
└─ 우측 컬럼: 740 ~ 1024px  (약 28%)

세로 (헤더 제외 ~500px 기준)
├─ 헤더:         0 ~ 45px
├─ KPI/섹션헤더:  45 ~ 100px
└─ 본문:        100 ~ 559px
```

### 좌측 컬럼 (250px) 세로 배치
1. KPI 카드 2개 (가로로 절반씩, Total Passengers / Survival Rate) — height ~55px
2. "Demographics Overview" 섹션 라벨 (카드 아님, 텍스트만)
3. "Survival by Gender" 카드 (도넛 차트) — height ~230px, 가장 큰 비중
4. "Survival by Passenger Class" 카드 (바 차트) — height ~160px

### 중앙 컬럼 (490px) 배치
- 상단에 "AGE DISTRIBUTION & EMBARKED LOCATION" 섹션 헤더 (텍스트, 카드 아님)
- 그 아래 **좌/우 2분할**:
  - 좌측 (~240px): 카드 2개 세로 스택
    1. "Survival by Age Range" (히스토그램, 전체 기준) — height ~230px
    2. "Survival by Age Range" (등급별 바차트, "Historical by Age Range" 부제) — height ~230px
  - 우측 (~250px): "Embarked Port & Route" 지도 카드 1개 — height ~460px (좌측 두 카드 합친 높이와 동일)

### 우측 컬럼 (284px) 세로 배치 — "SHAP MODEL EXPLAINER" 섹션 헤더 아래
1. "SHAP Summary Plot" 카드 (dot/beeswarm plot) — height ~210px
2. "Feature Importance" 카드 (세로 바차트) — height ~120px
3. "Individual Prediction" 카드 (텍스트 + force plot) — height ~150px

---

## 4. 카드 공통 스타일

- 배경색: `#142230`
- border-radius: `6~8px`
- border: 1px solid 약간 밝은 톤 (`#23303f`) — 은은하게, 거의 안 보일 정도
- padding: `12px`
- 카드 사이 gap: `8~10px`
- 카드 우측 상단에 `⋮` (3-dot 메뉴) 아이콘 — 작은 회색, 기능 없어도 됨 (장식용)
- 섹션 헤더("AGE DISTRIBUTION & EMBARKED LOCATION", "SHAP MODEL EXPLAINER")는 카드가 아니라 **구역을 묶는 라벨**: 약간 더 큰 카드 배경(`#17212e`) 안에 여러 카드를 품는 wrapper 형태

---

## 5. 컴포넌트별 디테일

### KPI 카드
- 큰 흰색 숫자 + 작은 회색 라벨, 좌측 정렬
- 카드 2개가 같은 행에 나란히, 동일 너비

### Survival by Gender (도넛)
- 중앙 도넛: 파랑(`#1d94f2`) + 회색 두 톤으로 male/female survived 비율 표현
- 도넛 중앙에 사람 실루엣 아이콘 2개 (남/여, 흰색 라인 아이콘)
- 좌측: "Female 74% Survived / 26% Died" — 회색 텍스트, 우측 정렬
- 우측: "Male 19% Survived / 81% Died" — 흰색/파랑 텍스트, 좌측 정렬
- Male 라벨이 우측에 2번 보이는 건 도넛 위/아래 양쪽에 호버 또는 분할 라벨로 보이는 디자인 (단순화해서 1번만 표시해도 무방)

### Survival by Passenger Class (바차트)
- 등급별(1st/2nd/3rd) 2개 막대(Survived 파랑 / Death 회색)
- Y축 0~80% (또는 자동 스케일), 막대 위 % 라벨

### Survival by Age Range (히스토그램, 상단)
- X축: 0-10, 11-20, ..., 70+ (10세 단위)
- Stacked 또는 grouped bar (Survived 파랑 / Died 회색)
- 특정 막대(20-30)에 호버형 다크 툴팁 박스: "20-30 / Age distribution peak 20-30" — 이건 정적 annotation으로 구현해도 되고, 실제 hover tooltip으로 구현해도 됨

### Survival by Age Range (등급별, 하단)
- X축: 1st Class / 2nd Class / 3rd Class
- Y축: % Survival, 0~100%
- 막대 위 survived%/death% 두 숫자 라벨

### Embarked Port & Route (지도)
- 다크 테마 지도 (CartoDB Dark Matter 타일 또는 유사 스타일)
- 원형 마커 3개, 크기는 승객 수(count)에 비례
- 마커 색: Southampton(파랑 큰 원), Cherbourg(파랑 중간 원), Queenstown(초록 작은 원) — 색 구분은 항구 식별용
- 각 마커 옆 다크 라벨 박스: 항구명 + "S: 644" 형태 인원수 + 아래 초록 텍스트로 생존율 "33.7%"
- 마커 사이 곡선 화살표(주황색 점선/실선)로 항로 표시: Southampton → Cherbourg → Queenstown → (대서양 방향 직선, "Titanic" 라벨)
- 우측 하단 작은 "mapbox" 워터마크 텍스트 (Leaflet+OSM 쓰면 OpenStreetMap 어트리뷰션으로 자연 대체됨)

### SHAP Summary Plot
- Y축: feature명 7개 (Sex_male, Pclass, Age, Fare, Parch, SibSp, Embarked_C), importance 순 정렬
- X축: SHAP value, -1.0 ~ 1.0
- 각 행에 점들이 가로로 흩뿌려진 beeswarm 형태, 점 색은 feature value에 따라 파랑(Low)~핑크(High) 그라디언트
- 우측에 세로 컬러바: 위 "High"(핑크) ~ 아래 "Low"(파랑)
- 중앙에 x=0 기준 세로 점선

### Feature Importance
- 세로 바차트, 7개 feature를 importance 내림차순 정렬
- 막대 색: 단일 파랑(`#1d94f2`)
- Y축 라벨: "Average Absolute SHAP Value"

### Individual Prediction
- 좌측 텍스트 블록: "Passenger ID: 711 / Age: 32, Male / Class: 3 / S" + "Predicted Survival: 22% (Died)" — Died 텍스트는 빨강(`#ff5c7a`) 강조
- 우측: Force Plot — 가로 막대형, base value에서 시작해 feature별로 핑크(음의 기여, 생존확률 낮춤)/파랑(양의 기여) 화살표가 누적되는 형태, X축 -5~10 스케일
- Force plot 아래 feature명 리스트(Age, Pclass, Sex_male, Fare)가 작은 점으로 매핑

---

## 6. Cursor에 줄 때 프롬프트 예시

```
docs/VISUAL_SPEC.md 를 참고해서 [컴포넌트명]을 만들어줘.
색상은 문서의 컬러 팔레트 표를 정확히 따르고,
카드 스타일(배경 #142230, radius 8px, padding 12px, border #23303f)을 공통 적용해줘.
폰트는 전체적으로 작고 촘촘하게(라벨 9-10px, 제목 11-12px) 배치해줘.
```

레이아웃 구조(그리드 위치)는 기존 `LAYOUT.md`, 데이터/API는 `COMPONENTS.md`, 색상/스타일 디테일은 이 `VISUAL_SPEC.md` — 세 문서를 같이 첨부하면 가장 정확하게 나옵니다.
