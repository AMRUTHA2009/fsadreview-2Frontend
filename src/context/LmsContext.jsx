import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { normalizeStudentId, studentIdsEqual } from "../utils/authIdentity";

const LmsContext = createContext(null);

const STORAGE_KEY = "novalearn_lms_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeSeedUserRoles(state) {
  if (!state || !Array.isArray(state.users)) return state;
  const roleByEmail = {
    "admin@lms.edu": "ADMIN",
    "instructor@lms.edu": "INSTRUCTOR",
    "content@lms.edu": "CONTENT_CREATOR",
    "student@lms.edu": "STUDENT",
  };
  return {
    ...state,
    users: state.users.map((u) => {
      const key = String(u.email || "").toLowerCase();
      const expectedRole = roleByEmail[key];
      return expectedRole ? { ...u, role: expectedRole } : u;
    }),
  };
}

function withoutHeavyPreviewData(state) {
  return {
    ...state,
    courses: (state.courses || []).map((c) => ({
      ...c,
      materials: (c.materials || []).map((m) => ({
        ...m,
        previewUrl: "",
        versionHistory: (m.versionHistory || []).map((v) => ({ ...v, previewUrl: "" })),
      })),
    })),
  };
}

function seedState() {
  const users = [
    { id: "u_admin", username: "admin", email: "admin@lms.edu", password: "Admin@123", role: "ADMIN", enabled: true },
    { id: "u_inst", username: "instructor", email: "instructor@lms.edu", password: "Instructor@123", role: "INSTRUCTOR", enabled: true },
    { id: "u_cc", username: "contentcreator", email: "content@lms.edu", password: "Content@123", role: "CONTENT_CREATOR", enabled: true },
    { id: "u_student", username: "student", email: "student@lms.edu", password: "Student@123", role: "STUDENT", enabled: true },
  ];

  const courseId = "course-ml";
  return {
    version: 1,
    darkMode: false,
    users,
    courses: [
      {
        id: courseId,
        title: "Introduction to Machine Learning",
        instructorId: "u_inst",
        instructorUsername: "instructor",
        instructorEmail: "instructor@lms.edu",
        enabled: true,
        students: ["u_student"],
        assignments: [
          {
            id: "assign-quiz-1",
            title: "Weekly Quiz 1",
            description: "Answer the quiz questions and upload your PDF.",
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            submissions: [],
          },
        ],
        materials: [
          {
            id: "mat-1",
            type: "PDF",
            title: "Week 1 - Introduction",
            fileName: "Week1.pdf",
            courseId,
            versionHistory: [{ at: nowIso(), type: "PDF", title: "Week 1 - Introduction", fileName: "Week1.pdf" }],
          },
        ],
      },
    ],
    activityLogs: [{ id: uid("log"), at: nowIso(), message: "System initialized." }],
  };
}

export function LmsProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = loadState();
    return normalizeSeedUserRoles(saved || seedState());
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      const name = String(error?.name || "");
      if (name.includes("QuotaExceeded")) {
        const slim = withoutHeavyPreviewData(state);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
          setState(slim);
        } catch {
          // Keep app running even if persistence fails.
        }
      }
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.darkMode ? "dark" : "light";
  }, [state.darkMode]);

  const addLog = useCallback((message) => {
    setState((prev) => ({
      ...prev,
      activityLogs: [{ id: uid("log"), at: nowIso(), message }, ...prev.activityLogs].slice(0, 50),
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const registerUser = useCallback(
    ({ username, email, password, role }) => {
      setState((prev) => {
        if (
          prev.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase()) ||
          prev.users.some((u) => String(u.username || "").toLowerCase() === String(username || "").toLowerCase())
        ) {
          return prev;
        }
        const user = { id: uid("u"), username, email, password, role, enabled: true };
        return { ...prev, users: [user, ...prev.users] };
      });
      addLog(`New user registered: ${username || email}`);
    },
    [addLog]
  );

  const updateUserRole = useCallback(
    (userId, role) => {
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      }));
      addLog(`Admin updated role for user ${userId} to ${role}`);
    },
    [addLog]
  );

  const createCourse = useCallback(
    ({ title, instructorId, description, instructorUsername, instructorEmail }) => {
      const id = uid("course");
      setState((prev) => ({
        ...prev,
        courses: [
          {
            id,
            title,
            description: description || "Course overview and learning materials",
            instructorId,
            instructorUsername: instructorUsername || "",
            instructorEmail: instructorEmail || "",
            enabled: true,
            students: [],
            assignments: [],
            materials: [],
          },
          ...prev.courses,
        ],
      }));
      addLog(`Instructor created course: ${title}`);
      return id;
    },
    [addLog]
  );

  const toggleCourseEnabled = useCallback(
    (courseId) => {
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => (c.id === courseId ? { ...c, enabled: !c.enabled } : c)),
      }));
      addLog(`Admin toggled course ${courseId} enabled/disabled`);
    },
    [addLog]
  );

  const addAssignment = useCallback(
    ({ courseId, title, description, deadline }) => {
      const assignmentId = uid("assign");
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) =>
          c.id !== courseId
            ? c
            : {
                ...c,
                assignments: [
                  ...c.assignments,
                  { id: assignmentId, title, description: description || "", deadline, submissions: [] },
                ],
              }
        ),
      }));
      addLog(`Instructor added assignment "${title}" to course ${courseId}`);
      return assignmentId;
    },
    [addLog]
  );

  const enrollInCourse = useCallback(
    ({ courseId, studentId }) => {
      const sid = normalizeStudentId(studentId);
      if (!sid) return;
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          const merged = [...(c.students || []).map(normalizeStudentId), sid].filter(Boolean);
          return { ...c, students: Array.from(new Set(merged)) };
        }),
      }));
      addLog(`Student ${sid} enrolled in course ${courseId}`);
    },
    [addLog]
  );

  const submitAssignment = useCallback(
    ({ courseId, assignmentId, studentId, fileName }) => {
      const sid = normalizeStudentId(studentId);
      if (!sid) return;
      const submittedAt = nowIso();
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            assignments: c.assignments.map((a) => {
              if (a.id !== assignmentId) return a;
              const deadlineMs = new Date(a.deadline).getTime();
              const submittedMs = new Date(submittedAt).getTime();
              const late = Number.isFinite(deadlineMs) && submittedMs > deadlineMs;
              const status = late ? "Late" : "Submitted";
              const existing = a.submissions.find((s) => studentIdsEqual(s.studentId, sid));
              const submission = {
                studentId: sid,
                fileName,
                submittedAt,
                marks: existing?.marks ?? null,
                feedback: existing?.feedback ?? "",
                status: existing?.status === "Graded" ? "Graded" : status,
              };
              const submissions = [
                ...a.submissions.filter((s) => !studentIdsEqual(s.studentId, sid)),
                submission,
              ];
              return { ...a, submissions };
            }),
          };
        }),
      }));
      addLog(`Student ${sid} submitted ${fileName} for assignment ${assignmentId}`);
    },
    [addLog]
  );

  const gradeSubmission = useCallback(
    ({ courseId, assignmentId, studentId, marks, feedback }) => {
      const sid = normalizeStudentId(studentId);
      if (!sid) return;
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            assignments: c.assignments.map((a) => {
              if (a.id !== assignmentId) return a;
              return {
                ...a,
                submissions: a.submissions.map((s) =>
                  !studentIdsEqual(s.studentId, sid)
                    ? s
                    : { ...s, marks: Number(marks), feedback: String(feedback || ""), status: "Graded" }
                ),
              };
            }),
          };
        }),
      }));
      addLog(`Instructor graded submission for student ${sid} on assignment ${assignmentId}`);
    },
    [addLog]
  );

  const addMaterial = useCallback(
    ({ courseId, type, title, fileName, videoUrl, previewUrl }) => {
      const id = uid("mat");
      const entry = {
        id,
        courseId,
        type,
        title,
        fileName: fileName || "",
        videoUrl: videoUrl || "",
        previewUrl: previewUrl || "",
        versionHistory: [
          { at: nowIso(), type, title, fileName: fileName || "", videoUrl: videoUrl || "", previewUrl: previewUrl || "" },
        ],
      };
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => (c.id === courseId ? { ...c, materials: [entry, ...(c.materials || [])] } : c)),
      }));
      addLog(`Content uploaded: ${title} to course ${courseId}`);
    },
    [addLog]
  );

  const updateMaterial = useCallback(
    ({ courseId, materialId, type, title, fileName, videoUrl, previewUrl }) => {
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            materials: (c.materials || []).map((m) =>
              m.id !== materialId
                ? m
                : {
                    ...m,
                    type,
                    title,
                    fileName: fileName || "",
                    videoUrl: videoUrl || "",
                    previewUrl: previewUrl || "",
                    versionHistory: [
                      { at: nowIso(), type, title, fileName: fileName || "", videoUrl: videoUrl || "", previewUrl: previewUrl || "" },
                      ...(m.versionHistory || []),
                    ].slice(0, 10),
                  }
            ),
          };
        }),
      }));
      addLog(`Content updated: ${materialId} in course ${courseId}`);
    },
    [addLog]
  );

  const removeMaterial = useCallback(
    ({ courseId, materialId }) => {
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === courseId ? { ...c, materials: (c.materials || []).filter((m) => m.id !== materialId) } : c
        ),
      }));
      addLog(`Content deleted: ${materialId} from course ${courseId}`);
    },
    [addLog]
  );

  const value = useMemo(
    () => ({
      state,
      users: state.users,
      courses: state.courses,
      activityLogs: state.activityLogs,
      darkMode: state.darkMode,
      toggleDarkMode,
      registerUser,
      updateUserRole,
      createCourse,
      toggleCourseEnabled,
      addAssignment,
      enrollInCourse,
      submitAssignment,
      gradeSubmission,
      addMaterial,
      updateMaterial,
      removeMaterial,
    }),
    [
      state,
      toggleDarkMode,
      registerUser,
      updateUserRole,
      createCourse,
      toggleCourseEnabled,
      addAssignment,
      enrollInCourse,
      submitAssignment,
      gradeSubmission,
      addMaterial,
      updateMaterial,
      removeMaterial,
    ]
  );

  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>;
}

export function useLms() {
  const ctx = useContext(LmsContext);
  if (!ctx) throw new Error("useLms must be used inside LmsProvider");
  return ctx;
}

