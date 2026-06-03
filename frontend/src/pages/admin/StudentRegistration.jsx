import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import {
  UserPlus, Upload, X, Loader2, CheckCircle2, Image as ImageIcon,
} from "lucide-react";

export default function StudentRegistration() {
  const [form, setForm] = useState({ name: "", roll_number: "", email: "" });
  const [photos, setPhotos] = useState([]);      // File[]
  const [previews, setPreviews] = useState([]);  // object URLs
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);          // {type, text}

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const loadStudents = () => api.students().then(setStudents).catch(() => {});
  useEffect(() => { loadStudents(); }, []);

  // Downscale a picked image to a small JPEG so 5 photos stay well under the
  // serverless request-body limit (and keep the recogniser input consistent).
  function resizeImage(file, max = 512, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);
            const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
            resolve(new File([blob], name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Accumulate selections (so photos can be added one or several at a time),
  // cap at 5, and resize each before storing.
  async function onFiles(e) {
    setMsg(null);
    const picked = Array.from(e.target.files);
    e.target.value = ""; // allow re-selecting the same file later
    const room = 5 - photos.length;
    if (room <= 0) return;
    try {
      const resized = await Promise.all(picked.slice(0, room).map((f) => resizeImage(f)));
      const next = [...photos, ...resized].slice(0, 5);
      setPhotos(next);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
    } catch {
      setMsg({ type: "error", text: "Could not read one of the images. Try a different file." });
    }
  }
  function removePhoto(i) {
    setPhotos(photos.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (photos.length !== 5) {
      setMsg({ type: "error", text: `Please upload exactly 5 photos (you have ${photos.length}).` });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("roll_number", form.roll_number);
      fd.append("email", form.email);
      photos.forEach((p) => fd.append("photos", p));
      const data = await api.registerStudent(fd);
      setMsg({ type: "ok", text: data.message });
      setForm({ name: "", roll_number: "", email: "" });
      setPhotos([]); setPreviews([]);
      loadStudents();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Header
        icon={UserPlus}
        title="Student Registration"
        sub="Register a student and train the recogniser on 5 reference photos. Students cannot self-register."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="lg:col-span-3 glass rounded-2xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Name</label>
              <input className="input" required value={form.name} onChange={set("name")} placeholder="Salman Khan" />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input className="input" required value={form.roll_number} onChange={set("roll_number")} placeholder="MSC23-008" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={form.email} onChange={set("email")} placeholder="salman.khan@univ.edu" />
          </div>

          {/* Uploader */}
          <div>
            <label className="label">Face Photos (exactly 5)</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
              <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-brand-400/50 transition">
                <Upload className="h-7 w-7 mx-auto text-brand-300 mb-2" />
                <p className="text-sm text-slate-300">Click to add photos — select 5 at once, or a few at a time</p>
                <p className="text-xs text-slate-500 mt-1">JPG / PNG · front-facing, well-lit · auto-resized on upload</p>
              </div>
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} className="aspect-square object-cover rounded-xl border border-white/10" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-danger text-white grid place-items-center opacity-0 group-hover:opacity-100 transition">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {photos.length}/5 selected
            </p>
          </div>

          {msg && (
            <div className={`text-sm rounded-xl px-3 py-2 border ${
              msg.type === "ok"
                ? "text-success bg-success/10 border-success/20"
                : "text-danger bg-danger/10 border-danger/20"}`}>
              {msg.text}
            </div>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {busy ? "Training recogniser…" : "Register & Train"}
          </button>
        </form>

        {/* Roster */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="font-display font-bold text-white mb-4">Registered Students</h3>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {students.length === 0 && <p className="text-sm text-slate-500">No students yet.</p>}
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-700/50 border border-white/5">
                <div className="h-9 w-9 rounded-lg bg-brand-500/15 grid place-items-center text-brand-300">
                  <ImageIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{s.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{s.roll_number} · {s.email}</p>
                </div>
                <span className={`badge ${s.is_trained ? "bg-success/15 text-success" : "bg-amber-400/15 text-amber-300"}`}>
                  {s.is_trained ? `${s.photo_count}/5` : "untrained"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="h-12 w-12 rounded-xl bg-brand-grad grid place-items-center shadow-glow shrink-0">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">{sub}</p>
      </div>
    </div>
  );
}
