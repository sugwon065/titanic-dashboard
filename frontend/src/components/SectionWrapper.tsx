import type { ReactNode } from "react";

type SectionWrapperProps = {
  title: string;
  className?: string;
  children: ReactNode;
};

export default function SectionWrapper({
  title,
  className = "",
  children,
}: SectionWrapperProps) {
  return (
    <section
      className={`rounded-lg border border-[#23303f] bg-[#17212e] p-2.5 ${className}`}
    >
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-white">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
