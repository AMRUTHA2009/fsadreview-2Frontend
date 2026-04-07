import api from "./api";

export const userService = {
  list: (config = {}) => api.get("/users", config).then((r) => r.data),
  create: (payload) => api.post("/users", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const courseService = {
  list: (params = {}, config = {}) => api.get("/courses", { ...config, params }).then((r) => r.data),
  create: (payload) => api.post("/courses", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/courses/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/courses/${id}`).then((r) => r.data),
};

export const enrollmentService = {
  list: (config = {}) => api.get("/enrollments", config).then((r) => r.data),
  enroll: (payload) => api.post("/enrollments", payload).then((r) => r.data),
  remove: (id) => api.delete(`/enrollments/${id}`).then((r) => r.data),
};

export const assignmentService = {
  list: (courseId, config = {}) =>
    api.get("/assignments", { ...config, params: { courseId } }).then((r) => r.data),
  create: (payload) => api.post("/assignments", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/assignments/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/assignments/${id}`).then((r) => r.data),
};

export const submissionService = {
  list: (assignmentId) =>
    api.get("/submissions", { params: { assignmentId } }).then((r) => r.data),
  create: (payload) => api.post("/submissions", payload).then((r) => r.data),
  upload: async ({ assignmentId, comment, file }) => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("comment", comment || "");
    formData.append("file", file);

    const { data } = await api.post("/submissions/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};

export const analyticsService = {
  admin: () => api.get("/dashboard/admin").then((r) => r.data),
  instructor: () => api.get("/dashboard/instructor").then((r) => r.data),
  student: (config = {}) => api.get("/dashboard/student", config).then((r) => r.data),
  contentCreator: () => api.get("/dashboard/content-creator").then((r) => r.data),
};
