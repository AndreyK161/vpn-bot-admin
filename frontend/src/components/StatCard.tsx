import type { LucideIcon } from "lucide-react";

type Trend = "up" | "down" | "flat";

export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: Trend;
  icon: LucideIcon;
}) {
  const trendColor =
    trend === "up"
      ? "text-[var(--success)]"
      : trend === "down"
        ? "text-[var(--danger)]"
        : "text-[var(--text-muted)]";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)]">
          <Icon className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
        {value}
      </p>
      {delta && (
        <p className={`mt-1 text-xs font-medium ${trendColor}`}>{delta}</p>
      )}
    </div>
  );
}
