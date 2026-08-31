import { useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import { apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { EventTypeStats } from "../lib/types";

type Period = "day" | "week" | "month" | "year" | "all";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
  { value: "all", label: "Всё время" },
];

export function Events() {
  const [stats, setStats] = useState<EventTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");

  useEffect(() => {
    setLoading(true);
    apiFetch<EventTypeStats[]>(`/api/events/stats?period=${period}`)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <>
      <Topbar
        title="События"
        subtitle="Конверсия по сценариям бота — например, скидка при окончании подписки"
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex gap-1.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={
                period === option.value
                  ? "rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)]"
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        {!loading && stats.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
            {period === "all"
              ? "Событий пока нет — бот ещё не отправил ни одного через /api/ingest/events"
              : "За выбранный период событий не было"}
          </div>
        )}

        {stats.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Событие</th>
                  <th className="px-4 py-2.5 font-medium">Отправлено</th>
                  <th className="px-4 py-2.5 font-medium">Сконвертировано</th>
                  <th className="px-4 py-2.5 font-medium">Конверсия</th>
                  <th className="px-4 py-2.5 font-medium">Последнее</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.event_type} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{s.event_type}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{s.total}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{s.converted}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--bg)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${Math.min(s.conversion_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {s.conversion_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                      {s.last_occurred_at ? formatDateTime(s.last_occurred_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
