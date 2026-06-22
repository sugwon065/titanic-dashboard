import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
} from "react-leaflet";
import api from "../api/client";
import PortDetailPanel from "./PortDetailPanel";
import "./EmbarkedPortMap.css";

type PortCode = "S" | "C" | "Q";

type PortData = {
  name: string;
  lat: number;
  lng: number;
  count: number;
  survival_rate: number;
};

type EmbarkedSummary = Record<PortCode, PortData>;

/** 마커 표시용 좌표 (S/C 겹침 방지를 위해 실측값에서 미세 조정) */
const PORT_COORDS: Record<PortCode, { lat: number; lng: number }> = {
  S: { lat: 51.18, lng: -1.4044 },
  C: { lat: 49.38, lng: -1.6221 },
  Q: { lat: 51.849, lng: -8.294 },
};

const PORT_META: Record<PortCode, { color: string; labelAbove: boolean }> = {
  S: { color: "#2196f3", labelAbove: true },
  C: { color: "#00bcd4", labelAbove: false },
  Q: { color: "#4caf50", labelAbove: true },
};

const PORT_CIRCLE_SIZE = 30;
const LABEL_BLOCK_HEIGHT = 48;

function createPortIcon(
  code: string,
  port: PortData,
  color: string,
  labelAbove: boolean,
) {
  const size = PORT_CIRCLE_SIZE;
  const survival = (port.survival_rate * 100).toFixed(1);

  const labelHtml = `
    <div class="port-label ${labelAbove ? "port-label-top" : "port-label-bottom"}">
      <div class="port-label-name">${port.name}</div>
      <div class="port-label-count">passenger: ${port.count}</div>
      <div class="port-label-rate">♥ ${survival}%</div>
    </div>`;

  const circleHtml = `
    <div class="port-circle" style="width:${size}px;height:${size}px;background:${color}">
      ${code}
    </div>`;

  const html = `
    <div class="port-marker-wrap">
      ${labelAbove ? labelHtml + circleHtml : circleHtml + labelHtml}
    </div>`;

  const totalHeight = LABEL_BLOCK_HEIGHT + size;
  const circleCenterY = labelAbove
    ? LABEL_BLOCK_HEIGHT + size / 2
    : size / 2;

  return L.divIcon({
    className: "custom-port-marker",
    html,
    iconSize: [130, totalHeight],
    iconAnchor: [65, circleCenterY],
  });
}

/** S → C → Q 항로 (C–Q: 콘월 남쪽 스치듯, 과도한 우회 없음) */
const ROUTE_PORTS: [number, number][] = [
  [PORT_COORDS.S.lat, PORT_COORDS.S.lng],
  [50.4, -1.55],
  [PORT_COORDS.C.lat, PORT_COORDS.C.lng],
  [49.2, -3.8],
  [49.4, -5.5],
  [50.6, -7.2],
  [PORT_COORDS.Q.lat, PORT_COORDS.Q.lng],
];

const ATLANTIC_ROUTE: [number, number][] = [
  [47.0, -17],
  [48.5, -13],
  [49.5, -10],
  [50.5, -8.8],
  [PORT_COORDS.Q.lat, PORT_COORDS.Q.lng],
];

export default function EmbarkedPortMap({
  className = "",
}: {
  className?: string;
}) {
  const [ports, setPorts] = useState<EmbarkedSummary | null>(null);
  const [selectedPort, setSelectedPort] = useState<PortCode>("S");

  useEffect(() => {
    api
      .get<EmbarkedSummary>("/api/embarked-summary")
      .then((res) => setPorts(res.data))
      .catch(() => setPorts(null));
  }, []);

  const markers = useMemo(() => {
    if (!ports) return [];

    return (Object.keys(PORT_COORDS) as PortCode[]).map((code) => {
      const port = ports[code];
      const meta = PORT_META[code];
      const coords = PORT_COORDS[code];

      return {
        code,
        icon: createPortIcon(code, port, meta.color, meta.labelAbove),
        position: [coords.lat, coords.lng] as [number, number],
      };
    });
  }, [ports]);

  return (
    <div
      className={`embark-map-card flex flex-col rounded-lg border border-[#23303f] bg-[#142230] p-3 ${className}`}
    >
      <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white">
        <span aria-hidden>🌐</span>
        Embarkation Port Analysis
      </h2>

      {!ports ? (
        <div className="min-h-[280px] flex-1 animate-pulse rounded-md bg-[#0d1a28]" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="embark-map-container h-[280px] shrink-0 overflow-hidden rounded-md">
          <MapContainer
            center={[50.5, -6.5]}
            zoom={4.7}
            zoomSnap={0.1}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
            />
            <Polyline
              positions={ROUTE_PORTS}
              pathOptions={{ color: "#ff9800", weight: 2.5, opacity: 0.85 }}
              smoothFactor={1.2}
            />
            <Polyline
              positions={ATLANTIC_ROUTE}
              pathOptions={{
                color: "#2196f3",
                weight: 2,
                opacity: 0.6,
                dashArray: "6 8",
              }}
            />
            {markers.map(({ code, icon, position }) => (
              <Marker
                key={code}
                position={position}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedPort(code),
                }}
              />
            ))}
          </MapContainer>
          <span className="atlantic-label">Atlantic Ocean</span>
          </div>

          <div className="min-h-0 flex-1" />

          <PortDetailPanel
            portCode={selectedPort}
            portName={ports[selectedPort].name}
            portColor={PORT_META[selectedPort].color}
          />
        </div>
      )}
    </div>
  );
}
