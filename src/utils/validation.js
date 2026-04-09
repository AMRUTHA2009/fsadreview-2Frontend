export function isBlank(value) {
  return !String(value ?? "").trim();
}

export function isValidEmail(email) {
  const value = String(email ?? "").trim();
  if (!value) return false;
  // Simple, practical email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function minLength(value, length) {
  return String(value ?? "").length >= length;
}

export function validateRequired(value, message = "This field is required") {
  return isBlank(value) ? message : "";
}

export function validateEmail(value, message = "Enter a valid email") {
  return isValidEmail(value) ? "" : message;
}

export function validateMinLength(value, length, message) {
  return minLength(value, length) ? "" : message || `Must be at least ${length} characters`;
}

/** At least 8 chars, at least one letter, one digit, one special char. */
export function isValidRegistrationPassword(value) {
  const s = String(value ?? "");
  if (s.length < 8) return false;
  if (!/[a-zA-Z]/.test(s)) return false;
  if (!/[0-9]/.test(s)) return false;
  if (!/[^a-zA-Z0-9]/.test(s)) return false;
  return true;
}

export function validateRegistrationPassword(
  value,
  message = "Password must be at least 8 characters and include letters, numbers, and a special character"
) {
  return isValidRegistrationPassword(value) ? "" : message;
}

export const REGISTER_EMAIL_MESSAGE = "Please enter a valid email address";
export const REGISTER_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include letters, numbers, and a special character";
export const ALL_FIELDS_REQUIRED = "All fields are required";

/** Map register API failure to a stable UI message (duplicate email → User already exists). */
export function mapRegisterApiError(error) {
  const status = error?.response?.status;
  const raw = error?.response?.data?.message || error?.response?.data?.error || "";
  const msg = String(raw).toLowerCase();
  if (
    /username/.test(msg) &&
    /already|exists|duplicate|registered|taken|in use|validation failed/.test(msg)
  ) {
    return { type: "duplicate", field: "username", message: "Username already exists, try different username" };
  }
  if (
    /email/.test(msg) &&
    /already|exists|duplicate|registered|taken|in use|validation failed/.test(msg)
  ) {
    return { type: "duplicate", field: "email", message: "Gmail already used" };
  }
  if (status === 409) {
    return { type: "duplicate", field: "email", message: "Gmail already used" };
  }
  if (/already|exists|duplicate|registered|taken|in use/.test(msg)) {
    return { type: "duplicate", field: "username", message: "Username already exists, try different username" };
  }
  if (/validation failed/.test(msg)) {
    return { type: "duplicate", field: "username", message: "Username already exists, try different username" };
  }
  return { type: "generic", field: null, message: String(raw).trim() || "Registration failed" };
}

/** Map login API failure to field-level messages where possible. */
export function mapLoginApiError(error) {
  const status = error?.response?.status;
  const raw = error?.response?.data?.message || error?.response?.data?.error || "";
  const msg = String(raw).toLowerCase();

  if (
    status === 404 ||
    /user not found|username not found|unknown user|no user stored|does not exist|doesn't exist/.test(msg)
  ) {
    return { field: "username", message: "User not found" };
  }
  if (/not found/.test(msg) && (/user|username|account|email/.test(msg) || status === 400 || status === 404)) {
    return { field: "username", message: "User not found" };
  }
  if (
    /wrong password|bad password|invalid password|incorrect password|password mismatch|invalid credentials/.test(
      msg
    )
  ) {
    return { field: "password", message: "Wrong password" };
  }
  if (status === 401 || /unauthorized|authentication failed/.test(msg)) {
    return { field: "password", message: "Wrong password" };
  }
  return { field: null, message: String(raw).trim() || "Invalid login" };
}

