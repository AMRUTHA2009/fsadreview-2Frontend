import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { normalizeCourses } from "../utils/workspaceData";
import { validateRequired } from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import { useLms } from "../context/LmsContext";
import { findStudentRecord, instructorOwnsCourse, resolveLmsUser } from "../utils/authIdentity";

const navItems = [{ to: "/instructor", label: "Dashboard", end: true }];

export default function InstructorDashboard() {
  const { courses, refreshCourses } = useCourse();
  const { notify } = useNotification();
  const { user } = useAuth();
  const lms = useLms();
  const [courseCards, setCourseCards] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState("");
  const [activeAssignmentId, setActiveAssignmentId] = useState("");
  const [grading, setGrading] = useState({ studentId: "", marks: "", feedback: "" });
  const [gradingTouched, setGradingTouched] = useState({});
  const [gradingErrors, setGradingErrors] = useState({});
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", deadline: "", courseId: "" });
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
  const myCourses = useMemo(
    () => (lms.courses || []).filter((c) => instructorOwnsCourse(c, user, lms.users || [])),
    [lms.courses, lms.users, user]
  );

  const selectedCourse = useMemo(
    () => myCourses.find((c) => c.id === activeCourseId) || myCourses[0] || null,
    [activeCourseId, myCourses]
  );

  const selectedAssignment = useMemo(() => {
    if (!selectedCourse) return null;
    return selectedCourse.assignments.find((a) => a.id === activeAssignmentId) || selectedCourse.assignments[0] || null;
  }, [activeAssignmentId, selectedCourse]);

  const submissions = useMemo(() => {
    if (!selectedAssignment) return [];
    return selectedAssignment.submissions || [];
  }, [selectedAssignment]);

  useEffect(() => {
    setCourseCards(visibleCourses);
  }, [visibleCourses]);

  const removeCourse = (courseId) => {
    setCourseCards((prev) => prev.filter((course) => course.id !== courseId));
  };

  const submitCourse = (event) => {
    event.preventDefault();
    const title = courseForm.title.trim();
    const nextErrors = { title: validateRequired(title, "Course title is required") };
    setCourseErrors(nextErrors);
    setCourseTouched({ title: true });
    if (nextErrors.title) return;

    const lmsUser = resolveLmsUser(lms.users || [], user);
    const newId = lms.createCourse({
      title,
      description: courseForm.description.trim(),
      instructorId: lmsUser?.id || user?.id,
      instructorUsername: user?.username,
      instructorEmail: user?.email,
    });
    setCourseCards((prev) => [
      {
        id: newId,
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
      deadline: validateRequired(assignmentForm.deadline, "Deadline is required"),
    };
    setAssignmentErrors(nextErrors);
    setAssignmentTouched({ title: true, courseId: true });
    if (nextErrors.title || nextErrors.courseId || nextErrors.deadline) return;

    lms.addAssignment({
      courseId: assignmentForm.courseId,
      title: assignmentForm.title.trim(),
      description: assignmentForm.description.trim(),
      deadline: new Date(assignmentForm.deadline).toISOString(),
    });
    notify(`${assignmentForm.title} added successfully.`, "success");
    setAssignmentForm({ title: "", description: "", deadline: "", courseId: "" });
    setShowAddAssignment(false);
  };

  const validateGrading = (next = grading) => {
    const nextErrors = {
      studentId: validateRequired(next.studentId, "Student is required"),
      marks: validateRequired(String(next.marks), "Marks are required"),
    };
    setGradingErrors(nextErrors);
    return nextErrors;
  };

  const submitGrade = (event) => {
    event.preventDefault();
    const nextErrors = validateGrading(grading);
    setGradingTouched({ studentId: true, marks: true });
    if (Object.values(nextErrors).some(Boolean)) return;
    if (!selectedCourse || !selectedAssignment) return;
    lms.gradeSubmission({
      courseId: selectedCourse.id,
      assignmentId: selectedAssignment.id,
      studentId: grading.studentId,
      marks: grading.marks,
      feedback: grading.feedback,
    });
    notify("Submission graded.", "success");
    setGrading({ studentId: "", marks: "", feedback: "" });
    setGradingTouched({});
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
              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {assignmentTouched.courseId && assignmentErrors.courseId ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{assignmentErrors.courseId}</div>
            ) : null}
            <input
              type="datetime-local"
              value={assignmentForm.deadline}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, deadline: event.target.value }))}
              onBlur={() => setAssignmentTouched((prev) => ({ ...prev, deadline: true }))}
              required
            />
            {assignmentTouched.deadline && assignmentErrors.deadline ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{assignmentErrors.deadline}</div>
            ) : null}
            <input
              placeholder="Description (optional)"
              value={assignmentForm.description}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
            />
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
            {myCourses.map((course) => (
              <div key={course.id} className="workspace-list-item">
                <div>
                  <strong>{course.title}</strong>
                  <p>
                    {(course.students || []).length} enrolled | {(course.assignments || []).length} assignments |{" "}
                    {(course.materials || []).length} materials
                  </p>
                </div>
                <div className="workspace-inline-actions">
                  <span className={`workspace-badge ${course.enabled ? "published" : "disabled"}`}>
                    {course.enabled ? "enabled" : "disabled"}
                  </span>
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
                      setActiveCourseId(course.id);
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
          <div style={{ marginBottom: 12 }}>
            <select
              value={activeCourseId || selectedCourse?.id || ""}
              onChange={(e) => {
                setActiveCourseId(e.target.value);
                setActiveAssignmentId("");
              }}
            >
              <option value="">Select course</option>
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={activeAssignmentId || selectedAssignment?.id || ""}
              onChange={(e) => setActiveAssignmentId(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="">Select assignment</option>
              {(selectedCourse?.assignments || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div className="workspace-list">
            {submissions.length === 0 ? (
              <div className="workspace-muted">No submissions yet.</div>
            ) : (
              submissions.map((s) => {
                const student = findStudentRecord(lms.users || [], s.studentId);
                return (
                  <div key={`${s.studentId}-${s.submittedAt || ""}`} className="workspace-list-item">
                    <div>
                      <strong>{student?.email || student?.username || s.studentId}</strong>
                      <p>
                        {selectedAssignment?.title} | {s.fileName} | {s.status}
                      </p>
                    </div>
                    <span className={`workspace-badge ${s.status === "Graded" ? "published" : "draft"}`}>
                      {s.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {selectedCourse && selectedAssignment && submissions.length > 0 ? (
            <form className="workspace-upload-form" onSubmit={submitGrade} style={{ marginTop: 12 }}>
              <select
                value={grading.studentId}
                onChange={(e) => {
                  const next = { ...grading, studentId: e.target.value };
                  setGrading(next);
                  validateGrading(next);
                }}
                onBlur={() => setGradingTouched((p) => ({ ...p, studentId: true }))}
                required
              >
                <option value="">Select student</option>
                {submissions.map((s) => {
                  const student = findStudentRecord(lms.users || [], s.studentId);
                  return (
                    <option key={s.studentId} value={s.studentId}>
                      {student?.email || student?.username || s.studentId}
                    </option>
                  );
                })}
              </select>
              {gradingTouched.studentId && gradingErrors.studentId ? (
                <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{gradingErrors.studentId}</div>
              ) : null}
              <input
                type="number"
                placeholder="Marks"
                value={grading.marks}
                onChange={(e) => {
                  const next = { ...grading, marks: e.target.value };
                  setGrading(next);
                  validateGrading(next);
                }}
                onBlur={() => setGradingTouched((p) => ({ ...p, marks: true }))}
                required
              />
              {gradingTouched.marks && gradingErrors.marks ? (
                <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{gradingErrors.marks}</div>
              ) : null}
              <textarea
                placeholder="Feedback (optional)"
                value={grading.feedback}
                onChange={(e) => setGrading((p) => ({ ...p, feedback: e.target.value }))}
              />
              <button type="submit" className="workspace-primary-button">
                Save grade
              </button>
            </form>
          ) : null}
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
