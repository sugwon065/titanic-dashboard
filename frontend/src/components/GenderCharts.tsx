import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/client";

type SexStats = {
  survived_rate: number;
  died_rate: number;
  count: number;
};

type SurvivalBySexResponse = {
  female: SexStats;
  male: SexStats;
};

const COLORS = {
  male: "#2196f3",
  female: "#ff6b6b",
};

export default function GenderCharts() {
  const [data, setData] = useState<SurvivalBySexResponse | null>(null);
  const [totalPassengers, setTotalPassengers] = useState(891);

  useEffect(() => {
    Promise.all([
      api.get<SurvivalBySexResponse>("/api/survival-by-sex"),
      api.get<{ total_passengers: number }>("/api/summary"),
    ])
      .then(([sexRes, summaryRes]) => {
        setData(sexRes.data);
        setTotalPassengers(summaryRes.data.total_passengers);
      })
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="min-h-[240px] animate-pulse rounded-lg border border-[#23303f] bg-[#142230]" />
    );
  }

  const total = data.male.count + data.female.count;
  const malePct = total ? Math.round((data.male.count / total) * 100) : 0;
  const femalePct = total ? Math.round((data.female.count / total) * 100) : 0;

  const donutData = [
    { name: "female", value: data.female.count },
    { name: "male", value: data.male.count },
  ];

  const barData = [
    { sex: "Female", rate: Math.round(data.female.survived_rate * 100) },
    { sex: "Male", rate: Math.round(data.male.survived_rate * 100) },
  ];

  return (
    <div className="rounded-lg border border-[#23303f] bg-[#142230] p-3">
      <div className="grid grid-cols-2 gap-2 divide-x divide-[#23303f]">
        <div className="pr-2">
          <p className="mb-2 text-center text-[9px] text-[#8899aa]">
            Population Distribution
          </p>
          <div className="relative h-[170px]">
            <span className="absolute right-0 top-3 z-10 text-[9px] font-medium text-[#ff6b6b]">
              Female {femalePct}%
            </span>
            <span className="absolute bottom-3 left-0 z-10 text-[9px] font-medium text-[#2196f3]">
              Male {malePct}%
            </span>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="glowB" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowR" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={donutData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius="54%"
                  outerRadius="82%"
                  stroke="#142230"
                  strokeWidth={3}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                >
                  <Cell key="female" fill={COLORS.female} filter="url(#glowR)" />
                  <Cell key="male" fill={COLORS.male} filter="url(#glowB)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">
                Total {totalPassengers}
              </span>
            </div>
          </div>
        </div>

        <div className="pl-2">
          <p className="mb-2 text-center text-[9px] text-[#8899aa]">
            Survival Rate by Gender
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={barData} margin={{ top: 18, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="#2a3848" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="sex"
                tick={{ fontSize: 8, fill: "#8899aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <Cell fill={COLORS.female} />
                <Cell fill={COLORS.male} />
                <LabelList
                  dataKey="rate"
                  position="top"
                  formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 9, fill: "#fff", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
