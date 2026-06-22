import { useEffect, useState } from "react";
import api from "../api/client";

type ModelMetricsResponse = {
  accuracy: number;
  auc_roc: number;
};

type MetricCardProps = {
  value: string;
  label: string;
};

function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="flex min-h-[68px] flex-col items-center justify-center rounded-lg border border-[#23303f] bg-[#142230] px-3 py-3 text-center">
      <p className="text-[11px] text-[#aab4c0]">{label}</p>
      <p className="mt-1.5 text-[22px] font-bold leading-none text-white">{value}</p>
    </div>
  );
}

export default function ModelMetricsCards() {
  const [data, setData] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ModelMetricsResponse>("/api/model-metrics")
      .then((response) => setData(response.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-[68px] animate-pulse rounded-lg bg-[#142230]" />
        <div className="h-[68px] animate-pulse rounded-lg bg-[#142230]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        label="Accuracy"
        value={
          data ? `${(data.accuracy * 100).toFixed(1)}%` : "—"
        }
      />
      <MetricCard
        label="AUC-ROC"
        value={data ? data.auc_roc.toFixed(3) : "—"}
      />
    </div>
  );
}
