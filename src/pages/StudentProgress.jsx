import { useEffect, useMemo, useRef } from "react";
import { useCourse } from "../context/CourseContext";
import { buildStudentProgress, normalizeCourses } from "../utils/workspaceData";

export default function StudentProgress() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const progressCards = useMemo(
    () => buildStudentProgress(normalizeCourses(courses)),
    [courses]
  );

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
