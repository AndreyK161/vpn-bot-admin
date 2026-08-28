import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { ApiError, apiFetch } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type {
  EventTypeStats,
  MessageTemplate,
  TemplateInput,
  TemplateListResponse,
  TemplateTypeItem,
} from "../lib/types";

const EMPTY_FORM: TemplateInput = {
  key: "",
  title: "",
  text: "",
  event_type: null,
  template_type: "regular",
  is_active: true,
};

const PAGE_SIZE = 20;

export function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsByEventType, setStatsByEventType] = useState<Record<string, EventTypeStats>>({});
  const [templateTypes, setTemplateTypes] = useState<TemplateTypeItem[]>([]);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  function loadTypes() {
    apiFetch<TemplateTypeItem[]>("/api/template-types").then(setTemplateTypes);
  }

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<TemplateListResponse>(`/api/templates?limit=${PAGE_SIZE}&offset=${offset}`),
      apiFetch<EventTypeStats[]>("/api/events/stats"),
    ])
      .then(([templatesRes, statsRes]) => {
        setTemplates(templatesRes.items);
        setTotal(templatesRes.total);
        setStatsByEventType(Object.fromEntries(statsRes.map((s) => [s.event_type, s])));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [offset]);
  useEffect(loadTypes, []);

  const typeLabel = (key: string) => templateTypes.find((t) => t.key === key)?.label ?? key;

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

        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Название</th>
                <th className="px-4 py-2.5 font-medium">Тип</th>
                <th className="px-4 py-2.5 font-medium">Событие</th>
                <th className="px-4 py-2.5 font-medium">Статистика</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
                <th className="px-4 py-2.5 font-medium">Обновлён</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                // Бот шлёт событие с event_type = key шаблона; явное поле "Событие"
                // на шаблоне — необязательный override для случаев, когда ключ и
                // событие называются по-разному (например, кастомные фидбек-кампании).
                const stats = statsByEventType[t.event_type || t.key];
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-[var(--text)]">
                      {t.key}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text)]">{t.title}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={
                          t.template_type === "alert"
                            ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-[var(--danger)]"
                            : "rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]"
                        }
                      >
                        {typeLabel(t.template_type)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {t.event_type ? (
                        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                          {t.event_type}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                      {stats ? (
                        <span className="text-[var(--text)]">
                          {stats.total} отправлено
                          {stats.converted > 0 && ` · ${stats.converted} исп. (${stats.conversion_rate}%)`}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
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
                );
              })}

              {!loading && templates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
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
          templateTypes={templateTypes}
          onTypesChanged={loadTypes}
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
            template_type: editing.template_type,
            is_active: editing.is_active,
          }}
          templateTypes={templateTypes}
          onTypesChanged={loadTypes}
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

const NEW_TYPE_OPTION = "__new__";

function TemplateModal({
  title,
  initial,
  templateId,
  templateTypes,
  onTypesChanged,
  allowKeyEdit = false,
  onClose,
  onSaved,
}: {
  title: string;
  initial: TemplateInput;
  templateId?: number;
  templateTypes: TemplateTypeItem[];
  onTypesChanged: () => void;
  allowKeyEdit?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TemplateInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [addingType, setAddingType] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeError, setNewTypeError] = useState<string | null>(null);

  async function handleCreateType() {
    setNewTypeError(null);
    try {
      const created = await apiFetch<TemplateTypeItem>("/api/template-types", {
        method: "POST",
        body: JSON.stringify({ key: newTypeKey.trim(), label: newTypeLabel.trim() }),
      });
      onTypesChanged();
      setForm({ ...form, template_type: created.key });
      setAddingType(false);
      setNewTypeKey("");
      setNewTypeLabel("");
    } catch (err) {
      setNewTypeError(err instanceof ApiError ? err.message : "Не удалось создать тип");
    }
  }

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
            template_type: form.template_type,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] max-h-full">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
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
            <label className="text-xs font-medium text-[var(--text)]">Тип шаблона</label>
            <select
              value={form.template_type}
              onChange={(e) => {
                if (e.target.value === NEW_TYPE_OPTION) {
                  setAddingType(true);
                  return;
                }
                setForm({ ...form, template_type: e.target.value });
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              {templateTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
              <option value={NEW_TYPE_OPTION}>+ Новый тип...</option>
            </select>

            {addingType && (
              <div className="mt-1 flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                <input
                  type="text"
                  value={newTypeKey}
                  onChange={(e) => setNewTypeKey(e.target.value)}
                  placeholder="key (латиницей, напр. reminder)"
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
                <input
                  type="text"
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="Название (напр. Напоминание)"
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
                {newTypeError && (
                  <p className="text-xs font-medium text-[var(--danger)]">{newTypeError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingType(false)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-muted)]"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateType}
                    disabled={!newTypeKey.trim() || !newTypeLabel.trim()}
                    className="rounded-lg bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Создать тип
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text)]">
              Тип события <span className="text-[var(--text-muted)]">(необязательно, для статистики)</span>
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
    </div>
  );
}
