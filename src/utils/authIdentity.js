/**
 * Map JWT/backend user (username/email, optional id) to LMS local user rows.
 */

/** Same student in different shapes (number vs string) after JSON/API. */
export function normalizeStudentId(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

export function studentIdsEqual(a, b) {
  const na = normalizeStudentId(a);
  const nb = normalizeStudentId(b);
  return na !== "" && na === nb;
}

function authLoginString(authUser) {
  if (!authUser) return "";
  const v = authUser.username ?? authUser.userName ?? authUser.login;
  return v != null ? String(v) : "";
}

export function resolveLmsUser(users, authUser) {
  if (!authUser || !Array.isArray(users)) return null;
  const login = authLoginString(authUser);
  return (
    users.find(
      (u) => u.id != null && authUser.id != null && studentIdsEqual(u.id, authUser.id)
    ) ||
    users.find(
      (u) =>
        login !== "" && String(u.username || "").toLowerCase() === login.toLowerCase()
    ) ||
    users.find(
      (u) =>
        authUser.email &&
        String(u.email || "").toLowerCase() === String(authUser.email).toLowerCase()
    ) ||
    null
  );
}

/** Stable student key for submissions / enrollment (prefer LMS id). Always string. */
export function getStudentKey(authUser, users) {
  const row = resolveLmsUser(users, authUser);
  const raw =
    row?.id ||
    authUser?.id ||
    authLoginString(authUser) ||
    authUser?.email ||
    "";
  return normalizeStudentId(raw);
}

export function isStudentEnrolledInCourse(course, authUser, users) {
  const row = resolveLmsUser(users, authUser);
  const keys = [row?.id, authUser?.id, authLoginString(authUser), authUser?.email]
    .map(normalizeStudentId)
    .filter(Boolean);
  return (course.students || []).some((s) => keys.some((k) => studentIdsEqual(s, k)));
}

export function instructorOwnsCourse(course, authUser, users) {
  if (!course || !authUser) return false;
  const row = resolveLmsUser(users, authUser);
  const keys = [row?.id, authUser?.id, authLoginString(authUser), authUser?.email];
  if (keys.some((k) => k != null && studentIdsEqual(course.instructorId, k))) return true;
  const login = authLoginString(authUser);
  if (login && course.instructorUsername === login) return true;
  if (authUser.email && course.instructorEmail === authUser.email) return true;
  return false;
}

export function findStudentRecord(users, studentId) {
  const sid = normalizeStudentId(studentId);
  if (!sid) return null;
  return (
    (users || []).find((u) => studentIdsEqual(u.id, sid)) ||
    (users || []).find((u) => studentIdsEqual(u.username, sid)) ||
    (users || []).find((u) => studentIdsEqual(u.email, sid)) ||
    null
  );
}

/** Match submission rows created with id, username, or email as studentId. */
export function submissionBelongsToStudent(sub, authUser, users) {
  if (!sub || !authUser) return false;
  const sid = normalizeStudentId(sub.studentId);
  if (!sid) return false;
  const key = getStudentKey(authUser, users);
  if (key && sid === key) return true;
  const row = resolveLmsUser(users, authUser);
  const candidates = [key, row?.id, authUser?.id, authLoginString(authUser), authUser?.email]
    .map(normalizeStudentId)
    .filter(Boolean);
  return candidates.includes(sid);
}
