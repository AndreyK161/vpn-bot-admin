import { useAuth } from "../lib/auth";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const initial = (user?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-[var(--text)]">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>

      <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-center text-sm font-semibold leading-8 text-[var(--accent)]">
        {initial}
      </div>
    </header>
  );
}
