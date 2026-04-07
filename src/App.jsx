import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import ToastContainer from "./components/ToastContainer";
import { AuthProvider } from "./context/AuthContext";
import { CourseProvider } from "./context/CourseContext";
import { NotificationProvider } from "./context/NotificationContext";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const DashboardRouter = lazy(() => import("./pages/DashboardRouter"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const StudentWorkspace = lazy(() => import("./pages/StudentWorkspace"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentCourses = lazy(() => import("./pages/StudentCourses"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const StudentProgress = lazy(() => import("./pages/StudentProgress"));
const ContentCreatorDashboard = lazy(() => import("./pages/ContentCreatorDashboard"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CourseProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="page-loading">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardRouter />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/instructor"
                  element={
                    <PrivateRoute allowedRoles={["INSTRUCTOR"]}>
                      <InstructorDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/student"
                  element={
                    <PrivateRoute allowedRoles={["STUDENT"]}>
                      <StudentWorkspace />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<StudentDashboard />} />
                  <Route path="courses" element={<StudentCourses />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="progress" element={<StudentProgress />} />
                </Route>
                <Route
                  path="/content-creator"
                  element={
                    <PrivateRoute allowedRoles={["CONTENT_CREATOR"]}>
                      <ContentCreatorDashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ToastContainer />
          </BrowserRouter>
        </CourseProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
