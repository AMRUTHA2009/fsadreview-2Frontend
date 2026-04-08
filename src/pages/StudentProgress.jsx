import { useEffect, useMemo, useRef } from "react";
import { useCourse } from "../context/CourseContext";
import { normalizeCourses } from "../utils/workspaceData";
import { useAuth } from "../context/AuthContext";
import { useLms } from "../context/LmsContext";
import { isStudentEnrolledInCourse, submissionBelongsToStudent } from "../utils/authIdentity";

export default function StudentProgress() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);
  const { user } = useAuth();
  const lms = useLms();

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const enrolledCourses = useMemo(
    () =>
      (lms.courses || []).filter(
        (c) => c.enabled && isStudentEnrolledInCourse(c, user, lms.users || [])
      ),
    [lms.courses, lms.users, user]
  );

  const progressCards = useMemo(() => {
    return enrolledCourses.map((c) => {
      const total = (c.assignments || []).length || 1;
      const graded = (c.assignments || []).reduce((sum, a) => {
        const s = (a.submissions || []).find(
          (sub) => sub.status === "Graded" && submissionBelongsToStudent(sub, user, lms.users || [])
        );
        return sum + (s ? 1 : 0);
      }, 0);
      const completion = Math.round((graded / total) * 100);
      const marks = (c.assignments || [])
        .map(
          (a) =>
            (a.submissions || []).find(
              (sub) => sub.status === "Graded" && submissionBelongsToStudent(sub, user, lms.users || [])
            )?.marks
        )
        .filter((m) => typeof m === "number");
      const avg = marks.length ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
      return { id: c.id, title: c.title, completion, grade: avg == null ? "-" : `${avg}` };
    });
  }, [enrolledCourses, user, lms.users]);

  return (
    <div className="workspace-progress-grid">
      {progressCards.map((item) => (
        <article key={item.id} className="workspace-panel">
          <div className="workspace-course-row">
            <h4>{item.title}</h4>
            <button type="button" className="workspace-link-button">
              View
            </button>
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
        </article>
      ))}
    </div>
  );
}
