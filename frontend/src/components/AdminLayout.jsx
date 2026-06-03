import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  UserPlus,
  ScanFace,
  BarChart3,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const nav = [
  { to: "/admin", end: true, label: "Student Registration", icon: UserPlus },
  { to: "/admin/scanner", label: "Live Scanner", icon: ScanFace },
  { to: "/admin/analytics", label: "Attendance Analytics", icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* ----------------------------- Sidebar ----------------------------- */}
      {/* flex-col so the Logout button can be pinned to the very bottom-left */}
      <aside className="w-72 shrink-0 glass m-3 rounded-2xl flex flex-col">
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-grad grid place-items-center shadow-glow">
            <ScanFace className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white leading-tight">FaceTrack</p>
            <p className="text-xs text-slate-400">Admin Console</p>
          </div>
        </div>

        <nav className="px-3 space-y-1 mt-2">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600/20 text-white border border-brand-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* spacer pushes the footer down */}
        <div className="flex-1" />

        <div className="px-4 pb-3">
          <div className="glass rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* LOGOUT - pinned to the very left bottom corner of the sidebar */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                       text-danger hover:bg-danger/10 border border-danger/20 transition"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ----------------------------- Content ----------------------------- */}
      <main className="flex-1 p-3 pl-0">
        <div className="glass rounded-2xl min-h-[calc(100vh-1.5rem)] p-6 md:p-8 animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
