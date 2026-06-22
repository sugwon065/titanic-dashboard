import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

type FeatureValue = number | string | null;

type ShapPoint = {
  feature: string;
  shap_value: number;
  feature_value: FeatureValue;
  passenger_id?: number;
};

type ShapSummaryResponse = {
  features: string[];
  points: ShapPoint[];
};

type PlacedPoint = {
  point: ShapPoint;
  cx: number;
  cy: number;
  color: string;
};

type ColorScale =
  | { kind: "numeric"; min: number; max: number }
  | { kind: "categorical"; ranks: Map<string, number> };

type LegendItem = {
  label: string;
  color: string;
};

const CATEGORICAL_CONFIG: Record<
  string,
  {
    labels: string[];
    display?: Record<string, string>;
    ranks?: Record<string, number>;
    reverse?: boolean;
  }
> = {
  Pclass: {
    labels: ["1", "2", "3"],
    display: { "1": "1st", "2": "2nd", "3": "3rd" },
  },
  Sex: {
    labels: ["male", "female"],
    display: { male: "Male", female: "Female" },
    ranks: { male: 0, female: 1 },
  },
  Embarked: {
    labels: ["C", "Q", "S"],
  },
};

const LEGEND_FEATURES = new Set(["Pclass", "Sex", "Embarked"]);

const LOW_COLOR = { r: 30, g: 136, b: 229 };
const HIGH_COLOR = { r: 216, g: 27, b: 96 };
const DOT_R = 1.15;
const DOT_STEP = DOT_R * 2 + 0.18;
const VERTICAL_SPREAD_RATIO = 0.2;

function lerpColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(LOW_COLOR.r + clamped * (HIGH_COLOR.r - LOW_COLOR.r));
  const g = Math.round(LOW_COLOR.g + clamped * (HIGH_COLOR.g - LOW_COLOR.g));
  const b = Math.round(LOW_COLOR.b + clamped * (HIGH_COLOR.b - LOW_COLOR.b));
  return `rgb(${r},${g},${b})`;
}

function buildColorScale(feature: string, points: ShapPoint[]): ColorScale {
  const config = CATEGORICAL_CONFIG[feature];
  if (config) {
    const ranks = new Map<string, number>();
    if (config.ranks) {
      for (const label of config.labels) {
        ranks.set(label, config.ranks[label] ?? 0.5);
      }
    } else {
      config.labels.forEach((label, index) => {
        const norm =
          config.labels.length === 1 ? 0.5 : index / (config.labels.length - 1);
        ranks.set(label, config.reverse ? 1 - norm : norm);
      });
    }
    return { kind: "categorical", ranks };
  }

  const rawValues = points
    .map((p) => p.feature_value)
    .filter((v): v is number | string => v != null);

  const allNumeric = rawValues.every(
    (v) => typeof v === "number" && Number.isFinite(v),
  );

  if (allNumeric) {
    const nums = rawValues as number[];
    return {
      kind: "numeric",
      min: Math.min(...nums),
      max: Math.max(...nums),
    };
  }

  const categories = [...new Set(rawValues.map(String))].sort();
  const ranks = new Map<string, number>();
  categories.forEach((cat, index) => {
    ranks.set(
      cat,
      categories.length === 1 ? 0.5 : index / (categories.length - 1),
    );
  });

  return { kind: "categorical", ranks };
}

function colorNorm(point: ShapPoint, scale: ColorScale): number {
  const value = point.feature_value;
  if (value == null) return 0.5;

  if (scale.kind === "numeric") {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0.5;
    if (scale.max === scale.min) return 0.5;
    return (value - scale.min) / (scale.max - scale.min);
  }

  return scale.ranks.get(String(value)) ?? 0.5;
}

function getLegendItems(feature: string, scale: ColorScale): LegendItem[] {
  const config = CATEGORICAL_CONFIG[feature];
  if (!config || scale.kind !== "categorical") return [];

  return config.labels.map((label) => ({
    label: config.display?.[label] ?? label,
    color: lerpColor(scale.ranks.get(label) ?? 0.5),
  }));
}

function layoutLegendPositions(items: LegendItem[], startX = 6): number[] {
  let x = startX;
  return items.map((item) => {
    const pos = x;
    const labelWidth = item.label.length * 4.2;
    x += 5 + labelWidth + 8;
    return pos;
  });
}

function collides(
  cx: number,
  cy: number,
  placed: { cx: number; cy: number }[],
): boolean {
  return placed.some(
    (p) => Math.hypot(p.cx - cx, p.cy - cy) < DOT_STEP - 0.05,
  );
}

function beeswarmY(
  cx: number,
  placed: { cx: number; cy: number }[],
  yCenter: number,
  yMax: number,
): number {
  if (!collides(cx, yCenter, placed)) return yCenter;

  for (let ring = 1; ring <= 60; ring++) {
    const delta = ring * DOT_STEP;
    if (delta > yMax) break;
    for (const sign of [1, -1] as const) {
      const cy = yCenter + sign * delta;
      if (!collides(cx, cy, placed)) return cy;
    }
  }

  return yCenter;
}

function layoutFeatureRow(
  points: ShapPoint[],
  xScale: (value: number) => number,
  yCenter: number,
  rowHeight: number,
  scale: ColorScale,
): PlacedPoint[] {
  const yMax = Math.max(DOT_R * 2, rowHeight * VERTICAL_SPREAD_RATIO);
  const sorted = [...points].sort((a, b) => a.shap_value - b.shap_value);
  const placed: { cx: number; cy: number }[] = [];
  const result: PlacedPoint[] = [];

  for (const point of sorted) {
    const cx = xScale(point.shap_value);
    const cy = beeswarmY(cx, placed, yCenter, yMax);
    placed.push({ cx, cy });

    result.push({
      point,
      cx,
      cy,
      color: lerpColor(colorNorm(point, scale)),
    });
  }

  return result;
}

function niceXDomain(values: number[]): [number, number] {
  if (values.length === 0) return [-1, 1];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.08, (max - min) * 0.06);
  const lo = Math.floor((min - pad) * 2) / 2;
  const hi = Math.ceil((max + pad) * 2) / 2;
  return [lo, hi];
}

function xTicks(domain: [number, number]): number[] {
  const [lo, hi] = domain;
  const step = hi - lo <= 3 ? 0.5 : 1;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 0.001; t += step) {
    ticks.push(Math.round(t * 10) / 10);
  }
  return ticks;
}

export default function ShapSummaryPlot() {
  const [data, setData] = useState<ShapSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ShapSummaryResponse>("/api/shap/summary")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const featureOrder = useMemo(() => {
    if (!data) return [];

    const importance = new Map<string, number>();
    for (const feature of data.features) {
      const points = data.points.filter((p) => p.feature === feature);
      const mean =
        points.reduce((sum, p) => sum + Math.abs(p.shap_value), 0) /
        (points.length || 1);
      importance.set(feature, mean);
    }

    return [...data.features].sort(
      (a, b) => (importance.get(b) ?? 0) - (importance.get(a) ?? 0),
    );
  }, [data]);

  const colorScales = useMemo(() => {
    if (!data) return new Map<string, ColorScale>();

    const scales = new Map<string, ColorScale>();
    for (const feature of featureOrder) {
      const points = data.points.filter((p) => p.feature === feature);
      scales.set(feature, buildColorScale(feature, points));
    }
    return scales;
  }, [data, featureOrder]);

  const pointsByFeature = useMemo(() => {
    if (!data) return new Map<string, ShapPoint[]>();

    const grouped = new Map<string, ShapPoint[]>();
    for (const feature of featureOrder) {
      grouped.set(
        feature,
        data.points.filter((p) => p.feature === feature),
      );
    }
    return grouped;
  }, [data, featureOrder]);

  const xDomain = useMemo((): [number, number] => {
    if (!data) return [-2, 2];
    return niceXDomain(data.points.map((p) => p.shap_value));
  }, [data]);

  const width = 400;
  const height = 245;
  const margin = { top: 8, right: 36, bottom: 20, left: 118 };
  const labelX = 42;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const rowH = featureOrder.length ? plotH / featureOrder.length : plotH;

  const xScale = (value: number) =>
    margin.left +
    ((value - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;

  const ticks = xTicks(xDomain);

  const rowLayouts = useMemo(() => {
    return featureOrder.map((feature, rowIndex) => {
      const yCenter = margin.top + rowH * rowIndex + rowH / 2;
      const scale = colorScales.get(feature) ?? {
        kind: "numeric" as const,
        min: 0,
        max: 1,
      };
      const points = pointsByFeature.get(feature) ?? [];
      return {
        feature,
        rowIndex,
        yCenter,
        yTop: margin.top + rowH * rowIndex,
        legend: LEGEND_FEATURES.has(feature)
          ? getLegendItems(feature, scale)
          : [],
        dots: layoutFeatureRow(points, xScale, yCenter, rowH, scale),
      };
    });
  }, [featureOrder, pointsByFeature, colorScales, rowH, xDomain]);

  return (
    <div className="rounded-lg border border-[#23303f] bg-[#142230] p-2.5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-white">
            SHAP Summary Plot
          </h2>
        </div>
        <span className="text-sm leading-none text-[#667788]">⋮</span>
      </div>

      {loading ? (
        <div className="h-[245px] animate-pulse rounded-md bg-[#0d1a28]" />
      ) : !data || featureOrder.length === 0 ? (
        <div className="flex h-[245px] items-center justify-center rounded-md border border-dashed border-[#2a3848] text-[10px] text-[#667788]">
          SHAP summary data unavailable
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[245px] w-full"
          role="img"
          aria-label="SHAP summary beeswarm plot"
        >
          <defs>
            <linearGradient id="shap-colorbar" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#1e88e5" />
              <stop offset="100%" stopColor="#d81b60" />
            </linearGradient>
            <clipPath id="shap-plot-clip">
              <rect
                x={margin.left}
                y={margin.top}
                width={plotW}
                height={plotH}
              />
            </clipPath>
          </defs>

          {rowLayouts.map(({ feature, yCenter, yTop, rowIndex, legend }) => {
            const hasLegend = legend.length > 0;
            const nameY = hasLegend ? yCenter - 5 : yCenter;
            const legendY = yCenter + 5;
            const legendXs = layoutLegendPositions(legend);

            return (
            <g key={`label-${feature}`}>
              {rowIndex > 0 && (
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={yTop}
                  y2={yTop}
                  stroke="#1e2d3d"
                  strokeWidth={1}
                />
              )}
              <text
                x={labelX}
                y={nameY}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#aab4c0"
                fontSize={8}
              >
                {feature}
              </text>

              {legend.map((item, legendIndex) => {
                const itemX = legendXs[legendIndex];
                return (
                  <g key={`${feature}-${item.label}`}>
                    <circle
                      cx={itemX}
                      cy={legendY}
                      r={2.8}
                      fill={item.color}
                      fillOpacity={0.95}
                    />
                    <text
                      x={itemX + 5}
                      y={legendY}
                      dominantBaseline="middle"
                      fill="#8899aa"
                      fontSize={6.5}
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </g>
            );
          })}

          <g clipPath="url(#shap-plot-clip)">
            <line
              x1={xScale(0)}
              x2={xScale(0)}
              y1={margin.top}
              y2={margin.top + plotH}
              stroke="#8a96a3"
              strokeWidth={1}
            />

            {rowLayouts.map(({ feature, dots }) =>
              dots.map(({ point, cx, cy, color }, i) => (
                <circle
                  key={`${feature}-${point.passenger_id ?? i}`}
                  cx={cx}
                  cy={cy}
                  r={DOT_R}
                  fill={color}
                  fillOpacity={0.92}
                  stroke="#0d1a28"
                  strokeWidth={0.15}
                />
              )),
            )}
          </g>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={margin.top + plotH}
                y2={margin.top + plotH + 4}
                stroke="#4a5a6a"
                strokeWidth={1}
              />
              <text
                x={xScale(tick)}
                y={height - 8}
                textAnchor="middle"
                fill="#667788"
                fontSize={7}
              >
                {tick}
              </text>
            </g>
          ))}

          <text
            x={margin.left + plotW / 2}
            y={height - 1}
            textAnchor="middle"
            fill="#667788"
            fontSize={7}
          >
            SHAP value
          </text>

          <rect
            x={width - margin.right + 8}
            y={margin.top + 6}
            width={8}
            height={plotH - 12}
            rx={2}
            fill="url(#shap-colorbar)"
          />
          <text
            x={width - margin.right + 12}
            y={margin.top + 3}
            textAnchor="middle"
            fill="#8899aa"
            fontSize={7}
          >
            High
          </text>
          <text
            x={width - margin.right + 12}
            y={margin.top + plotH + 5}
            textAnchor="middle"
            fill="#8899aa"
            fontSize={7}
          >
            Low
          </text>
          <text
            x={width - margin.right + 12}
            y={margin.top + plotH / 2 + 2}
            textAnchor="middle"
            fill="#667788"
            fontSize={6}
            transform={`rotate(-90 ${width - margin.right + 12} ${margin.top + plotH / 2 + 2})`}
          >
            Feature value
          </text>
        </svg>
      )}
    </div>
  );
}
