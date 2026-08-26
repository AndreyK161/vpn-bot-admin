import { NavLink, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, LogOut, MessageSquare, Shield, Zap } from "lucide-react";
import { useAuth } from "../lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/messages", label: "Сообщения", icon: MessageSquare },
  { to: "/templates", label: "Шаблоны", icon: FileText },
  { to: "/events", label: "События", icon: Zap },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-[var(--sidebar-bg)] px-3 py-4">
      <div className="flex items-center gap-2 px-2 pb-6 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
          <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">VPN Admin</p>
          <p className="text-[11px] text-[var(--sidebar-text)]">панель управления</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-[var(--sidebar-text-active)]"
                  : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-[var(--sidebar-border)] px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">
            {user?.full_name ?? "Администратор"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--sidebar-text)]">
            {user?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Выйти"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--sidebar-text)] transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
