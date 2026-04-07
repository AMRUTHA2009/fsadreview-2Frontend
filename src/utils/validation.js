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

