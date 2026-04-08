import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useLms } from "./LmsContext";

const CourseContext = createContext(null);

export function CourseProvider({ children }) {
  const lms = useLms();
  const [courses, setCourses] = useState(() => lms.courses || []);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const refreshCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      setCourses(lms.courses || []);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [lms.courses]);

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
