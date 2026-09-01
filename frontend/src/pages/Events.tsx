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

// Только эти события — реальные проактивные предложения купить, у остальных
// (фидбек по триалу, факт оплаты/ошибки и т.д.) конверсии в принципе не бывает —
// это просто счётчики "сколько раз отправили", не воронка.
const CONVERSION_EVENT_TYPES = new Set([
  "subscription-expired",
  "3-days-left",
  "1-day-left",
  "nc-yesterday-created",
]);

function ConversionRow({ s }: { s: EventTypeStats }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
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
  );
}

function CountRow({ s }: { s: EventTypeStats }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="px-4 py-3 font-medium text-[var(--text)]">{s.event_type}</td>
      <td className="px-4 py-3 text-[var(--text)]">{s.total}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
        {s.last_occurred_at ? formatDateTime(s.last_occurred_at) : "—"}
      </td>
    </tr>
  );
}

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

  const conversionStats = stats.filter((s) => CONVERSION_EVENT_TYPES.has(s.event_type));
  const countStats = stats.filter((s) => !CONVERSION_EVENT_TYPES.has(s.event_type));

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

        {conversionStats.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Предложения купить — воронка "отправили → купил"
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-4 py-2.5 font-medium">Событие</th>
                    <th className="px-4 py-2.5 font-medium">Отправлено</th>
                    <th className="px-4 py-2.5 font-medium">Купили</th>
                    <th className="px-4 py-2.5 font-medium">Конверсия</th>
                    <th className="px-4 py-2.5 font-medium">Последнее</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionStats.map((s) => (
                    <ConversionRow key={s.event_type} s={s} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {countStats.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Прочая статистика — просто счётчики отправок, без конверсии
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-4 py-2.5 font-medium">Событие</th>
                    <th className="px-4 py-2.5 font-medium">Отправлено</th>
                    <th className="px-4 py-2.5 font-medium">Последнее</th>
                  </tr>
                </thead>
                <tbody>
                  {countStats.map((s) => (
                    <CountRow key={s.event_type} s={s} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
