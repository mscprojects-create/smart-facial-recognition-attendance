import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  LogOut, ScanFace, CheckCircle2, XCircle, CalendarDays, TrendingUp,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.studentHistory(user.roll_number)
      .then((d) => setLogs(d.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [user.roll_number]);

  // Map date-string -> status for fast calendar lookup
  const byDate = useMemo(() => {
    const m = {};
    logs.forEach((l) => { m[l.attendance_date] = l.status; });
    return m;
  }, [logs]);

  const present = logs.filter((l) => l.status === "present").length;
  const absent = logs.filter((l) => l.status === "absent").length;
  const pct = logs.length ? Math.round((present / logs.length) * 100) : 0;

  const handleLogout = () => { logout(); navigate("/auth", { replace: true }); };

  // ---- build the month grid ----
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pieData = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-grad grid place-items-center shadow-glow">
            <ScanFace className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white">Hi, {user.full_name.split(" ")[0]} 👋</p>
            <p className="text-sm text-slate-400">{user.roll_number} · {user.email}</p>
          </div>
        </div>
        <span className="badge bg-success/15 text-success">
          <TrendingUp className="h-3.5 w-3.5" /> {pct}% attendance
        </span>
      </header>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={CheckCircle2} tone="success" label="Days Present" value={present} />
        <Stat icon={XCircle} tone="danger" label="Days Absent" value={absent} />
        <Stat icon={CalendarDays} tone="brand" label="Total Sessions" value={logs.length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar visualiser */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">
              {MONTHS[month]} {year}
            </h3>
            <div className="flex gap-2">
              <button className="btn-ghost px-3 py-1.5" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
              <button className="btn-ghost px-3 py-1.5" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const status = byDate[ds];
              const cls =
                status === "present" ? "bg-success/20 text-success border-success/30"
                : status === "absent" ? "bg-danger/20 text-danger border-danger/30"
                : "bg-ink-700/50 text-slate-500 border-white/5";
              return (
                <div key={i}
                  title={status ? `${ds}: ${status}` : ds}
                  className={`aspect-square rounded-lg border grid place-items-center text-sm font-medium ${cls}`}>
                  {d}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-5 text-xs text-slate-400">
            <Legend2 cls="bg-success/30 border-success/40" label="Present" />
            <Legend2 cls="bg-danger/30 border-danger/40" label="Absent" />
            <Legend2 cls="bg-ink-700 border-white/10" label="No session" />
          </div>
        </div>

        {/* Donut */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-bold text-white mb-2">Overall Split</h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  <Cell fill="#34d399" />
                  <Cell fill="#fb7185" />
                </Pie>
                <Tooltip contentStyle={{ background:"#11162a", border:"1px solid #273150", borderRadius:12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          <p className="text-center text-sm text-slate-400 mt-2">
            {present}/{logs.length} sessions attended
          </p>
        </div>
      </div>

      {/* LOGOUT - pinned to the very left bottom corner of the screen */}
      <button
        onClick={handleLogout}
        className="fixed left-4 bottom-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl
                   text-sm font-semibold text-danger bg-ink-800/90 backdrop-blur
                   border border-danger/30 hover:bg-danger/10 shadow-card transition"
      >
        <LogOut className="h-4.5 w-4.5" /> Logout
      </button>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    success: "text-success bg-success/15",
    danger: "text-danger bg-danger/15",
    brand: "text-brand-300 bg-brand-500/15",
  };
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function Legend2({ cls, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${cls}`} /> {label}
    </span>
  );
}
