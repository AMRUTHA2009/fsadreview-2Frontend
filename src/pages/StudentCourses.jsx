import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCourse } from "../context/CourseContext";
import { normalizeCourses } from "../utils/workspaceData";

export default function StudentCourses() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses).slice(0, 3), [courses]);

  return (
    <section className="workspace-block">
      <h4 className="workspace-section-title">Enrolled</h4>
      <div className="workspace-course-grid">
        {visibleCourses.map((course) => (
          <article key={course.id} className="workspace-course-card">
            <div className="workspace-course-row">
              <h5>{course.title}</h5>
              <span className={`workspace-badge ${course.badge}`}>{course.status}</span>
            </div>
            <p>{course.description}</p>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => navigate("/student")}
            >
              View course
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
