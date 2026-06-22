import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/client";

type View = "overall" | "male" | "female";

type SurvivalRateByAgeResponse = {
  ages: number[];
  overall: number[];
  male: number[];
  female: number[];
};

const VIEW_CONFIG: Record<
  View,
  { label: string; color: string; dataKey: "overall" | "male" | "female" }
> = {
  overall: { label: "Overall", color: "#4caf50", dataKey: "overall" },
  male: { label: "Male", color: "#2196f3", dataKey: "male" },
  female: { label: "Female", color: "#ff8c82", dataKey: "female" },
};

export default function AgeSurvivalRateChart() {
  const [raw, setRaw] = useState<SurvivalRateByAgeResponse | null>(null);
  const [view, setView] = useState<View>("overall");

  useEffect(() => {
    api
      .get<SurvivalRateByAgeResponse>("/api/survival-rate-by-age?bin_size=5")
      .then((res) => setRaw(res.data))
      .catch(() => setRaw(null));
  }, []);

  const active = VIEW_CONFIG[view];

  const chartData =
    raw?.ages.map((age, i) => ({
      age,
      rate: raw[active.dataKey][i],
    })) ?? [];

  return (
    <div className="rounded-lg border border-[#23303f] bg-[#142230] p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-white">
          Survival Rate by Age
        </h2>
        <div className="flex gap-1">
          {(Object.keys(VIEW_CONFIG) as View[]).map((key) => {
            const cfg = VIEW_CONFIG[key];
            const isActive = view === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "border border-[#23303f] bg-[#0d1a28] text-[#8899aa] hover:text-white"
                }`}
                style={
                  isActive
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : undefined
                }
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {!raw ? (
        <div className="h-[198px] animate-pulse rounded-md bg-[#0d1a28]" />
      ) : (
        <ResponsiveContainer width="100%" height={198}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 6, left: 4, bottom: 2 }}
            barCategoryGap="8%"
          >
            <CartesianGrid
              stroke="#2a3848"
              strokeDasharray="3 3"
              vertical
              horizontal
            />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 8, fill: "#8899aa" }}
              axisLine={{ stroke: "#2a3848" }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={38}
              tickFormatter={(v) => (v === 60 ? "60+" : String(v))}
              label={{
                value: "Age",
                position: "insideBottom",
                offset: 0,
                fontSize: 9,
                fill: "#8899aa",
              }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 8, fill: "#8899aa" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
              label={{
                value: "Survival ratio",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fontSize: 9,
                fill: "#8899aa",
                style: { textAnchor: "middle" },
              }}
            />
            <Bar
              dataKey="rate"
              fill={active.color}
              radius={[2, 2, 0, 0]}
              maxBarSize={14}
            >
              <LabelList
                dataKey="rate"
                position="top"
                formatter={(v: number) => `${Math.round(v)}%`}
                style={{ fontSize: 7, fill: "#ffffff", fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
