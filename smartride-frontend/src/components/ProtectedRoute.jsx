import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user?.isLoggedIn) return <Navigate to={role === "DRIVER" ? "/driver/login" : "/passenger/login"} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
