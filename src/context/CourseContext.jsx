import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { courseService } from "../services/lmsService";

const CourseContext = createContext(null);

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const refreshCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const data = await courseService.list({}, { skipGlobalErrorHandler: true });
      setCourses(Array.isArray(data) ? data : data?.content || []);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      courses,
      setCourses,
      loadingCourses,
      refreshCourses,
    }),
    [courses, loadingCourses, refreshCourses]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourse must be used inside CourseProvider");
  }
  return context;
}
