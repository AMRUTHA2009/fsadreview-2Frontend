import { useEffect, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { userService } from "../services/lmsService";
import { fallbackCourses } from "../utils/workspaceData";

const navItems = [{ to: "/admin", label: "Dashboard", end: true }];
const roleSequence = ["ADMIN", "INSTRUCTOR", "CONTENT_CREATOR", "STUDENT"];
const fallbackUsers = [
  { id: "u1", email: "admin@lms.edu", role: "ADMIN" },
  { id: "u2", email: "instructor@lms.edu", role: "INSTRUCTOR" },
  { id: "u3", email: "content@lms.edu", role: "CONTENT_CREATOR" },
  { id: "u4", email: "student@lms.edu", role: "STUDENT" },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState(fallbackUsers);
  const [courseStates, setCourseStates] = useState([
    { id: "course-1", title: "Introduction to Machine Learning", publishState: "published", enabled: true },
    { id: "course-2", title: "Product Design Basics", publishState: "published", enabled: false },
    { id: "course-3", title: "Research Methods", publishState: "draft", enabled: true },
  ]);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    userService
      .list({ skipGlobalErrorHandler: true })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      })
      .catch(() => {});
  }, []);

  const cycleRole = (id) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== id) return user;
        const currentIndex = roleSequence.indexOf(user.role);
        return { ...user, role: roleSequence[(currentIndex + 1) % roleSequence.length] };
      })
    );
  };

  const toggleCourse = (id) => {
    setCourseStates((prev) =>
      prev.map((course) => (course.id === id ? { ...course, enabled: !course.enabled } : course))
    );
  };

  return (
    <WorkspaceLayout
      title="Admin dashboard"
      subtitle="Manage users, roles, and platform settings"
      workspaceLabel="Admin Workspace"
      portalLabel="Admin Portal"
      navItems={navItems}
    >
      <div className="workspace-stat-grid four-up">
        <article className="workspace-stat-card">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Total courses</span>
          <strong>{fallbackCourses.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Total enrollments</span>
          <strong>4</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Total submissions</span>
          <strong>4</strong>
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
            {courseStates.map((course) => (
              <div key={course.id} className="workspace-list-item">
                <div>
                  <strong>{course.title}</strong>
                  <div className="workspace-inline-badges">
                    <span className={`workspace-badge ${course.publishState}`}>
                      {course.publishState}
                    </span>
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
    </WorkspaceLayout>
  );
}
