import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { normalizeCourses } from "../utils/workspaceData";
import { validateRequired } from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import { useLms } from "../context/LmsContext";
import { getStudentKey, isStudentEnrolledInCourse, submissionBelongsToStudent } from "../utils/authIdentity";

export default function StudentAssignments() {
  const { courses, refreshCourses } = useCourse();
  const hasLoaded = useRef(false);
  const { notify } = useNotification();
  const [items, setItems] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const lms = useLms();

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const studentCourses = useMemo(
    () =>
      (lms.courses || []).filter(
        (c) => c.enabled && isStudentEnrolledInCourse(c, user, lms.users || [])
      ),
    [lms.courses, lms.users, user]
  );

  const assignments = useMemo(() => {
    const list = [];
    for (const course of studentCourses) {
      for (const a of course.assignments || []) {
        const sub = (a.submissions || []).find((s) => submissionBelongsToStudent(s, user, lms.users || []));
        const dueDate = a.deadline ? new Date(a.deadline).toLocaleString() : "-";
        const now = Date.now();
        const deadlineMs = a.deadline ? new Date(a.deadline).getTime() : NaN;
        const overdue = Number.isFinite(deadlineMs) && now > deadlineMs && (!sub || sub.status !== "Graded");
        const status = sub?.status || (overdue ? "Overdue" : "Pending");
        const grade = sub?.status === "Graded" ? `${sub.marks ?? "-"} | ${sub.feedback || ""}` : "-";
        const isSubmitted = Boolean(sub && sub.status !== "Graded");
        list.push({
          id: a.id,
          rowKey: `${course.id}:${a.id}`,
          courseId: course.id,
          course: course.title,
          title: a.title,
          dueDate,
          status,
          grade,
          action: sub?.status === "Graded" ? "View" : isSubmitted ? "Submitted" : "Submit PDF",
          actionDisabled: isSubmitted,
        });
      }
    }
    return list;
  }, [studentCourses, user, lms.users]);

  useEffect(() => {
    setItems(assignments);
  }, [assignments]);

  const openSubmission = (assignment) => {
    if (assignment.status === "Graded") {
      notify(`Feedback: ${assignment.grade}`, "success");
      return;
    }
    if (assignment.actionDisabled) {
      notify("Assignment already submitted.", "info");
      return;
    }
    setActiveAssignment(assignment);
  };

  const submitFile = (event) => {
    event.preventDefault();
    const nextErrors = {
      file: validateRequired(selectedFile, "File is required"),
    };
    setErrors(nextErrors);
    setTouched({ file: true });
    if (!activeAssignment || nextErrors.file) return;

    const studentId = getStudentKey(user, lms.users || []);
    if (!studentId) {
      notify("Could not resolve your student profile. Try logging in again.", "error");
      return;
    }
    lms.submitAssignment({
      courseId: activeAssignment.courseId,
      assignmentId: activeAssignment.id,
      studentId,
      fileName: `${selectedFile} (${new Date().toLocaleTimeString()})`,
    });
    notify(`Submitted ${selectedFile} for ${activeAssignment.title}.`, "success");
    setActiveAssignment(null);
    setSelectedFile("");
    setComment("");
  };

  return (
    <>
      <section className="workspace-table-card">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Assignment</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Grade / Feedback</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((assignment) => (
              <tr key={assignment.rowKey || assignment.id}>
                <td>{assignment.course}</td>
                <td>{assignment.title}</td>
                <td>{assignment.dueDate}</td>
                <td>
                  <span
                    className={`workspace-badge ${
                      assignment.status === "Graded"
                        ? "graded"
                        : assignment.status === "Submitted"
                          ? "published"
                          : "overdue"
                    }`}
                  >
                    {assignment.status}
                  </span>
                </td>
                <td>{assignment.grade}</td>
                <td>
                  <button
                    type="button"
                    className="workspace-small-button primary"
                    onClick={() => openSubmission(assignment)}
                    disabled={assignment.actionDisabled}
                  >
                    {assignment.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {activeAssignment ? (
        <section className="workspace-panel workspace-upload-panel">
          <div className="workspace-panel-head">
            <h4>Submit PDF</h4>
            <button
              type="button"
              className="workspace-link-button"
              onClick={() => setActiveAssignment(null)}
            >
              Close
            </button>
          </div>
          <form className="workspace-upload-form" onSubmit={submitFile}>
            <input value={activeAssignment.title} readOnly />
            <input
              type="file"
              accept=".pdf"
              onChange={(event) => {
                const next = event.target.files?.[0]?.name || "";
                setSelectedFile(next);
                setErrors((prev) => ({ ...prev, file: validateRequired(next, "File is required") }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, file: true }))}
              required
            />
            {touched.file && errors.file ? (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.file}</div>
            ) : null}
            <input
              placeholder="Comment (optional)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button type="submit" className="workspace-primary-button" disabled={!selectedFile}>
              Submit PDF
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
