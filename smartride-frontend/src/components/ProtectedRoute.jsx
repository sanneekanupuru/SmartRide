// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  // Not logged in → redirect to login
  if (!user?.isLoggedIn) {
    if (role === "DRIVER") return <Navigate to="/driver/login" replace />;
    if (role === "PASSENGER") return <Navigate to="/passenger/login" replace />;
    if (role === "ADMIN") return <Navigate to="/admin/login" replace />;
    return <Navigate to="/" replace />;
  }

  // Role mismatch → redirect to homepage
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
