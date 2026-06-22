import { useEffect, useMemo, useRef, useState } from "react";

export type WaterfallStep = {
  feature: string;
  value: number;
  start: number;
  end: number;
};

export type WaterfallData = {
  base_value: number;
  output_value: number;
  steps: WaterfallStep[];
  x_domain?: [number, number];
};

const POS_COLOR = "#e53935";
const NEG_COLOR = "#2196f3";

function formatDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function niceTicks(minV: number, maxV: number): number[] {
  const span = maxV - minV;
  const step =
    span <= 0.6 ? 0.1 : span <= 1.2 ? 0.2 : span <= 2.5 ? 0.5 : 1;
  const start = Math.ceil(minV / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= maxV + 0.0001; tick += step) {
    ticks.push(Math.round(tick * 1000) / 1000);
  }
  return ticks;
}

function ArrowBar({
  x1,
  x2,
  y,
  barH,
  color,
}: {
  x1: number;
  x2: number;
  y: number;
  barH: number;
  color: string;
}) {
  const left = Math.min(x1, x2);
  const width = Math.max(Math.abs(x2 - x1), 2);
  const tip = Math.max(2, barH * 0.28);

  if (x2 >= x1) {
    return (
      <polygon
        points={`${left},${y} ${left + width},${y} ${left + width + tip},${y + barH / 2} ${left + width},${y + barH} ${left},${y + barH}`}
        fill={color}
        opacity={0.95}
      />
    );
  }

  return (
    <polygon
      points={`${left + width},${y} ${left + width},${y + barH} ${left},${y + barH} ${left - tip},${y + barH / 2} ${left},${y}`}
      fill={color}
      opacity={0.95}
    />
  );
}

type ShapWaterfallPlotProps = {
  data: WaterfallData;
};

export default function ShapWaterfallPlot({ data }: ShapWaterfallPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 220, height: 180 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { baseValue, steps, domain, layout } = useMemo(() => {
    const baseValue = data.base_value;
    const steps = data.steps;

    const values = [
      baseValue,
      data.output_value,
      ...steps.flatMap((step) => [step.start, step.end]),
    ];
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const pad = Math.max(0.04, (maxV - minV) * 0.08);
    const domain: [number, number] =
      data.x_domain ?? [minV - pad, maxV + pad];

    const margin = { top: 2, right: 12, bottom: 14, left: 48 };
    const axisBand = 10;
    const topBand = 4;
    const stepCount = Math.max(steps.length, 1);
    const barsH =
      size.height - margin.top - margin.bottom - axisBand - topBand;
    const rowH = barsH / stepCount;
    const barH = Math.min(12, Math.max(7, rowH * 0.58));
    const plotTop = margin.top + topBand;
    const axisY = size.height - margin.bottom;

    return {
      baseValue,
      steps,
      domain,
      layout: {
        margin,
        width: size.width,
        height: size.height,
        rowH,
        barH,
        plotTop,
        axisY,
      },
    };
  }, [data, size]);

  const plotW = layout.width - layout.margin.left - layout.margin.right;
  const xScale = (value: number) =>
    layout.margin.left +
    ((value - domain[0]) / (domain[1] - domain[0])) * plotW;

  const ticks = niceTicks(domain[0], domain[1]);

  return (
    <div ref={containerRef} className="h-full min-h-[140px] w-full">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="h-full w-full"
        role="img"
        aria-label="SHAP waterfall plot"
      >
        <line
          x1={xScale(baseValue)}
          x2={xScale(baseValue)}
          y1={layout.plotTop - 3}
          y2={layout.plotTop}
          stroke="#aab4c0"
          strokeWidth={1}
          strokeDasharray="2 2"
        />

        {steps.map((step, index) => {
          const rowCenter = layout.plotTop + index * layout.rowH + layout.rowH / 2;
          const y = rowCenter - layout.barH / 2;
          const xStart = xScale(step.start);
          const xEnd = xScale(step.end);
          const color = step.value >= 0 ? POS_COLOR : NEG_COLOR;
          const connectorTop =
            index === 0
              ? layout.plotTop
              : layout.plotTop + (index - 1) * layout.rowH + layout.rowH / 2 + layout.barH / 2;

          return (
            <g key={`${step.feature}-${index}`}>
              <line
                x1={xStart}
                x2={xStart}
                y1={connectorTop}
                y2={y + 1}
                stroke="#667788"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <text
                x={layout.margin.left - 4}
                y={rowCenter}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#8899aa"
                fontSize={6.5}
              >
                {step.feature}
              </text>
              <ArrowBar
                x1={xStart}
                x2={xEnd}
                y={y}
                barH={layout.barH}
                color={color}
              />
              <text
                x={step.value >= 0 ? xEnd + 4 : xEnd - 4}
                y={rowCenter}
                textAnchor={step.value >= 0 ? "start" : "end"}
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={6}
                fontWeight={700}
              >
                {formatDelta(step.value)}
              </text>
            </g>
          );
        })}

        <line
          x1={layout.margin.left}
          x2={layout.width - layout.margin.right}
          y1={layout.axisY}
          y2={layout.axisY}
          stroke="#3a4d63"
          strokeWidth={1}
        />

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={layout.axisY}
              y2={layout.axisY + 3}
              stroke="#4a5a6a"
              strokeWidth={1}
            />
            <text
              x={xScale(tick)}
              y={layout.height - 2}
              textAnchor="middle"
              fill="#667788"
              fontSize={6}
            >
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
