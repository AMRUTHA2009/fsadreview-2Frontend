import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useCourse } from "../context/CourseContext";
import {
  normalizeCourses,
} from "../utils/workspaceData";
import { useAuth } from "../context/AuthContext";
import { useLms } from "../context/LmsContext";
import { isStudentEnrolledInCourse, submissionBelongsToStudent } from "../utils/authIdentity";

export default function StudentDashboard() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);
  const { user } = useAuth();
  const lms = useLms();

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses), [courses]);
  const enrolledCourses = useMemo(
    () =>
      (lms.courses || []).filter(
        (c) => c.enabled && isStudentEnrolledInCourse(c, user, lms.users || [])
      ),
    [lms.courses, lms.users, user]
  );

  const allAssignments = useMemo(() => {
    const list = [];
    for (const c of enrolledCourses) {
      for (const a of c.assignments || []) {
        const sub = (a.submissions || []).find((s) => submissionBelongsToStudent(s, user, lms.users || []));
        const deadlineMs = a.deadline ? new Date(a.deadline).getTime() : NaN;
        const overdue = Number.isFinite(deadlineMs) && Date.now() > deadlineMs && (!sub || sub.status !== "Graded");
        list.push({
          courseId: c.id,
          courseTitle: c.title,
          assignmentId: a.id,
          title: a.title,
          deadline: a.deadline,
          status: sub?.status || (overdue ? "Overdue" : "Pending"),
          marks: sub?.marks ?? null,
          feedback: sub?.feedback || "",
        });
      }
    }
    return list;
  }, [enrolledCourses, user, lms.users]);

  const pendingAssignments = useMemo(
    () => allAssignments.filter((a) => a.status !== "Graded"),
    [allAssignments]
  );
  const gradedAssignments = useMemo(
    () => allAssignments.filter((a) => a.status === "Graded"),
    [allAssignments]
  );

  const marksGraph = useMemo(() => {
    const graded = gradedAssignments.slice(0, 6);
    const max = Math.max(1, ...graded.map((g) => Number(g.marks || 0)));
    return graded.map((g) => ({ ...g, pct: Math.round((Number(g.marks || 0) / max) * 100) }));
  }, [gradedAssignments]);

  return (
    <>
      <div className="workspace-stat-grid three-up">
        <article className="workspace-stat-card">
          <span>Enrolled courses</span>
          <strong>{enrolledCourses.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Pending assignments</span>
          <strong>{pendingAssignments.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Graded submissions</span>
          <strong>{gradedAssignments.length}</strong>
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
              <strong>{enrolledCourses[0]?.title || "No enrolled courses yet"}</strong>
            </div>
            <span className={`workspace-badge ${enrolledCourses[0] ? "published" : "draft"}`}>
              {enrolledCourses[0] ? "Enrolled" : "Browse courses"}
            </span>
          </div>
        </section>

        <section className="workspace-panel">
          <h4>Upcoming deadlines</h4>
          <p className="workspace-muted">
            {pendingAssignments.length > 0
              ? "Assignments are available in the assignments section."
              : "No pending assignments"}
          </p>
        </section>
      </div>

      <div className="workspace-grid dashboard-grid">
        <section className="workspace-panel">
          <div className="workspace-course-row">
            <h4>Marks per assignment</h4>
            <Link to="/student/assignments" className="workspace-link-button">
              View
            </Link>
          </div>
          {marksGraph.length === 0 ? (
            <p className="workspace-muted">No graded submissions yet.</p>
          ) : (
            <div>
              {marksGraph.map((g) => (
                <div key={g.assignmentId} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 12 }}>{g.title}</strong>
                    <span style={{ fontSize: 12 }}>{g.marks}</span>
                  </div>
                  <div className="workspace-progress-bar">
                    <span style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
