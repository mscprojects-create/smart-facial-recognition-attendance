# FaceTrack — Smart Facial Recognition Attendance System

Biometric classroom attendance. An admin (professor) registers students with 5
reference photos, a Python backend trains a face recogniser on them, and a live
webcam scanner marks students **Present** the moment their face is recognised.

```
React + Tailwind (Vite)  ──/api──►  Flask + face_recognition/cv2  ──►  Supabase (PostgreSQL)
```

---

## File tree

```
smart-attendance-system/
├─ frontend/                     # React + Tailwind (Vite)
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js             # proxies /api -> Flask
│  ├─ tailwind.config.js         # "Aurora" theme
│  ├─ postcss.config.js
│  ├─ public/favicon.svg
│  └─ src/
│     ├─ main.jsx  App.jsx  index.css
│     ├─ lib/        api.js · supabaseClient.js
│     ├─ context/    AuthContext.jsx
│     ├─ components/ AdminLayout.jsx        # sidebar + bottom-left Logout
│     └─ pages/
│        ├─ AuthPage.jsx
│        ├─ StudentDashboard.jsx            # calendar attendance visualiser
│        └─ admin/
│           ├─ StudentRegistration.jsx      # 5-photo uploader
│           ├─ LiveScanner.jsx              # webcam + course dropdown
│           └─ Analytics.jsx                # daily + monthly sheets
├─ backend/                      # Flask API
│  ├─ app.py                     # all REST routes
│  ├─ face_engine.py             # encode / match faces (dlib + OpenCV)
│  ├─ supabase_client.py
│  ├─ requirements.txt
│  └─ .env.example
└─ database/
   ├─ schema.sql                 # tables, view, indexes
   └─ seed.sql                   # 7 demo students + 2 admins + history
```

## 1 — Supabase

1. Create a project at supabase.com.
2. SQL Editor → paste **`database/schema.sql`** → Run.
3. SQL Editor → paste **`database/seed.sql`** → Run.
4. Settings → API: copy the **Project URL** and the **service_role** key.

## 2 — Backend (Flask)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt                      # needs cmake + a C++ compiler for dlib
cp .env.example .env                                 # then fill SUPABASE_URL / SUPABASE_SERVICE_KEY
python app.py                                         # serves on http://localhost:5000
```

> **dlib build help:** macOS `brew install cmake`; Ubuntu `sudo apt install cmake build-essential`;
> Windows: install "Desktop development with C++" via Visual Studio Build Tools.

## 3 — Frontend (React)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173  (proxies /api to Flask)
```

---

## Demo credentials (from seed.sql)

| Role    | Login                                                        |
|---------|-------------------------------------------------------------|
| Admin   | `prof.sharma@univ.edu` / `admin123`                         |
| Admin   | `prof.iyer@univ.edu` / `admin123`                           |
| Student | roll `MSC23-001`, email `salman.khan@univ.edu`              |
| Student | roll `MSC23-003`, email `priya.menon@univ.edu`              |

## Demo flow

1. **Admin** signs in → *Student Registration* → add a student and upload **5**
   clear photos of the subject (e.g. Salman Khan). The backend encodes each face.
2. Go to **Live Scanner** → choose a course → *Start Camera* → hold the subject's
   photo (printed or on a phone) to the webcam → *Capture & Mark*.
   - recognised + first time today → **Present**
   - recognised + already marked → **Already marked**
   - not recognised → **Register first / Unknown face data**
3. **Analytics** shows the daily report and the monthly compilation sheet.
4. **Student** signs in with roll + email → sees a calendar of Present/Absent days.

## Role & access rules

- Two roles: **Admin (Professor)** and **Student**.
- Students **cannot self-register** — only an admin creates them and assigns roll + email.
- Every dashboard pins a **Logout** button to the **bottom-left** corner.

## Security notes (demo vs production)

- The service_role key lives **only** in the Flask backend, never in the browser.
- RLS is disabled for the demo; enable it + policies before any real deployment.
- Liveness/anti-spoofing is intentionally out of scope (holding a photo is the demo
  mechanic). See the Project Report, Chapter 8, for the mitigation roadmap.
