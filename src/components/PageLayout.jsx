import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PageLayout({ title, children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h2>{title}</h2>
          <p>
            {user?.email || "Unknown user"} - {role || "No role"}
          </p>
        </div>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      {children}
    </main>
  );
}
