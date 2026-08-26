import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, MessageSquare, Zap } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { StatCard } from "../components/StatCard";
import { apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type {
  EventTypeStats,
  MessageListResponse,
  TemplateListResponse,
} from "../lib/types";

export function Dashboard() {
  const [recentMessages, setRecentMessages] = useState<MessageListResponse | null>(null);
  const [eventStats, setEventStats] = useState<EventTypeStats[]>([]);
  const [templates, setTemplates] = useState<TemplateListResponse["items"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<MessageListResponse>("/api/messages?limit=5"),
      apiFetch<EventTypeStats[]>("/api/events/stats"),
      apiFetch<TemplateListResponse>("/api/templates?limit=200"),
    ])
      .then(([messages, events, templatesList]) => {
        setRecentMessages(messages);
        setEventStats(events);
        setTemplates(templatesList.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalEvents = eventStats.reduce((sum, s) => sum + s.total, 0);
  const totalConverted = eventStats.reduce((sum, s) => sum + s.converted, 0);
  const overallConversion = totalEvents > 0 ? Math.round((totalConverted / totalEvents) * 100) : null;
  const activeTemplates = templates.filter((t) => t.is_active).length;

  return (
    <>
      <Topbar title="Дашборд" subtitle="Сводка по сообщениям и событиям бота" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Сообщений отправлено"
            value={loading ? "…" : String(recentMessages?.total ?? 0)}
            icon={MessageSquare}
          />
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
            label="Конверсия по событиям"
            value={loading ? "…" : overallConversion === null ? "—" : `${overallConversion}%`}
            delta={overallConversion === null ? "нет событий" : undefined}
            icon={Zap}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Последние сообщения</h2>
              <Link to="/messages" className="text-xs font-medium text-[var(--accent)]">
                Все сообщения →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-[var(--border)]">
              {recentMessages && recentMessages.items.length > 0 ? (
                recentMessages.items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-[var(--text)]">{m.text}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {m.username ? `@${m.username}` : m.telegram_user_id} · {formatDateTime(m.sent_at)}
                      </p>
                    </div>
                    {m.event_type && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        {m.event_type}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
                  {loading ? "Загрузка..." : "Сообщений пока нет"}
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
