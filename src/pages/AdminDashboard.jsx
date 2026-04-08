import { useEffect, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useLms } from "../context/LmsContext";

const navItems = [{ to: "/admin", label: "Dashboard", end: true }];
const roleSequence = ["ADMIN", "INSTRUCTOR", "CONTENT_CREATOR", "STUDENT"];

export default function AdminDashboard() {
  const lms = useLms();
  const [users, setUsers] = useState(() => lms.users || []);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setUsers(lms.users || []);
  }, []);

  const cycleRole = (id) => {
    const current = (lms.users || []).find((u) => u.id === id);
    if (!current) return;
    const currentIndex = roleSequence.indexOf(current.role);
    const nextRole = roleSequence[(currentIndex + 1) % roleSequence.length];
    lms.updateUserRole(id, nextRole);
    setUsers(lms.users || []);
  };

  const toggleCourse = (id) => {
    lms.toggleCourseEnabled(id);
  };

  const totalEnrollments = (lms.courses || []).reduce((sum, c) => sum + (c.students || []).length, 0);
  const totalSubmissions = (lms.courses || []).reduce(
    (sum, c) =>
      sum +
      (c.assignments || []).reduce((s2, a) => s2 + (a.submissions || []).length, 0),
    0
  );
  const activeCourses = (lms.courses || []).filter((c) => c.enabled).length;

  return (
    <WorkspaceLayout
      title="Admin dashboard"
      subtitle="Manage users, roles, and platform settings"
      workspaceLabel="Admin Workspace"
      portalLabel="Admin Portal"
      navItems={navItems}
      action={
        <button type="button" className="workspace-primary-button" onClick={lms.toggleDarkMode}>
          Toggle theme
        </button>
      }
    >
      <div className="workspace-stat-grid four-up">
        <article className="workspace-stat-card">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Active courses</span>
          <strong>{activeCourses}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Total enrollments</span>
          <strong>{totalEnrollments}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Total submissions</span>
          <strong>{totalSubmissions}</strong>
        </article>
      </div>

      <div className="workspace-grid two-columns">
        <section className="workspace-panel">
          <h4>Users</h4>
          <div className="workspace-list">
            {users.map((user) => (
              <div key={user.id || user.email} className="workspace-list-item">
                <div>
                  <strong>{user.email}</strong>
                  <p>{String(user.role || "").toLowerCase().replaceAll("_", " ")}</p>
                </div>
                <button
                  type="button"
                  className="workspace-small-button muted"
                  onClick={() => cycleRole(user.id)}
                >
                  Change role
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <h4>Courses (enable/disable)</h4>
          <div className="workspace-list">
            {(lms.courses || []).map((course) => (
              <div key={course.id} className="workspace-list-item">
                <div>
                  <strong>{course.title}</strong>
                  <div className="workspace-inline-badges">
                    <span className={`workspace-badge ${course.enabled ? "published" : "disabled"}`}>
                      {course.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`workspace-small-button ${course.enabled ? "warning" : "success"}`}
                  onClick={() => toggleCourse(course.id)}
                >
                  {course.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="workspace-panel">
        <h4>Activity logs</h4>
        <div className="workspace-list">
          {(lms.activityLogs || []).slice(0, 10).map((log) => (
            <div key={log.id} className="workspace-list-item">
              <div>
                <strong>{new Date(log.at).toLocaleString()}</strong>
                <p>{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
