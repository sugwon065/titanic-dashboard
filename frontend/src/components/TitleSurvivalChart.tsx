import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/client";

type TitleRow = {
  title: string;
  count: number;
  survived_count: number;
  died_count: number;
  survival_rate: number;
  death_rate: number;
};

const TITLE_COLORS: Record<string, string> = {
  Mr: "#2196f3",
  Miss: "#ff8c82",
  Mrs: "#e91e63",
  Master: "#9ccc65",
  Dr: "#00bcd4",
  Rev: "#9aa5b1",
};

type TitleSurvivalChartProps = {
  className?: string;
};

export default function TitleSurvivalChart({
  className = "",
}: TitleSurvivalChartProps) {
  const [rows, setRows] = useState<TitleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ titles: TitleRow[] }>("/api/survival-by-title")
      .then((res) => setRows(res.data.titles))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const barData = rows.map((row) => ({
    title: row.title,
    survival: Math.round(row.survival_rate * 1000) / 10,
    count: row.count,
    color: TITLE_COLORS[row.title] ?? "#4caf50",
  }));

  return (
    <div
      className={`flex flex-col rounded-lg border border-[#23303f] bg-[#142230] p-3 ${className}`}
    >
      <h2 className="mb-2 shrink-0 text-[11px] font-bold uppercase tracking-wide text-white">
        Survival by Title
      </h2>

      <div className="min-h-[180px] flex-1">
        {loading ? (
          <div className="h-full min-h-[180px] animate-pulse rounded bg-[#0d1a28]" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
              barCategoryGap="22%"
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 7, fill: "#667788" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fontSize: 8, fill: "#8899aa" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Bar dataKey="survival" radius={[0, 3, 3, 0]} maxBarSize={16}>
                {barData.map((row) => (
                  <Cell key={row.title} fill={row.color} />
                ))}
                <LabelList
                  dataKey="survival"
                  position="right"
                  content={({ x, y, width, height, value, index }) => {
                    if (
                      x == null ||
                      y == null ||
                      width == null ||
                      height == null ||
                      index == null
                    ) {
                      return null;
                    }
                    const count = barData[index]?.count ?? 0;
                    const barEnd = Number(x) + Number(width);
                    const centerY = Number(y) + Number(height) / 2;
                    return (
                      <text x={barEnd + 4} y={centerY} dy={3} fontSize={8}>
                        <tspan fill="#fff" fontWeight={700}>
                          {value}%
                        </tspan>
                        <tspan fill="#8899aa" fontWeight={600}>
                          {` n=${count}`}
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
