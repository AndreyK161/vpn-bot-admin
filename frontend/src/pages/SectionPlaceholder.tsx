import type { LucideIcon } from "lucide-react";
import { Topbar } from "../components/Topbar";

export function SectionPlaceholder({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <>
      <Topbar title={title} subtitle="Раздел ещё не наполнен" />

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
            <Icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[var(--text)]">{title}</p>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">
            Контент этого раздела появится позже — сейчас это часть каркаса админки.
          </p>
        </div>
      </main>
    </>
  );
}
