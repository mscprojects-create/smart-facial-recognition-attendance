import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { ScanFace, GraduationCap, Shield, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("admin");       // 'admin' | 'student'
  const [mode, setMode] = useState("signin");       // 'signin' | 'signup'  (signup = admin only)
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (role === "student") {
        data = await api.studentSignin({ roll_number: form.roll_number, email: form.email });
      } else if (mode === "signup") {
        data = await api.adminSignup(form);
      } else {
        data = await api.adminSignin({ email: form.email, password: form.password });
      }
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/student", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ------------------------- Left brand panel ------------------------- */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-grad grid place-items-center shadow-glow">
            <ScanFace className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-white">FaceTrack</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-extrabold text-white leading-tight">
            Attendance, <span className="text-brand-300">recognised</span> in a glance.
          </h1>
          <p className="mt-4 text-slate-400">
            Replace manual roll calls with biometric facial recognition. Register
            students once, then mark a whole class present in seconds.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[["<2s", "per mark"], ["5", "photos / student"], ["99%", "less paperwork"]].map(
              ([a, b]) => (
                <div key={b} className="glass rounded-xl py-4">
                  <p className="font-display text-2xl font-bold text-white">{a}</p>
                  <p className="text-xs text-slate-400">{b}</p>
                </div>
              )
            )}
          </div>
        </div>
        <p className="text-xs text-slate-600">M.Sc. Computer Science · Project Demo</p>
      </div>

      {/* ----------------------------- Form ------------------------------- */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md glass rounded-2xl p-8 animate-fade-up">
          {/* role switch */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ink-700/60 mb-6">
            {[
              ["admin", "Admin / Professor", Shield],
              ["student", "Student", GraduationCap],
            ].map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => {
                  setRole(val);
                  setMode("signin");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                  role === val ? "bg-brand-grad text-white shadow-glow" : "text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-white">
            {role === "student"
              ? "Student Sign In"
              : mode === "signup"
              ? "Create Admin Account"
              : "Admin Sign In"}
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {role === "student"
              ? "Use the Roll Number & Email your professor assigned you."
              : mode === "signup"
              ? "Professors can self-register here."
              : "Welcome back, professor."}
          </p>

          {error && (
            <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {role === "admin" && mode === "signup" && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" required onChange={set("full_name")} placeholder="Prof. Jane Doe" />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" onChange={set("department")} placeholder="Computer Science" />
                </div>
              </>
            )}

            {role === "student" ? (
              <div>
                <label className="label">Roll Number</label>
                <input className="input" required onChange={set("roll_number")} placeholder="MSC23-001" />
              </div>
            ) : null}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                onChange={set("email")}
                placeholder={role === "student" ? "you@univ.edu" : "professor@univ.edu"}
              />
            </div>

            {role === "admin" && (
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" required onChange={set("password")} placeholder="••••••••" />
              </div>
            )}

            <button className="btn-primary w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {role === "student" ? "Sign In" : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>

          {role === "admin" && (
            <p className="text-sm text-slate-400 mt-5 text-center">
              {mode === "signin" ? "New professor?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                }}
                className="text-brand-300 font-medium hover:underline"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
          {role === "student" && (
            <p className="text-xs text-slate-500 mt-5 text-center">
              Students cannot self-register. Contact your professor for credentials.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
