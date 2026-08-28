import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Pencil, Plus, X } from "lucide-react";
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

// Шаблонов немного (десятки, не тысячи) — проще забрать всё разом и группировать
// на фронте, чем городить пагинацию с разбивкой по разделам.
const FETCH_LIMIT = 200;

// Раздел бота определяется по паттерну в key — эвристика, не хранится в БД.
// Новые ключи, которые не подошли ни под один паттерн, попадают в "Прочее" —
// это не ошибка, просто пока не размечено.
const CATEGORY_RULES: { label: string; test: (key: string) => boolean }[] = [
  { label: "Кнопки", test: (k) => k.includes("BUTTON") },
  { label: "Реферальная программа", test: (k) => k.includes("REFERRAL") },
  { label: "Автосписание", test: (k) => k.includes("AUTOPAY") || k.includes("RECURRENT") },
  {
    label: "Уведомления об окончании подписки",
    test: (k) => k.startsWith("NOTIFY_") || k === "RENEW",
  },
  {
    label: "Тарифы и оплата",
    test: (k) =>
      k.includes("TARIFF") || k.includes("PRICE") || k.includes("PAYMENT") || k.includes("INVOICE"),
  },
  {
    label: "Установка и устройства",
    test: (k) =>
      k.includes("INSTALL") ||
      k.includes("DEVICE") ||
      ["ANDROID", "IOS", "WINDOWS", "MACOS"].some((d) => k.includes(d)),
  },
  { label: "Профиль и ключ", test: (k) => k.includes("PROFILE") || k === "YOUR_KEY" },
  {
    label: "Приветствие и системные",
    test: (k) => k.includes("WELCOME") || k === "TECHNICAL_WORK_MESSAGE" || k === "SOMETHING_WRONG",
  },
  {
    label: "Поддержка и вопросы",
    test: (k) =>
      k.includes("QUESTION") ||
      k.includes("ANSWER") ||
      k.includes("SUPPORT") ||
      k.includes("BLOCK_ADULT") ||
      k.includes("WL_"),
  },
];

function categoryOf(key: string): string {
  return CATEGORY_RULES.find((rule) => rule.test(key))?.label ?? "Прочее";
}

const CATEGORY_ORDER = [...CATEGORY_RULES.map((r) => r.label), "Прочее"];

export function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statsByEventType, setStatsByEventType] = useState<Record<string, EventTypeStats>>({});
  const [templateTypes, setTemplateTypes] = useState<TemplateTypeItem[]>([]);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function loadTypes() {
    apiFetch<TemplateTypeItem[]>("/api/template-types").then(setTemplateTypes);
  }

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<TemplateListResponse>(`/api/templates?limit=${FETCH_LIMIT}&offset=0`),
      apiFetch<EventTypeStats[]>("/api/events/stats"),
    ])
      .then(([templatesRes, statsRes]) => {
        setTemplates(templatesRes.items);
        setStatsByEventType(Object.fromEntries(statsRes.map((s) => [s.event_type, s])));
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);
  useEffect(loadTypes, []);

  const typeLabel = (key: string) => templateTypes.find((t) => t.key === key)?.label ?? key;

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? templates.filter(
          (t) =>
            t.key.toLowerCase().includes(query) ||
            t.title.toLowerCase().includes(query) ||
            t.text.toLowerCase().includes(query),
        )
      : templates;

    const byCategory = new Map<string, MessageTemplate[]>();
    for (const t of filtered) {
      const category = categoryOf(t.key);
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(t);
    }

    return CATEGORY_ORDER.map((label) => ({ label, items: byCategory.get(label) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [templates, search]);

  const totalShown = grouped.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <>
      <Topbar
        title="Шаблоны сообщений"
        subtitle="Все сообщения бота, включая дефолтные — редактируются здесь"
      />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ключу, названию или тексту..."
            className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Новый шаблон
          </button>
        </div>

        {!loading && totalShown === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
            {search ? "Ничего не найдено по запросу" : "Шаблонов пока нет"}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {grouped.map((group) => {
            const isCollapsed = collapsed.has(group.label);
            return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="mb-2 flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  strokeWidth={2.5}
                />
                {group.label}
                <span className="font-normal normal-case text-[var(--text-muted)]/70">
                  {group.items.length}
                </span>
              </button>
              {!isCollapsed && (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
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
                    {group.items.map((t) => {
                      // Бот шлёт событие с event_type = key шаблона; явное поле "Событие"
                      // на шаблоне — необязательный override для случаев, когда ключ и
                      // событие называются по-разному (например, кастомные фидбек-кампании).
                      const stats = statsByEventType[t.event_type || t.key];
                      return (
                        <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
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
                                {stats.converted > 0 &&
                                  ` · ${stats.converted} исп. (${stats.conversion_rate}%)`}
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
                  </tbody>
                </table>
              </div>
              )}
            </div>
            );
          })}
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
