import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import {
  ScanFace, Camera, CameraOff, Loader2, CheckCircle2,
  AlertTriangle, Ban, Clock,
} from "lucide-react";

// Visual treatment for each backend outcome.
const OUTCOME = {
  present:  { icon: CheckCircle2, cls: "text-success border-success/30 bg-success/10" },
  already:  { icon: Clock,        cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  unknown:  { icon: Ban,          cls: "text-danger border-danger/30 bg-danger/10" },
  no_face:  { icon: AlertTriangle,cls: "text-slate-300 border-white/10 bg-white/5" },
};

export default function LiveScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [camOn, setCamOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [feed, setFeed] = useState([]); // running list of marks

  useEffect(() => {
    api.courses().then((c) => { setCourses(c); if (c[0]) setCourseId(c[0].id); }).catch(() => {});
    return stopCam; // cleanup on unmount
  }, []);

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      setResult({ status: "no_face", message: "Could not access webcam. Check permissions." });
    }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }

  async function capture() {
    if (!camOn || !courseId) return;
    setScanning(true);
    setResult(null);
    try {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));

      const fd = new FormData();
      fd.append("course_id", courseId);
      fd.append("frame", blob, "frame.jpg");
      const data = await api.scan(fd);
      setResult(data);
      if (data.status === "present") {
        setFeed((f) => [{ ...data, t: new Date().toLocaleTimeString() }, ...f].slice(0, 8));
      }
    } catch (err) {
      setResult({ status: "unknown", message: err.message });
    } finally {
      setScanning(false);
    }
  }

  const oc = OUTCOME[result?.status] || OUTCOME.no_face;
  const Icon = oc.icon;

  return (
    <div>
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-brand-grad grid place-items-center shadow-glow shrink-0">
          <ScanFace className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-white">Live Scanner</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Pick a course, start the camera, and hold the student's photo up to the lens. Capture to mark them present.
          </p>
        </div>
        <select className="input max-w-xs" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Webcam */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink-900 border border-white/10">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center text-slate-500">
                <div className="text-center">
                  <CameraOff className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            {camOn && (
              <div className="absolute inset-6 border-2 border-brand-400/40 rounded-2xl animate-pulse-ring pointer-events-none" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3 mt-4">
            {!camOn ? (
              <button className="btn-primary flex-1" onClick={startCam}>
                <Camera className="h-4 w-4" /> Start Camera
              </button>
            ) : (
              <>
                <button className="btn-primary flex-1" onClick={capture} disabled={scanning}>
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
                  {scanning ? "Recognising…" : "Capture & Mark"}
                </button>
                <button className="btn-ghost" onClick={stopCam}>
                  <CameraOff className="h-4 w-4" /> Stop
                </button>
              </>
            )}
          </div>

          {result && (
            <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${oc.cls}`}>
              <Icon className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.confidence != null && (
                  <p className="text-xs opacity-80">match confidence {(result.confidence * 100).toFixed(1)}%</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live feed */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-bold text-white mb-4">Marked This Session</h3>
          {feed.length === 0 ? (
            <p className="text-sm text-slate-500">No one marked yet.</p>
          ) : (
            <div className="space-y-2">
              {feed.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.student?.full_name}</p>
                    <p className="text-xs text-slate-400">{m.student?.roll_number} · {m.t}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-xs text-slate-500 space-y-1.5">
            <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Match + not yet marked → Present</p>
            <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-amber-300" /> Match + already today → Already marked</p>
            <p className="flex items-center gap-2"><Ban className="h-3.5 w-3.5 text-danger" /> No match → Register first / Unknown</p>
          </div>
        </div>
      </div>
    </div>
  );
}
