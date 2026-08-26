import { useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import { apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { EventTypeStats } from "../lib/types";

export function Events() {
  const [stats, setStats] = useState<EventTypeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<EventTypeStats[]>("/api/events/stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar
        title="События"
        subtitle="Конверсия по сценариям бота — например, скидка при окончании подписки"
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {!loading && stats.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
            Событий пока нет — бот ещё не отправил ни одного через /api/ingest/events
          </div>
        )}

        {stats.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
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
