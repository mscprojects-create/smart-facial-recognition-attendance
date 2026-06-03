"""
api/index.py — Flask app exposed as a Vercel Python serverless function.

Self-contained on purpose: Vercel's Python runtime bundles the entrypoint file
but does not reliably include sibling modules, so the Supabase client and the
(perceptual-hash) recognition engine are inlined here rather than imported.

Vercel routes /api/(.*) to this function (see vercel.json). Flask routes keep
their /api/... prefix so the original paths are preserved.
"""
from __future__ import annotations

import datetime as dt
import io
import os

import bcrypt
import jwt
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from supabase import create_client, Client

# --------------------------------------------------------------------------- #
#  Supabase client (inlined)
# --------------------------------------------------------------------------- #
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars.")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# --------------------------------------------------------------------------- #
#  Recognition engine (inlined perceptual-hash / dHash)
# --------------------------------------------------------------------------- #
HASH_SIZE = 16  # -> 256-bit fingerprint
TOLERANCE = float(os.environ.get("FACE_MATCH_TOLERANCE", "0.22"))


def encode_face(image_bytes):
    """256-length 0/1 perceptual-hash vector, or None on decode error."""
    try:
        img = (Image.open(io.BytesIO(image_bytes)).convert("L")
               .resize((HASH_SIZE + 1, HASH_SIZE), Image.LANCZOS))
    except Exception:
        return None
    px = np.asarray(img, dtype=np.float32)
    diff = px[:, 1:] > px[:, :-1]
    return diff.flatten().astype(np.float32).tolist()


def match_face(probe_bytes, gallery):
    probe = encode_face(probe_bytes)
    if probe is None:
        return {"result": "no_face"}
    if not gallery:
        return {"result": "unknown", "distance": 1.0}
    probe_vec = np.array(probe, dtype=np.float32)
    best_dist, best = 1.0, None
    for g in gallery:
        vec = np.array(g["encoding"], dtype=np.float32)
        if vec.shape != probe_vec.shape:
            continue
        d = float(np.mean(np.abs(vec - probe_vec)))
        if d < best_dist:
            best_dist, best = d, g
    if best is not None and best_dist <= TOLERANCE:
        return {"result": "match", "student_id": best["student_id"],
                "full_name": best["full_name"], "roll_number": best["roll_number"],
                "distance": round(best_dist, 4),
                "confidence": round(max(0.0, 1.0 - best_dist), 4)}
    return {"result": "unknown", "distance": round(best_dist, 4)}


# --------------------------------------------------------------------------- #
#  Flask app
# --------------------------------------------------------------------------- #
app = Flask(__name__)
CORS(app)

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"


def make_token(payload, hours=12):
    body = {**payload, "exp": dt.datetime.utcnow() + dt.timedelta(hours=hours)}
    return jwt.encode(body, JWT_SECRET, algorithm=JWT_ALGO)


def ok(data, code=200):
    return jsonify({"ok": True, "data": data}), code


def err(message, code=400):
    return jsonify({"ok": False, "error": message}), code


# ---- auth ----------------------------------------------------------------
@app.post("/api/auth/admin/signup")
def admin_signup():
    b = request.get_json(force=True)
    for f in ("full_name", "email", "password"):
        if not b.get(f):
            return err(f"'{f}' is required")
    if supabase.table("admin_users").select("id").eq("email", b["email"]).execute().data:
        return err("An admin with that email already exists", 409)
    pw_hash = bcrypt.hashpw(b["password"].encode(), bcrypt.gensalt()).decode()
    row = supabase.table("admin_users").insert({
        "full_name": b["full_name"], "email": b["email"],
        "password_hash": pw_hash, "department": b.get("department"),
    }).execute().data[0]
    token = make_token({"sub": row["id"], "role": "admin", "email": row["email"]})
    return ok({"token": token, "user": {"id": row["id"], "full_name": row["full_name"],
                                        "email": row["email"], "role": "admin"}}, 201)


@app.post("/api/auth/admin/signin")
def admin_signin():
    b = request.get_json(force=True)
    res = supabase.table("admin_users").select("*").eq("email", b.get("email", "")).execute()
    if not res.data:
        return err("Invalid credentials", 401)
    admin = res.data[0]
    if not bcrypt.checkpw(b.get("password", "").encode(), admin["password_hash"].encode()):
        return err("Invalid credentials", 401)
    token = make_token({"sub": admin["id"], "role": "admin", "email": admin["email"]})
    return ok({"token": token, "user": {"id": admin["id"], "full_name": admin["full_name"],
                                        "email": admin["email"], "role": "admin"}})


@app.post("/api/auth/student/signin")
def student_signin():
    b = request.get_json(force=True)
    res = (supabase.table("students").select("*")
           .eq("roll_number", b.get("roll_number", ""))
           .eq("email", b.get("email", "")).execute())
    if not res.data:
        return err("No student found with that roll number + email. "
                   "Ask your professor to register you first.", 401)
    s = res.data[0]
    token = make_token({"sub": s["id"], "role": "student", "roll_number": s["roll_number"]})
    return ok({"token": token, "user": {"id": s["id"], "full_name": s["full_name"],
                                        "roll_number": s["roll_number"], "email": s["email"],
                                        "role": "student"}})


# ---- courses / students --------------------------------------------------
@app.get("/api/courses")
def list_courses():
    return ok(supabase.table("courses").select("*").order("course_code").execute().data)


@app.get("/api/students")
def list_students():
    return ok(supabase.table("students").select("*").order("created_at").execute().data)


@app.post("/api/students/register")
def register_student():
    name = request.form.get("name")
    roll = request.form.get("roll_number")
    email = request.form.get("email")
    photos = request.files.getlist("photos")
    if not (name and roll and email):
        return err("name, roll_number and email are required")
    if len(photos) != 5:
        return err(f"Exactly 5 photos required, received {len(photos)}")
    if (supabase.table("students").select("id")
            .or_(f"roll_number.eq.{roll},email.eq.{email}").execute().data):
        return err("A student with that roll number or email already exists", 409)

    student = supabase.table("students").insert({
        "full_name": name, "roll_number": roll, "email": email,
    }).execute().data[0]

    encoded = 0
    for i, f in enumerate(photos, start=1):
        vec = encode_face(f.read())
        if vec is None:
            continue
        supabase.table("face_encodings").insert({
            "student_id": student["id"], "encoding": vec,
            "image_path": f"{roll}_{i}.jpg",
        }).execute()
        encoded += 1

    if encoded == 0:
        supabase.table("students").delete().eq("id", student["id"]).execute()
        return err("Could not read any of the 5 photos. Re-upload valid images.", 422)

    supabase.table("students").update({
        "photo_count": encoded, "is_trained": True,
    }).eq("id", student["id"]).execute()
    return ok({"student": student, "encodings_stored": encoded,
               "message": f"{name} registered and trained on {encoded}/5 photos."}, 201)


# ---- scanner -------------------------------------------------------------
@app.post("/api/attendance/scan")
def scan():
    course_id = request.form.get("course_id")
    frame = request.files.get("frame")
    if not course_id or frame is None:
        return err("course_id and a frame image are required")

    enc = supabase.table("face_encodings").select("student_id,encoding").execute().data
    studs = {s["id"]: s for s in supabase.table("students")
             .select("id,full_name,roll_number").execute().data}
    gallery = [{
        "student_id": e["student_id"], "encoding": e["encoding"],
        "full_name": studs.get(e["student_id"], {}).get("full_name", "?"),
        "roll_number": studs.get(e["student_id"], {}).get("roll_number", "?"),
    } for e in enc if e["student_id"] in studs]

    outcome = match_face(frame.read(), gallery)
    if outcome["result"] == "no_face":
        return ok({"status": "no_face", "message": "Could not read the frame. Try again."})
    if outcome["result"] == "unknown":
        return ok({"status": "unknown", "message": "Register first / Unknown face data",
                   "distance": outcome["distance"]})

    today = dt.date.today().isoformat()
    already = (supabase.table("attendance_logs").select("id")
               .eq("student_id", outcome["student_id"]).eq("course_id", course_id)
               .eq("attendance_date", today).execute())
    if already.data:
        return ok({"status": "already",
                   "student": {"full_name": outcome["full_name"], "roll_number": outcome["roll_number"]},
                   "message": f"Already marked - {outcome['full_name']}"})

    supabase.table("attendance_logs").insert({
        "student_id": outcome["student_id"], "course_id": course_id,
        "attendance_date": today, "status": "present", "confidence": outcome["confidence"],
    }).execute()
    return ok({"status": "present",
               "student": {"full_name": outcome["full_name"], "roll_number": outcome["roll_number"]},
               "confidence": outcome["confidence"],
               "message": f"Present - {outcome['full_name']}"})


# ---- analytics -----------------------------------------------------------
@app.get("/api/attendance/daily")
def daily():
    date = request.args.get("date", dt.date.today().isoformat())
    return ok(supabase.table("v_attendance_report").select("*")
              .eq("attendance_date", date).order("course_code").execute().data)


@app.get("/api/attendance/monthly")
def monthly():
    month = request.args.get("month", dt.date.today().strftime("%Y-%m"))
    y, m = map(int, month.split("-"))
    start = f"{month}-01"
    end = dt.date(y + (m == 12), (m % 12) + 1, 1).isoformat()
    return ok(supabase.table("v_attendance_report").select("*")
              .gte("attendance_date", start).lt("attendance_date", end)
              .order("attendance_date").execute().data)


@app.get("/api/attendance/student/<roll_number>")
def student_history(roll_number):
    s = supabase.table("students").select("id,full_name").eq("roll_number", roll_number).execute()
    if not s.data:
        return err("Student not found", 404)
    logs = (supabase.table("v_attendance_report").select("*")
            .eq("roll_number", roll_number).order("attendance_date").execute().data)
    return ok({"student": s.data[0], "logs": logs})


@app.get("/api/health")
def health():
    return ok({"service": "attendance-backend", "engine": "perceptual-hash"})


if __name__ == "__main__":
    app.run(port=int(os.environ.get("FLASK_PORT", "5000")), debug=True)
