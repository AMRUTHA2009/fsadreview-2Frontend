const APP_ROLES = new Set(["ADMIN", "INSTRUCTOR", "CONTENT_CREATOR", "STUDENT"]);

/**
 * Map Spring Security / API role strings to app route roles (ADMIN, INSTRUCTOR, …).
 */
export function normalizeAppRole(raw) {
  if (raw == null || raw === "") return "";
  let r = String(raw).trim().toUpperCase().replace(/^ROLE_/, "");
  if (r === "CONTENTCREATOR") r = "CONTENT_CREATOR";
  if (APP_ROLES.has(r)) return r;
  return r;
}

function pickRoleFromPayload(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (payload.role != null && payload.role !== "") return payload.role;
  const authorities = payload.authorities || payload.roles;
  if (Array.isArray(authorities) && authorities.length) {
    const first = authorities[0];
    if (typeof first === "string") return first;
    if (first && typeof first.authority === "string") return first.authority;
  }
  return "";
}

/**
 * Ensure stored user has uppercase app role and missing fields filled from OTP username.
 */
export function normalizeAuthUser(payload, fallbackUsername) {
  if (!payload || typeof payload !== "object") {
    return fallbackUsername ? { username: fallbackUsername, role: "" } : null;
  }
  const role = normalizeAppRole(pickRoleFromPayload(payload) || payload.role);
  return {
    ...payload,
    role,
    username: payload.username != null && payload.username !== "" ? payload.username : fallbackUsername || "",
  };
}
