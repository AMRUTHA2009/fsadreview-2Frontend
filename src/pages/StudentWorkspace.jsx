import { Outlet, useLocation } from "react-router-dom";
import WorkspaceLayout from "../components/WorkspaceLayout";

const navItems = [
  { to: "/student", label: "Dashboard", end: true },
  { to: "/student/courses", label: "My Courses" },
  { to: "/student/assignments", label: "Assignments" },
  { to: "/student/progress", label: "Progress" },
];

const pageMeta = {
  "/student": {
    title: "Dashboard",
    subtitle: "Overview of your courses and activity",
  },
  "/student/courses": {
    title: "My Courses",
    subtitle: "Browse and review your enrolled courses",
  },
  "/student/assignments": {
    title: "Assignments",
    subtitle: "View status, submit PDFs, and track feedback",
  },
  "/student/progress": {
    title: "Progress",
    subtitle: "Track completion and grades across your courses",
  },
};

export default function StudentWorkspace() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta["/student"];

  return (
    <WorkspaceLayout
      title={meta.title}
      subtitle={meta.subtitle}
      workspaceLabel="Student Workspace"
      portalLabel="Student Portal"
      navItems={navItems}
    >
      <Outlet />
    </WorkspaceLayout>
  );
}
