import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse } from "../context/CourseContext";
import { useNotification } from "../context/NotificationContext";
import { buildStudentAssignments, normalizeCourses } from "../utils/workspaceData";
import { validateRequired } from "../utils/validation";

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

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    refreshCourses().catch(() => {});
  }, [refreshCourses]);

  const assignments = useMemo(
    () => buildStudentAssignments(normalizeCourses(courses)),
    [courses]
  );

  useEffect(() => {
    setItems(assignments);
  }, [assignments]);

  const openSubmission = (assignment) => {
    if (assignment.status === "Graded") {
      notify(`Feedback: ${assignment.grade}`, "success");
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

    setItems((prev) =>
      prev.map((item) =>
        item.id === activeAssignment.id
          ? { ...item, status: "Submitted", grade: comment || "Waiting for review" }
          : item
      )
    );
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
              <tr key={assignment.id}>
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
