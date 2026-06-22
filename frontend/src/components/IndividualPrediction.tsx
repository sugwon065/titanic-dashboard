import { useEffect, useMemo, useState } from "react";
import { FemaleIcon, MaleIcon } from "./GenderIcons";
import ShapWaterfallPlot, { type WaterfallData } from "./ShapWaterfallPlot";
import api from "../api/client";

type PassengerListItem = {
  passenger_id: number;
  name: string;
  prob_survive: number;
  survived_pred: number;
};

type PassengerDetail = {
  passenger_id: number;
  name: string;
  survived_actual: number;
  survived_pred: number;
  prob_survive: number;
  base_value: number;
  features: Record<string, string | number>;
  shap_values: Record<string, number>;
  waterfall?: WaterfallData;
};

function formatSex(sex: string | number | undefined): string {
  if (sex == null) return "-";
  const label = String(sex);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildWaterfallFromDetail(detail: PassengerDetail): WaterfallData {
  let cursor = detail.base_value;
  const steps = Object.entries(detail.shap_values)
    .map(([feature, value]) => {
      const start = cursor;
      cursor += value;
      return { feature, value, start, end: cursor };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return {
    base_value: detail.base_value,
    output_value: cursor,
    steps,
  };
}

function formatClass(pclass: string | number | undefined): string {
  if (pclass == null) return "-";
  const value = Number(pclass);
  if (value === 1) return "1st";
  if (value === 2) return "2nd";
  if (value === 3) return "3rd";
  return String(pclass);
}

function formatEmbarked(embarked: string | number | undefined): string {
  if (embarked == null) return "-";
  const code = String(embarked);
  const ports: Record<string, string> = {
    S: "Southampton",
    C: "Cherbourg",
    Q: "Queenstown",
  };
  return ports[code] ? `${ports[code]} (${code})` : code;
}

function PassengerProfile({ detail }: { detail: PassengerDetail }) {
  const sex = String(detail.features.Sex ?? "");
  const isMale = sex.toLowerCase() === "male";
  const predictedLabel = detail.survived_pred === 1 ? "Survived" : "Died";
  const survived = predictedLabel === "Survived";

  const infoRows = [
    { label: "Name", value: detail.name },
    { label: "Age", value: String(detail.features.Age ?? "-") },
    { label: "Gender", value: formatSex(detail.features.Sex) },
    { label: "Class", value: formatClass(detail.features.Pclass) },
    { label: "Embarkation", value: formatEmbarked(detail.features.Embarked) },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 items-stretch gap-2.5">
        <div
          className={`flex w-14 shrink-0 items-center justify-center rounded-xl border bg-[#0d1a28] ${
            isMale ? "border-[#2196f3]/60" : "border-[#ff8c82]/60"
          }`}
        >
          <div className="scale-[1.45]">
            {isMale ? (
              <MaleIcon color="#2196f3" />
            ) : (
              <FemaleIcon color="#ff8c82" />
            )}
          </div>
        </div>
        <div className="min-w-0 flex flex-col justify-center gap-1">
          {infoRows.map((row) => (
            <div key={row.label} className="text-[8px] leading-snug">
              <span className="text-[#667788]">{row.label}: </span>
              <span
                className={`font-medium text-[#dce3ea] ${
                  row.label === "Name" ? "line-clamp-2" : ""
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center">
        <div>
          <p className="text-[8px] text-[#8899aa]">Predicted Survival:</p>
          <p className="text-[20px] font-bold leading-tight text-white">
            {(detail.prob_survive * 100).toFixed(0)}%{" "}
            <span
              className={`text-[16px] ${
                survived ? "text-[#4caf50]" : "text-[#ff5c7a]"
              }`}
            >
              ({predictedLabel})
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IndividualPrediction() {
  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PassengerDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api
      .get<{ passengers: PassengerListItem[] }>("/api/shap/passengers")
      .then((res) => {
        setPassengers(res.data.passengers);
        if (res.data.passengers.length > 0) {
          const preferred =
            res.data.passengers.find((p) => p.passenger_id === 711) ??
            res.data.passengers[0];
          setSelectedId(preferred.passenger_id);
        }
      })
      .catch(() => setPassengers([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    api
      .get<PassengerDetail>(`/api/shap/passenger/${selectedId}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const waterfallData = useMemo(
    () => (detail ? detail.waterfall ?? buildWaterfallFromDetail(detail) : null),
    [detail],
  );

  return (
    <div className="rounded-lg border border-[#23303f] bg-[#142230] p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-white">
          Individual Prediction
        </h2>
        <span className="text-sm leading-none text-[#667788]">⋮</span>
      </div>

      {loadingList ? (
        <div className="h-[220px] animate-pulse rounded-md bg-[#0d1a28]" />
      ) : passengers.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-[#2a3848] text-[10px] text-[#667788]">
          Passenger data unavailable
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="max-h-[72px] overflow-y-auto rounded border border-[#23303f] bg-[#0d1a28]">
            {passengers.map((passenger) => {
              const isActive = passenger.passenger_id === selectedId;
              return (
                <button
                  key={passenger.passenger_id}
                  type="button"
                  onClick={() => setSelectedId(passenger.passenger_id)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-[#1b2838] px-2 py-1 text-left last:border-b-0 ${
                    isActive ? "bg-[#1d3348]" : "hover:bg-[#152433]"
                  }`}
                >
                  <span className="truncate text-[8px] text-[#dce3ea]">
                    #{passenger.passenger_id} {passenger.name}
                  </span>
                  <span className="shrink-0 text-[8px] text-[#8899aa]">
                    {(passenger.prob_survive * 100).toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>

          {loadingDetail ? (
            <div className="h-[140px] animate-pulse rounded-md bg-[#0d1a28]" />
          ) : detail && waterfallData ? (
            <div className="grid grid-cols-[1fr_1.05fr] items-stretch gap-2 rounded-md border border-[#23303f] bg-[#0d1a28] p-2.5">
              <div className="flex h-full min-h-0 min-w-0 flex-col">
                <PassengerProfile detail={detail} />
              </div>
              <div className="h-full min-h-0 min-w-0">
                <ShapWaterfallPlot data={waterfallData} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
