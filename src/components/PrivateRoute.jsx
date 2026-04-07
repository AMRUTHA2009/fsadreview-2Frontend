import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <div className="page-loading">Checking session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
