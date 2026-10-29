import type { ReactNode } from "react";

export default function SectionHeader({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm">
        {icon}
      </span>
      <div>
        <h2 className="font-semibold leading-tight text-ink">{title}</h2>
        {hint && <p className="text-xs text-ink/60">{hint}</p>}
      </div>
    </div>
  );
}