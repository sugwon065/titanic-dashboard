import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import api from "../api/client";

type PortCode = "S" | "C" | "Q";

type SexStats = {
  survived_rate: number;
  died_rate: number;
  count: number;
};

type ClassStats = {
  survived_rate: number;
  death_rate: number;
  count: number;
};

type PieSlice = {
  name: string;
  value: number;
  color: string;
};

type PortDetailPanelProps = {
  portCode: PortCode;
  portName: string;
  portColor: string;
};

function pct(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function RatioDonut({
  centerLabel,
  data,
}: {
  centerLabel: string;
  data: PieSlice[];
}) {
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative h-[110px] w-[55%] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="78%"
                stroke="#0d1a28"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-semibold text-[#8899aa]">
              {centerLabel}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {data.map((row) => (
            <div key={row.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate text-[8px] text-[#aab4c0]">
                {row.name}
              </span>
              <span className="ml-auto text-[9px] font-bold text-white">
                {pct(row.value, total)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PortDetailPanel({
  portCode,
  portName,
  portColor,
}: PortDetailPanelProps) {
  const [genderData, setGenderData] = useState<PieSlice[]>([]);
  const [classData, setClassData] = useState<PieSlice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get<Record<"female" | "male", SexStats>>("/api/survival-by-sex", {
        params: { embarked: portCode },
      }),
      api.get<Record<"1" | "2" | "3", ClassStats>>("/api/survival-by-class", {
        params: { embarked: portCode },
      }),
    ])
      .then(([sexRes, classRes]) => {
        setGenderData([
          {
            name: "Female",
            value: sexRes.data.female.count,
            color: "#ff8c82",
          },
          {
            name: "Male",
            value: sexRes.data.male.count,
            color: "#2196f3",
          },
        ]);

        setClassData([
          {
            name: "1st",
            value: classRes.data["1"].count,
            color: "#1b5e20",
          },
          {
            name: "2nd",
            value: classRes.data["2"].count,
            color: "#9ccc65",
          },
          {
            name: "3rd",
            value: classRes.data["3"].count,
            color: "#b0bec5",
          },
        ]);
      })
      .catch(() => {
        setGenderData([]);
        setClassData([]);
      })
      .finally(() => setLoading(false));
  }, [portCode]);

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: portColor }}
        >
          {portCode}
        </span>
        <h3 className="text-[11px] font-bold text-white">
          {portName} — Passenger Ratio
        </h3>
      </div>

      <div className="rounded-md border border-[#23303f] bg-[#0d1a28] p-2.5">
        {loading ? (
          <div className="h-[130px] animate-pulse rounded bg-[#142230]" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <RatioDonut centerLabel="Gender" data={genderData} />
            <RatioDonut centerLabel="Class" data={classData} />
          </div>
        )}
      </div>
    </div>
  );
}
