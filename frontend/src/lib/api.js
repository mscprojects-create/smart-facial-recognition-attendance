// Tiny fetch wrapper around the Flask backend.
const BASE = import.meta.env.VITE_API_BASE || "/api";

function authHeaders() {
  const token = localStorage.getItem("ft_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data;
}

export const api = {
  // ---- auth ----
  adminSignup: (body) =>
    fetch(`${BASE}/auth/admin/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  adminSignin: (body) =>
    fetch(`${BASE}/auth/admin/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  studentSignin: (body) =>
    fetch(`${BASE}/auth/student/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  // ---- courses / students ----
  courses: () => fetch(`${BASE}/courses`, { headers: authHeaders() }).then(handle),
  students: () => fetch(`${BASE}/students`, { headers: authHeaders() }).then(handle),

  registerStudent: (formData) =>
    fetch(`${BASE}/students/register`, {
      method: "POST",
      headers: authHeaders(),
      body: formData, // multipart - browser sets Content-Type
    }).then(handle),

  // ---- scanner ----
  scan: (formData) =>
    fetch(`${BASE}/attendance/scan`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }).then(handle),

  // ---- analytics ----
  daily: (date) =>
    fetch(`${BASE}/attendance/daily?date=${date}`, { headers: authHeaders() }).then(handle),
  monthly: (month) =>
    fetch(`${BASE}/attendance/monthly?month=${month}`, { headers: authHeaders() }).then(handle),
  studentHistory: (roll) =>
    fetch(`${BASE}/attendance/student/${roll}`, { headers: authHeaders() }).then(handle),
};
