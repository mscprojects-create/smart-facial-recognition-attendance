import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import StudentRegistration from "./pages/admin/StudentRegistration.jsx";
import LiveScanner from "./pages/admin/LiveScanner.jsx";
import Analytics from "./pages/admin/Analytics.jsx";

// Route guard: redirects to /auth when no session, or to the correct
// dashboard when the role does not match.
function Protected({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/student"} /> : <AuthPage />}
      />

      {/* Student */}
      <Route
        path="/student"
        element={
          <Protected role="student">
            <StudentDashboard />
          </Protected>
        }
      />

      {/* Admin (nested) */}
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<StudentRegistration />} />
        <Route path="scanner" element={<LiveScanner />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
