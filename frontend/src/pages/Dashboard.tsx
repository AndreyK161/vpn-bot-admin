import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Siren, Zap } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { StatCard } from "../components/StatCard";
import { apiFetch } from "../lib/api";
import type { EventTypeStats, TemplateListResponse } from "../lib/types";

export function Dashboard() {
  const [eventStats, setEventStats] = useState<EventTypeStats[]>([]);
  const [templates, setTemplates] = useState<TemplateListResponse["items"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<EventTypeStats[]>("/api/events/stats"),
      apiFetch<TemplateListResponse>("/api/templates?limit=200"),
    ])
      .then(([events, templatesList]) => {
        setEventStats(events);
        setTemplates(templatesList.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalEvents = eventStats.reduce((sum, s) => sum + s.total, 0);
  const totalConverted = eventStats.reduce((sum, s) => sum + s.converted, 0);
  const overallConversion = totalEvents > 0 ? Math.round((totalConverted / totalEvents) * 100) : null;
  const activeTemplates = templates.filter((t) => t.is_active).length;
  const alertTemplates = templates.filter((t) => t.template_type === "alert");

  const statsByEventType = Object.fromEntries(eventStats.map((s) => [s.event_type, s]));

  return (
    <>
      <Topbar title="Дашборд" subtitle="Сводка по шаблонам и событиям бота" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Событий зафиксировано"
            value={loading ? "…" : String(totalEvents)}
            icon={Zap}
          />
          <StatCard
            label="Активных шаблонов"
            value={loading ? "…" : String(activeTemplates)}
            icon={FileText}
          />
          <StatCard
            label="Alert-шаблонов"
            value={loading ? "…" : String(alertTemplates.length)}
            icon={Siren}
          />
          <StatCard
            label="Конверсия по событиям"
            value={loading ? "…" : overallConversion === null ? "—" : `${overallConversion}%`}
            delta={overallConversion === null ? "нет событий" : undefined}
            icon={Zap}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Alert-шаблоны</h2>
              <Link to="/templates" className="text-xs font-medium text-[var(--accent)]">
                Все шаблоны →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-[var(--border)]">
              {alertTemplates.length > 0 ? (
                alertTemplates.map((t) => {
                  const stats = t.event_type ? statsByEventType[t.event_type] : undefined;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-[var(--text)]">{t.title}</p>
                        <p className="font-mono text-xs text-[var(--text-muted)]">{t.key}</p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">
                        {stats ? `${stats.total} отправлено · ${stats.conversion_rate}%` : "нет данных"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
                  {loading ? "Загрузка..." : "Alert-шаблонов пока нет"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Конверсия по событиям</h2>
              <Link to="/events" className="text-xs font-medium text-[var(--accent)]">
                Все →
              </Link>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {eventStats.length > 0 ? (
                eventStats.map((s) => (
                  <div key={s.event_type}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-[var(--text)]">{s.event_type}</span>
                      <span className="shrink-0 font-medium text-[var(--text-muted)]">
                        {s.converted}/{s.total}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.min(s.conversion_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
                  {loading ? "Загрузка..." : "Событий пока нет"}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
