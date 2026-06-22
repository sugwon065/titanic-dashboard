import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  minHeight?: string;
  children?: ReactNode;
};

export default function DashboardCard({
  title,
  subtitle,
  className = "",
  minHeight,
  children,
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-lg border border-[#23303f] bg-[#142230] p-3 ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[9px] text-[#8899aa]">{subtitle}</p>
          ) : null}
        </div>
        <span className="text-sm leading-none text-[#667788]">⋮</span>
      </div>
      {children ?? (
        <div className="flex min-h-[80px] items-center justify-center rounded-md border border-dashed border-[#2a3848] text-[10px] text-[#667788]">
          {title}
        </div>
      )}
    </div>
  );
}
