import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/client";

type ClassStats = {
  survived_rate: number;
  death_rate: number;
  count: number;
  survived_count: number;
  died_count: number;
};

type SurvivalByClassResponse = {
  "1": ClassStats;
  "2": ClassStats;
  "3": ClassStats;
};

const CLASS_LABELS: Record<"1" | "2" | "3", string> = {
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
};

export default function ClassSurvivalBar() {
  const [data, setData] = useState<SurvivalByClassResponse | null>(null);

  useEffect(() => {
    api
      .get<SurvivalByClassResponse>("/api/survival-by-class")
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="min-h-[180px] animate-pulse rounded-lg border border-[#23303f] bg-[#142230]" />
    );
  }

  const chartData = (["1", "2", "3"] as const).map((key) => {
    const row = data[key];
    return {
      cls: CLASS_LABELS[key],
      survived: Math.round(row.survived_rate * 1000) / 10,
      death: Math.round(row.death_rate * 1000) / 10,
    };
  });

  return (
    <div className="rounded-lg border border-[#23303f] bg-[#142230] p-3">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white">
        Survival by Passenger Class
      </h2>
      <ResponsiveContainer width="100%" height={175}>
        <BarChart
          data={chartData}
          margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid stroke="#2a3848" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="cls"
            tick={{ fontSize: 9, fill: "#8899aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
          <Legend
            wrapperStyle={{ fontSize: 10, color: "#aab4c0" }}
            iconType="square"
            iconSize={9}
          />
          <Bar
            dataKey="survived"
            name="Survived"
            fill="#2196f3"
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          >
            <LabelList
              dataKey="survived"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{ fontSize: 8, fill: "#ffffff", fontWeight: 700 }}
            />
          </Bar>
          <Bar
            dataKey="death"
            name="Death"
            fill="#9aa5b1"
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          >
            <LabelList
              dataKey="death"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{ fontSize: 8, fill: "#ffffff", fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
