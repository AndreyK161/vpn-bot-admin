import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { ApiError, apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { MessageTemplate, TemplateInput, TemplateListResponse } from "../lib/types";

const EMPTY_FORM: TemplateInput = {
  key: "",
  title: "",
  text: "",
  event_type: null,
  is_active: true,
};

const PAGE_SIZE = 20;

export function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<TemplateListResponse>(`/api/templates?limit=${PAGE_SIZE}&offset=${offset}`)
      .then((res) => {
        setTemplates(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [offset]);

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  return (
    <>
      <Topbar
        title="Шаблоны сообщений"
        subtitle="Все сообщения бота, включая дефолтные — редактируются здесь"
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Новый шаблон
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Название</th>
                <th className="px-4 py-2.5 font-medium">Событие</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
                <th className="px-4 py-2.5 font-medium">Обновлён</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-[var(--text)]">
                    {t.key}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text)]">{t.title}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {t.event_type ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        {t.event_type}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span
                      className={
                        t.is_active
                          ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[var(--success)]"
                          : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-[var(--danger)]"
                      }
                    >
                      {t.is_active ? "активен" : "отключён"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[var(--text-muted)]">
                    {formatDateTime(t.updated_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Шаблонов пока нет — добавь дефолтные сообщения бота вручную
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

      {creating && (
        <TemplateModal
          title="Новый шаблон"
          initial={EMPTY_FORM}
          allowKeyEdit
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <TemplateModal
          title={`Редактировать: ${editing.key}`}
          initial={{
            key: editing.key,
            title: editing.title,
            text: editing.text,
            event_type: editing.event_type,
            is_active: editing.is_active,
          }}
          templateId={editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function TemplateModal({
  title,
  initial,
  templateId,
  allowKeyEdit = false,
  onClose,
  onSaved,
}: {
  title: string;
  initial: TemplateInput;
  templateId?: number;
  allowKeyEdit?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TemplateInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (templateId) {
        await apiFetch(`/api/templates/${templateId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: form.title,
            text: form.text,
            event_type: form.event_type || null,
            is_active: form.is_active,
          }),
        });
      } else {
        await apiFetch("/api/templates", {
          method: "POST",
          body: JSON.stringify({ ...form, event_type: form.event_type || null }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить шаблон");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text)]">
              Key {!allowKeyEdit && <span className="text-[var(--text-muted)]">(нельзя изменить)</span>}
            </label>
            <input
              type="text"
              required
              disabled={!allowKeyEdit}
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="trial_feedback"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text)]">Название</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Фидбек на триале"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text)]">
              Тип события <span className="text-[var(--text-muted)]">(необязательно)</span>
            </label>
            <input
              type="text"
              value={form.event_type ?? ""}
              onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              placeholder="subscription_expired_discount_offered"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text)]">Текст сообщения</label>
            <textarea
              required
              rows={6}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
            />
            Активен
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-[var(--danger)]">
              {error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)]"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
