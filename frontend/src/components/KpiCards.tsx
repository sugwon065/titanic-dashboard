import { useEffect, useState } from "react";
import api from "../api/client";

type SummaryResponse = {
  total_passengers: number;
  survival_rate: number;
};

type KpiCardProps = {
  value: string;
  label: string;
};

function KpiCard({ value, label }: KpiCardProps) {
  return (
    <div className="flex min-h-[68px] flex-col items-center justify-center rounded-lg border border-[#23303f] bg-[#142230] px-3 py-3 text-center">
      <p className="text-[11px] text-[#aab4c0]">{label}</p>
      <p className="mt-1.5 text-[22px] font-bold leading-none text-white">{value}</p>
    </div>
  );
}

export default function KpiCards() {
  const [data, setData] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    api
      .get<SummaryResponse>("/api/summary")
      .then((response) => setData(response.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-[68px] animate-pulse rounded-lg bg-[#142230]" />
        <div className="h-[68px] animate-pulse rounded-lg bg-[#142230]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <KpiCard
        value={data.total_passengers.toLocaleString()}
        label="Total Passengers"
      />
      <KpiCard
        value={`${(data.survival_rate * 100).toFixed(1)}%`}
        label="Survival Rate"
      />
    </div>
  );
}
