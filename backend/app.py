"""
app.py
======
Flask REST API for the Smart Facial Recognition Attendance System.

Endpoints
---------
Auth
  POST /api/auth/admin/signup     {full_name,email,password,department}
  POST /api/auth/admin/signin     {email,password}
  POST /api/auth/student/signin   {roll_number,email}

Admin - students
  GET  /api/students
  POST /api/students/register     multipart: name, roll_number, email,
                                   photos[] (exactly 5)  -> trains encodings
  GET  /api/courses

Live scanner
  POST /api/attendance/scan       multipart: course_id, frame(image)
                                   -> present / already / unknown / no_face

Analytics & student view
  GET  /api/attendance/daily?date=YYYY-MM-DD
  GET  /api/attendance/monthly?month=YYYY-MM
  GET  /api/attendance/student/<roll_number>

All responses are JSON. JWTs are returned on login and expected as
`Authorization: Bearer <token>` on protected routes (kept lightweight for a demo).
"""
from __future__ import annotations

import datetime as dt
import os

import bcrypt
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS

from supabase_client import supabase
import face_engine

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (localhost:5173) to call us

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"


# --------------------------------------------------------------------------- #
#  Helpers
# --------------------------------------------------------------------------- #
def make_token(payload: dict, hours: int = 12) -> str:
    body = {**payload, "exp": dt.datetime.utcnow() + dt.timedelta(hours=hours)}
    return jwt.encode(body, JWT_SECRET, algorithm=JWT_ALGO)


def ok(data, code=200):
    return jsonify({"ok": True, "data": data}), code


def err(message, code=400):
    return jsonify({"ok": False, "error": message}), code


# --------------------------------------------------------------------------- #
#  Auth
# --------------------------------------------------------------------------- #
@app.post("/api/auth/admin/signup")
def admin_signup():
    b = request.get_json(force=True)
    for f in ("full_name", "email", "password"):
        if not b.get(f):
            return err(f"'{f}' is required")
    pw_hash = bcrypt.hashpw(b["password"].encode(), bcrypt.gensalt()).decode()
    existing = supabase.table("admin_users").select("id").eq("email", b["email"]).execute()
    if existing.data:
        return err("An admin with that email already exists", 409)
    row = supabase.table("admin_users").insert({
        "full_name": b["full_name"],
        "email": b["email"],
        "password_hash": pw_hash,
        "department": b.get("department"),
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
    """Students CANNOT self-register; they sign in with roll_number + email."""
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


# --------------------------------------------------------------------------- #
#  Courses
# --------------------------------------------------------------------------- #
@app.get("/api/courses")
def list_courses():
    res = supabase.table("courses").select("*").order("course_code").execute()
    return ok(res.data)


# --------------------------------------------------------------------------- #
#  Student registration  (admin only, exactly 5 photos)
# --------------------------------------------------------------------------- #
@app.get("/api/students")
def list_students():
    res = supabase.table("students").select("*").order("created_at").execute()
    return ok(res.data)


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

    # 1. Create the student record
    dupe = (supabase.table("students").select("id")
            .or_(f"roll_number.eq.{roll},email.eq.{email}").execute())
    if dupe.data:
        return err("A student with that roll number or email already exists", 409)

    student = supabase.table("students").insert({
        "full_name": name, "roll_number": roll, "email": email,
    }).execute().data[0]

    # 2. Encode each photo and store the vectors
    encoded = 0
    for i, f in enumerate(photos, start=1):
        try:
            vec = face_engine.encode_face(f.read())
        except RuntimeError as e:
            return err(str(e), 500)
        if vec is None:
            continue  # skip photos with no detectable face
        supabase.table("face_encodings").insert({
            "student_id": student["id"],
            "encoding": vec,
            "image_path": f"{roll}_{i}.jpg",
        }).execute()
        encoded += 1

    if encoded == 0:
        # rollback the student if no usable face was found
        supabase.table("students").delete().eq("id", student["id"]).execute()
        return err("No face detected in any of the 5 photos. Re-upload clearer images.", 422)

    supabase.table("students").update({
        "photo_count": encoded, "is_trained": True,
    }).eq("id", student["id"]).execute()

    return ok({"student": student, "encodings_stored": encoded,
               "message": f"{name} registered and trained on {encoded}/5 photos."}, 201)


# --------------------------------------------------------------------------- #
#  Live scanner  ->  mark attendance
# --------------------------------------------------------------------------- #
@app.post("/api/attendance/scan")
def scan():
    course_id = request.form.get("course_id")
    frame = request.files.get("frame")
    if not course_id or frame is None:
        return err("course_id and a frame image are required")

    # Build the gallery of trained students
    enc = supabase.table("face_encodings").select("student_id,encoding").execute().data
    studs = {s["id"]: s for s in supabase.table("students").select(
        "id,full_name,roll_number").execute().data}
    gallery = [{
        "student_id": e["student_id"],
        "encoding": e["encoding"],
        "full_name": studs.get(e["student_id"], {}).get("full_name", "?"),
        "roll_number": studs.get(e["student_id"], {}).get("roll_number", "?"),
    } for e in enc if e["student_id"] in studs]

    outcome = face_engine.match_face(frame.read(), gallery)

    if outcome["result"] == "no_face":
        return ok({"status": "no_face",
                   "message": "No face detected in the frame. Hold the photo steady."})
    if outcome["result"] == "unknown":
        return ok({"status": "unknown",
                   "message": "Register first / Unknown face data",
                   "distance": outcome["distance"]})

    # We have a match -> attempt to mark attendance for today
    today = dt.date.today().isoformat()
    already = (supabase.table("attendance_logs").select("id")
               .eq("student_id", outcome["student_id"])
               .eq("course_id", course_id)
               .eq("attendance_date", today).execute())
    if already.data:
        return ok({"status": "already",
                   "student": {"full_name": outcome["full_name"],
                               "roll_number": outcome["roll_number"]},
                   "message": f"Already marked - {outcome['full_name']}"})

    supabase.table("attendance_logs").insert({
        "student_id": outcome["student_id"],
        "course_id": course_id,
        "attendance_date": today,
        "status": "present",
        "confidence": outcome["confidence"],
    }).execute()

    return ok({"status": "present",
               "student": {"full_name": outcome["full_name"],
                           "roll_number": outcome["roll_number"]},
               "confidence": outcome["confidence"],
               "message": f"Present - {outcome['full_name']}"})


# --------------------------------------------------------------------------- #
#  Analytics
# --------------------------------------------------------------------------- #
@app.get("/api/attendance/daily")
def daily():
    date = request.args.get("date", dt.date.today().isoformat())
    res = (supabase.table("v_attendance_report").select("*")
           .eq("attendance_date", date).order("course_code").execute())
    return ok(res.data)


@app.get("/api/attendance/monthly")
def monthly():
    month = request.args.get("month", dt.date.today().strftime("%Y-%m"))
    start = f"{month}-01"
    # naive month-end
    y, m = map(int, month.split("-"))
    end = (dt.date(y + (m == 12), (m % 12) + 1, 1)).isoformat()
    res = (supabase.table("v_attendance_report").select("*")
           .gte("attendance_date", start).lt("attendance_date", end)
           .order("attendance_date").execute())
    return ok(res.data)


@app.get("/api/attendance/student/<roll_number>")
def student_history(roll_number):
    s = supabase.table("students").select("id,full_name").eq(
        "roll_number", roll_number).execute()
    if not s.data:
        return err("Student not found", 404)
    res = (supabase.table("v_attendance_report").select("*")
           .eq("roll_number", roll_number)
           .order("attendance_date").execute())
    return ok({"student": s.data[0], "logs": res.data})


@app.get("/api/health")
def health():
    return ok({"service": "attendance-backend", "dlib": face_engine._HAS_DLIB})


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
