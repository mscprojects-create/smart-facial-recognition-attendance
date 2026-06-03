import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BarChart3, CalendarDays, CalendarRange } from "lucide-react";

export default function Analytics() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const [tab, setTab] = useState("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => { api.daily(date).then(setDaily).catch(() => setDaily([])); }, [date]);
  useEffect(() => { api.monthly(month).then(setMonthly).catch(() => setMonthly([])); }, [month]);

  // Monthly compilation: present-count per student
  const compiled = useMemo(() => {
    const map = {};
    monthly.forEach((r) => {
      const k = r.roll_number;
      map[k] = map[k] || { name: r.student_name, roll: k, present: 0, absent: 0 };
      map[k][r.status] += 1;
    });
    return Object.values(map).sort((a, b) => b.present - a.present);
  }, [monthly]);

  const chartData = compiled.map((c) => ({
    name: c.roll.replace("MSC23-", "#"),
    Present: c.present,
    Absent: c.absent,
  }));

  return (
    <div>
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-brand-grad grid place-items-center shadow-glow shrink-0">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Attendance Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">Daily reports and monthly compilation sheets.</p>
        </div>
      </div>

      {/* tabs */}
      <div className="inline-flex gap-1 p-1 rounded-xl bg-ink-700/60 mb-6">
        <TabBtn active={tab === "daily"} onClick={() => setTab("daily")} icon={CalendarDays} label="Daily Report" />
        <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")} icon={CalendarRange} label="Monthly Sheet" />
      </div>

      {tab === "daily" ? (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">Daily Attendance</h3>
            <input type="date" className="input max-w-[12rem]" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Table
            head={["Student", "Roll", "Course", "Status", "Confidence", "Marked At"]}
            rows={daily.map((r) => [
              r.student_name, r.roll_number, r.course_code,
              <StatusPill key="s" s={r.status} />,
              r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : "—",
              new Date(r.marked_at).toLocaleTimeString(),
            ])}
            empty="No attendance recorded on this date."
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white">Present vs Absent — {month}</h3>
              <input type="month" className="input max-w-[12rem]" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#273150" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background:"#11162a", border:"1px solid #273150", borderRadius:12 }} />
                <Bar dataKey="Present" fill="#34d399" radius={[6,6,0,0]} />
                <Bar dataKey="Absent" fill="#fb7185" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold text-white mb-4">Compilation Sheet</h3>
            <Table
              head={["Student", "Roll", "Present", "Absent", "%"]}
              rows={compiled.map((c) => {
                const total = c.present + c.absent;
                const pct = total ? Math.round((c.present / total) * 100) : 0;
                return [c.name, c.roll, c.present, c.absent, `${pct}%`];
              })}
              empty="No records this month."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-brand-grad text-white shadow-glow" : "text-slate-400 hover:text-white"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function StatusPill({ s }) {
  return (
    <span className={`badge ${s === "present" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
      {s}
    </span>
  );
}

function Table({ head, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-white/5">
            {head.map((h) => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="py-6 text-center text-slate-500">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {r.map((cell, j) => <td key={j} className="py-3 pr-4 text-slate-200">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
