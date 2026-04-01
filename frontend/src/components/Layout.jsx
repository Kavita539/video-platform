import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", icon: "▦", label: "Dashboard" },
  { to: "/upload", icon: "⬆", label: "Upload" },
  { to: "/library", icon: "▤", label: "Library" },
];

const ADMIN_NAV = [{ to: "/users", icon: "◎", label: "Users" }];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const canUpload = user?.role === "editor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const visibleNav = NAV.filter((n) => n.to !== "/upload" || canUpload);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-screen">
      <aside className="surface border-t md:border-t-0 md:border-r border flex flex-row md:flex-col fixed md:sticky bottom-0 md:top-0 left-0 right-0 md:h-screen z-[100] md:z-auto overflow-y-auto">
        <div className="hidden md:flex items-center gap-[10px] p-[24px_20px_20px] border-bottom border">
          <span className="text-[1.2rem] accent leading-none">
            ▶
          </span>
          <span className="font-[var(--font-display)] text-[0.95rem] font-extrabold tracking-[0.14em] primary">
            VAULTCAST
          </span>
        </div>

        <nav className="flex-1 flex flex-row md:flex-col gap-[2px] p-2 md:p-[16px_12px]">
          {visibleNav.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-[10px] p-[9px_12px] rounded-[var(--radius-sm)] text-[0.78rem] font-medium tracking-[0.06em] uppercase transition-all duration-[var(--transition)] 
                ${
                  isActive
                    ? "accent bg-[var(--accent-glow)]"
                    : "secondary hover:primary hover:raised"
                }`
              }
            >
              <span className="text-[0.85rem] w-4 text-center">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="w-[1px] md:w-auto h-auto md:h-[1px] border m-[4px_0] md:m-[8px_0]" />

              {ADMIN_NAV.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-[10px] p-[9px_12px] rounded-[var(--radius-sm)] text-[0.78rem] font-medium tracking-[0.06em] uppercase transition-all duration-[var(--transition)] 
                    ${
                      isActive
                        ? "accent bg-[var(--accent-glow)]"
                        : "secondary hover:primary hover:raised"
                    }`
                  }
                >
                  <span className="text-[0.85rem] w-4 text-center">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer - Hidden on Mobile */}
        <div className="hidden md:flex p-[16px_12px] border-top border items-center gap-2">
          <div className="flex-1 flex items-center gap-[10px] min-w-0 overflow-hidden">
            <div className="w-[30px] h-[30px] rounded-[var(--radius-sm)] bg-[var(--accent-dim)] accent font-[var(--font-display)] font-bold text-[0.8rem] flex items-center justify-center flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex flex-col gap-[1px] min-w-0 overflow-hidden">
              <span className="text-[0.78rem] font-semibold primary whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.name}
              </span>
              <span className="text-[0.65rem] muted tracking-[0.06em] uppercase">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            className="bg-transparent border-none muted text-[1rem] p-[6px] rounded-[var(--radius-sm)] transition-colors duration-[var(--transition)] flex-shrink-0 hover:danger hover:bg-[var(--danger-glow)]"
            onClick={handleLogout}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </aside>

      <main className="min-h-screen overflow-y-auto pb-[72px] md:pb-0">
        {children}
      </main>
    </div>
  );
}
