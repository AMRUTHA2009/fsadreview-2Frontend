import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { buildInstructorSubmissions, normalizeCourses } from "../utils/workspaceData";
import { validateRequired } from "../utils/validation";

const navItems = [{ to: "/instructor", label: "Dashboard", end: true }];

export default function InstructorDashboard() {
  const { courses, refreshCourses } = useCourse();
  const { notify } = useNotification();
  const [courseCards, setCourseCards] = useState([]);
  const [submissions, setSubmissions] = useState(buildInstructorSubmissions());
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", courseId: "" });
  const [courseTouched, setCourseTouched] = useState({});
  const [courseErrors, setCourseErrors] = useState({});
  const [assignmentTouched, setAssignmentTouched] = useState({});
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const hasLoaded = useRef(false);
  const materialInputRef = useRef(null);
  const [materialTargetId, setMaterialTargetId] = useState("");

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const visibleCourses = useMemo(() => normalizeCourses(courses), [courses]);

  useEffect(() => {
    setCourseCards(visibleCourses);
  }, [visibleCourses]);

  const removeCourse = (courseId) => {
    setCourseCards((prev) => prev.filter((course) => course.id !== courseId));
  };

  const markGraded = (submissionId) => {
    setSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId));
  };

  const submitCourse = (event) => {
    event.preventDefault();
    const title = courseForm.title.trim();
    const nextErrors = { title: validateRequired(title, "Course title is required") };
    setCourseErrors(nextErrors);
    setCourseTouched({ title: true });
    if (nextErrors.title) return;

    setCourseCards((prev) => [
      {
        id: `course-${Date.now()}`,
        title,
        description: courseForm.description.trim() || "Course overview and learning materials",
        status: "Draft",
        badge: "draft",
        enrolledCount: 0,
        assignmentCount: 0,
        materialCount: 0,
      },
      ...prev,
    ]);
    setCourseForm({ title: "", description: "" });
    setShowCreateCourse(false);
    notify(`${title} created.`, "success");
  };

  const submitAssignment = (event) => {
    event.preventDefault();
    const nextErrors = {
      title: validateRequired(assignmentForm.title.trim(), "Assignment title is required"),
      courseId: validateRequired(assignmentForm.courseId, "Course is required"),
    };
    setAssignmentErrors(nextErrors);
    setAssignmentTouched({ title: true, courseId: true });
    if (nextErrors.title || nextErrors.courseId) return;

    setCourseCards((prev) =>
      prev.map((course) =>
        course.id === assignmentForm.courseId
          ? { ...course, assignmentCount: (course.assignmentCount || 0) + 1 }
          : course
      )
    );
    notify(`${assignmentForm.title} added successfully.`, "success");
    setAssignmentForm({ title: "", courseId: "" });
    setShowAddAssignment(false);
  };

  const openMaterialPicker = (courseId) => {
    setMaterialTargetId(courseId);
    materialInputRef.current?.click();
  };

  const handleMaterialSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file || !materialTargetId) return;

    setCourseCards((prev) =>
      prev.map((course) =>
        course.id === materialTargetId
          ? { ...course, materialCount: (course.materialCount || 0) + 1 }
          : course
      )
    );
    notify(`${file.name} attached to the course.`, "success");
    setMaterialTargetId("");
    event.target.value = "";
  };

  return (
    <WorkspaceLayout
      title="Instructor dashboard"
      subtitle="Manage courses, materials, and submissions"
      workspaceLabel="Instructor Workspace"
      portalLabel="Instructor Portal"
      navItems={navItems}
      action={
        <button
          type="button"
          className="workspace-primary-button"
          onClick={() => {
            setShowCreateCourse((prev) => !prev);
            setShowAddAssignment(false);
          }}
        >
          Create course
        </button>
      }
    >
      <input
        ref={materialInputRef}
        type="file"
        className="workspace-hidden-input"
        onChange={handleMaterialSelected}
      />

      <div className="workspace-stat-grid three-up">
        <article className="workspace-stat-card">
          <span>My courses</span>
          <strong>{courseCards.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Submissions awaiting review</span>
          <strong>{submissions.length}</strong>
        </article>
        <article className="workspace-stat-card">
          <span>Avg marks (graded)</span>
          <strong>34</strong>
        </article>
      </div>

      {showCreateCourse ? (
        <section className="workspace-panel workspace-upload-panel">
          <div className="workspace-panel-head">
            <h4>Create course</h4>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => setShowCreateCourse(false)}
            >
              Close
            </button>
          </div>
          <form className="workspace-upload-form" onSubmit={submitCourse}>
            <input
              placeholder="Course title"
              value={courseForm.title}
              onChange={(event) => {
                const value = event.target.value;
                setCourseForm((prev) => ({ ...prev, title: value }));
                setCourseErrors((prev) => ({ ...prev, title: validateRequired(value.trim(), "Course title is required") }));
              }}
              onBlur={() => setCourseTouched((prev) => ({ ...prev, title: true }))}
              required
            />
            {courseTouched.title && courseErrors.title ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{courseErrors.title}</div>
            ) : null}
            <input
              placeholder="Short description"
              value={courseForm.description}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <button type="submit" className="workspace-primary-button">
              Save course
            </button>
          </form>
        </section>
      ) : null}

      {showAddAssignment ? (
        <section className="workspace-panel workspace-upload-panel">
          <div className="workspace-panel-head">
            <h4>Add assignment</h4>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => setShowAddAssignment(false)}
            >
              Close
            </button>
          </div>
          <form className="workspace-upload-form" onSubmit={submitAssignment}>
            <input
              placeholder="Assignment title"
              value={assignmentForm.title}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))
              }
              onBlur={() => setAssignmentTouched((prev) => ({ ...prev, title: true }))}
              required
            />
            {assignmentTouched.title && assignmentErrors.title ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{assignmentErrors.title}</div>
            ) : null}
            <select
              value={assignmentForm.courseId}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, courseId: event.target.value }))
              }
              onBlur={() => setAssignmentTouched((prev) => ({ ...prev, courseId: true }))}
              required
            >
              <option value="">Select course</option>
              {courseCards.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {assignmentTouched.courseId && assignmentErrors.courseId ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{assignmentErrors.courseId}</div>
            ) : null}
            <button type="submit" className="workspace-primary-button">
              Add assignment
            </button>
          </form>
        </section>
      ) : null}

      <div className="workspace-grid two-columns">
        <section className="workspace-panel">
          <div className="workspace-panel-head">
            <h4>My courses</h4>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => {
                setShowAddAssignment((prev) => !prev);
                setShowCreateCourse(false);
              }}
            >
              + Add assignment
            </button>
          </div>
          <div className="workspace-list">
            {courseCards.map((course) => (
              <div key={course.id} className="workspace-list-item">
                <div>
                  <strong>{course.title}</strong>
                  <p>
                    {course.enrolledCount} enrolled | {course.assignmentCount} assignments |{" "}
                    {course.materialCount} materials
                  </p>
                </div>
                <div className="workspace-inline-actions">
                  <span className={`workspace-badge ${course.badge}`}>{course.badge}</span>
                  <button
                    type="button"
                    className="workspace-link-button"
                    onClick={() => openMaterialPicker(course.id)}
                  >
                    + Material
                  </button>
                  <button
                    type="button"
                    className="workspace-link-button"
                    onClick={() => {
                      setCourseForm({ title: course.title, description: course.description || "" });
                      setShowCreateCourse(true);
                      setShowAddAssignment(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="workspace-link-button danger"
                    onClick={() => removeCourse(course.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <h4>Submissions to grade</h4>
          <div className="workspace-list">
            {submissions.map((submission) => (
              <div key={submission.id} className="workspace-list-item">
                <div>
                  <strong>{submission.title}</strong>
                  <p>
                    {submission.student} | {submission.file}
                  </p>
                </div>
                <button
                  type="button"
                  className="workspace-small-button primary"
                  onClick={() => markGraded(submission.id)}
                >
                  Grade
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="workspace-panel">
        <h4>Assignment analytics</h4>
        <div className="workspace-stat-grid three-up compact">
          <article className="workspace-mini-stat">
            <span>Total submissions</span>
            <strong>4</strong>
          </article>
          <article className="workspace-mini-stat">
            <span>Average marks</span>
            <strong>34</strong>
          </article>
          <article className="workspace-mini-stat">
            <span>Submission rate</span>
            <strong>33%</strong>
          </article>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
