import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useCourse } from "../context/CourseContext";
import {
  buildStudentAssignments,
  buildStudentProgress,
  normalizeCourses,
} from "../utils/workspaceData";

export default function StudentDashboard() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses), [courses]);
  const assignments = useMemo(() => buildStudentAssignments(visibleCourses), [visibleCourses]);
  const progress = useMemo(() => buildStudentProgress(visibleCourses), [visibleCourses]);

  return (
    <>
      <div className="workspace-stat-grid three-up">
        <article className="workspace-stat-card">
          <span>Enrolled courses</span>
          <strong>{visibleCourses.length > 0 ? 1 : 0}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Assignments due this week</span>
          <strong>0</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Graded submissions</span>
          <strong>1</strong>
        </article>
      </div>

      <div className="workspace-grid dashboard-grid">
        <section className="workspace-panel">
          <div className="workspace-panel-head">
            <h4>My courses</h4>
            <Link to="/student/courses" className="workspace-link-button">
              View all
            </Link>
          </div>
          <div className="workspace-list-item large">
            <div>
              <strong>{visibleCourses[0]?.title || "Introduction to Machine Learning"}</strong>
            </div>
            <span className="workspace-badge published">Published</span>
          </div>
        </section>

        <section className="workspace-panel">
          <h4>Upcoming deadlines</h4>
          <p className="workspace-muted">
            {assignments.filter((item) => item.status !== "Graded").length > 0
              ? "Assignments are available in the assignments section."
              : "No assignments due this week"}
          </p>
        </section>
      </div>

      <div className="workspace-grid dashboard-grid">
        {progress.map((item) => (
          <section key={item.id} className="workspace-panel">
            <div className="workspace-course-row">
              <h4>{item.title}</h4>
              <Link to="/student/progress" className="workspace-link-button">
                View
              </Link>
            </div>
            <div className="workspace-progress-meta">
              <span>Completion</span>
              <span>{item.completion}%</span>
            </div>
            <div className="workspace-progress-bar">
              <span style={{ width: `${item.completion}%` }} />
            </div>
            <div className="workspace-progress-meta">
              <span>Overall grade</span>
              <strong>{item.grade}</strong>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
