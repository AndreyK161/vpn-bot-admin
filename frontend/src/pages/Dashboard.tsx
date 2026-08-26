import { Activity, Server, Users, Wallet } from "lucide-react";
import { Topbar } from "../components/Topbar";
import { StatCard } from "../components/StatCard";

export function Dashboard() {
  return (
    <>
      <Topbar title="Дашборд" subtitle="Обзор состояния сервиса" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Активные пользователи" value="—" delta="нет данных" icon={Users} />
          <StatCard label="Серверы онлайн" value="—" delta="нет данных" icon={Server} />
          <StatCard label="Доход за месяц" value="—" delta="нет данных" icon={Wallet} />
          <StatCard label="Нагрузка" value="—" delta="нет данных" icon={Activity} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Активность</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Здесь будет график активности пользователей и трафика.
            </p>
            <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
              График появится после подключения бэкенда
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--text)]">Последние события</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Лог последних действий в системе.
            </p>
            <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
              Пока пусто
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
