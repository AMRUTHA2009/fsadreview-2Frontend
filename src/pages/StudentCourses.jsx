import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourse } from "../context/CourseContext";
import { normalizeCourses } from "../utils/workspaceData";
import { useAuth } from "../context/AuthContext";
import { useLms } from "../context/LmsContext";
import { getStudentKey, isStudentEnrolledInCourse } from "../utils/authIdentity";
import { useNotification } from "../context/NotificationContext";

export default function StudentCourses() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const lms = useLms();
  const { notify } = useNotification();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses).slice(0, 3), [courses]);
  const allCourses = useMemo(() => (lms.courses || []).filter((c) => c.enabled), [lms.courses]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((c) => String(c.title).toLowerCase().includes(q));
  }, [allCourses, query]);

  return (
    <section className="workspace-block">
      <h4 className="workspace-section-title">Enrolled</h4>
      <div className="workspace-course-grid">
        {filtered.slice(0, 6).map((course) => {
          const isEnrolled = isStudentEnrolledInCourse(course, user, lms.users || []);
          return (
          <article key={course.id} className="workspace-course-card">
            <div className="workspace-course-row">
              <h5>{course.title}</h5>
              <span className={`workspace-badge ${course.enabled ? "published" : "disabled"}`}>
                {course.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p>{course.description || "Course overview and learning materials"}</p>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => {
                const studentId = getStudentKey(user, lms.users || []);
                if (!studentId) {
                  notify("Could not resolve your profile. Try logging in again.", "error");
                  return;
                }
                if (!isEnrolled) {
                  lms.enrollInCourse({ courseId: course.id, studentId });
                  notify("Enrolled successfully.", "success");
                }
                navigate("/student/assignments");
              }}
            >
              {isEnrolled ? "View course" : "Enroll"}
            </button>
          </article>
        )})}
      </div>
      <div style={{ marginTop: 12 }}>
        <input
          placeholder="Search courses"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </section>
  );
}
