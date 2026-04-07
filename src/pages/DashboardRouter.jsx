import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardRouter() {
  const { role } = useAuth();

  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "INSTRUCTOR") return <Navigate to="/instructor" replace />;
  if (role === "CONTENT_CREATOR") return <Navigate to="/content-creator" replace />;
  return <Navigate to="/student" replace />;
}
