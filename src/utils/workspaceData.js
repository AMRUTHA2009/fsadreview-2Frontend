export const fallbackCourses = [
  {
    id: "course-1",
    title: "Introduction to Machine Learning",
    description: "Fundamentals of ML",
    status: "Published",
    badge: "published",
    enrolledCount: 2,
    assignmentCount: 3,
    materialCount: 3,
  },
  {
    id: "course-2",
    title: "Product Design Basics",
    description: "Design systems and research methods",
    status: "Published",
    badge: "published",
    enrolledCount: 2,
    assignmentCount: 1,
    materialCount: 1,
  },
  {
    id: "course-3",
    title: "Research Methods",
    description: "Academic and product research workflows",
    status: "Draft",
    badge: "draft",
    enrolledCount: 0,
    assignmentCount: 0,
    materialCount: 0,
  },
];

export function getDisplayName(user) {
  return user?.email || user?.username || "Workspace user";
}

export function getUserInitial(user) {
  const source = user?.username || user?.email || "U";
  return source.charAt(0).toUpperCase();
}

export function normalizeCourses(courses = []) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return fallbackCourses;
  }

  return courses.map((course, index) => ({
    id: course.id ?? `course-${index + 1}`,
    title: course.title || course.name || `Course ${index + 1}`,
    description: course.description || "Course overview and learning materials",
    status: course.status || (index % 3 === 2 ? "Draft" : "Published"),
    badge: (course.status || (index % 3 === 2 ? "Draft" : "Published")).toLowerCase(),
    enrolledCount: course.enrolledCount ?? course.studentsCount ?? Math.max(0, 2 - index),
    assignmentCount: course.assignmentCount ?? Math.max(0, 3 - index),
    materialCount: course.materialCount ?? Math.max(0, 3 - index),
  }));
}

export function buildStudentAssignments(courseList = []) {
  const courses = courseList.length > 0 ? courseList : fallbackCourses;
  return [
    {
      id: "assign-1",
      course: courses[0]?.title || "Introduction to Machine Learning",
      title: "Project Milestone 1",
      dueDate: "2/3/2026",
      status: "Overdue",
      grade: "-",
      action: "Submit PDF",
    },
    {
      id: "assign-2",
      course: courses[0]?.title || "Introduction to Machine Learning",
      title: "Weekly Quiz 1",
      dueDate: "21/2/2026",
      status: "Graded",
      grade: "18/20 | Good work!",
      action: "View",
    },
    {
      id: "assign-3",
      course: courses[1]?.title || "Product Design Basics",
      title: "Design Critique",
      dueDate: "9/3/2026",
      status: "Overdue",
      grade: "-",
      action: "Submit PDF",
    },
  ];
}

export function buildStudentProgress(courseList = []) {
  const courses = courseList.length > 0 ? courseList : fallbackCourses;
  return [
    {
      id: "progress-1",
      title: courses[0]?.title || "Introduction to Machine Learning",
      completion: 80,
      grade: "90%",
    },
    {
      id: "progress-2",
      title: courses[1]?.title || "Product Design Basics",
      completion: 60,
      grade: "-",
    },
  ];
}

export function buildInstructorSubmissions() {
  return [
    {
      id: "submission-1",
      title: "Weekly Quiz 1",
      student: "2400031914@kluniversity.in",
      file: "Mid-1tt.pdf",
    },
    {
      id: "submission-2",
      title: "Project Milestone 1",
      student: "2400031914@kluniversity.in",
      file: "ALM-6_CO-3.pdf",
    },
  ];
}

export function buildContentMaterials(courseList = []) {
  const courses = courseList.length > 0 ? courseList : fallbackCourses;
  return [
    {
      id: "material-1",
      title: "Week 1 - Introduction",
      course: courses[0]?.title || "Introduction to Machine Learning",
      type: "PDF",
    },
    {
      id: "material-2",
      title: "Week 2 - Linear Regression",
      course: courses[0]?.title || "Introduction to Machine Learning",
      type: "PDF",
    },
    {
      id: "material-3",
      title: "Quiz: Module 1",
      course: courses[0]?.title || "Introduction to Machine Learning",
      type: "PDF",
    },
    {
      id: "material-4",
      title: "Design Thinking Overview",
      course: courses[1]?.title || "Product Design Basics",
      type: "PDF",
    },
  ];
}
