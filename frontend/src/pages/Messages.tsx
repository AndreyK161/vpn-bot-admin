import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { MessageListResponse } from "../lib/types";

const PAGE_SIZE = 20;

export function Messages() {
  const [items, setItems] = useState<MessageListResponse["items"]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    apiFetch<MessageListResponse>(`/api/messages?${params}`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [offset, search]);

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  return (
    <>
      <Topbar title="Сообщения" subtitle="Лог всех сообщений, отправленных ботом" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setOffset(0);
                setSearch(e.target.value);
              }}
              placeholder="Поиск по тексту сообщения..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-8 pr-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Время</th>
                <th className="px-4 py-2.5 font-medium">Пользователь</th>
                <th className="px-4 py-2.5 font-medium">Событие</th>
                <th className="px-4 py-2.5 font-medium">Текст</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--text-muted)]">
                    {formatDateTime(m.sent_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--text)]">
                    {m.username ? `@${m.username}` : m.telegram_user_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {m.event_type ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        {m.event_type}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="max-w-md truncate px-4 py-2.5 text-[var(--text)]" title={m.text}>
                    {m.text}
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Сообщений пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {total > 0 ? `${from}–${to} из ${total}` : loading ? "Загрузка..." : "0 из 0"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-medium text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
