import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDisplayName, getUserInitial } from "../utils/workspaceData";

export default function WorkspaceLayout({
  title,
  subtitle,
  workspaceLabel,
  portalLabel,
  navItems,
  action,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <div className="workspace-logo">LMS</div>
          <div>
            <h1>NovaLearn</h1>
            <p>{portalLabel}</p>
          </div>
        </div>

        <nav className="workspace-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "workspace-nav-link is-active" : "workspace-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar-footer">
          <span>{getDisplayName(user)}</span>
          <button type="button" className="workspace-text-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-kicker">{workspaceLabel}</p>
            <h2>Welcome back</h2>
          </div>
          <div className="workspace-topbar-actions">
            <button type="button" className="workspace-icon-button" aria-label="Notifications">
              <span className="workspace-bell" />
            </button>
            <div className="workspace-avatar">{getUserInitial(user)}</div>
          </div>
        </header>

        <section className="workspace-content">
          <div className="workspace-page-head">
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            {action}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
