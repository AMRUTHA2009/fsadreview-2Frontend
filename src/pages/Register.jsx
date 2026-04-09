import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import {
  ALL_FIELDS_REQUIRED,
  REGISTER_EMAIL_MESSAGE,
  REGISTER_PASSWORD_MESSAGE,
  isValidEmail,
  isValidRegistrationPassword,
  mapRegisterApiError,
} from "../utils/validation";
import { registerUser } from "../services/authService";
import { useLms } from "../context/LmsContext";

function trim(v) {
  return String(v ?? "").trim();
}

export default function Register() {
  const lms = useLms();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  /**
   * @param {boolean} submit - if true, validate all fields; if false, only touched fields
   */
  const validate = (next = form, submit = false) => {
    const u = trim(next.username);
    const e = trim(next.email);
    const p = trim(next.password);
    const r = trim(next.role);

    const nextErrors = { username: "", email: "", password: "", role: "" };

    if (submit) {
      if (!u) nextErrors.username = ALL_FIELDS_REQUIRED;
      if (!e) nextErrors.email = ALL_FIELDS_REQUIRED;
      else if (!isValidEmail(e)) nextErrors.email = REGISTER_EMAIL_MESSAGE;
      if (!p) nextErrors.password = ALL_FIELDS_REQUIRED;
      else if (!isValidRegistrationPassword(p)) nextErrors.password = REGISTER_PASSWORD_MESSAGE;
      if (!r) nextErrors.role = ALL_FIELDS_REQUIRED;
    } else {
      if (touched.username) nextErrors.username = u ? "" : ALL_FIELDS_REQUIRED;
      if (touched.email) {
        if (!e) nextErrors.email = ALL_FIELDS_REQUIRED;
        else if (!isValidEmail(e)) nextErrors.email = REGISTER_EMAIL_MESSAGE;
      }
      if (touched.password) {
        if (!p) nextErrors.password = ALL_FIELDS_REQUIRED;
        else if (!isValidRegistrationPassword(p)) nextErrors.password = REGISTER_PASSWORD_MESSAGE;
      }
      if (touched.role) nextErrors.role = r ? "" : ALL_FIELDS_REQUIRED;
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setBackendError("");
    const nextErrors = validate(form, true);
    setTouched({ username: true, email: true, password: true, role: true });
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const data = await registerUser(form);
      // Keep local LMS admin list in sync with successful backend registrations.
      lms.registerUser(form);
      notify(data?.message || "Registration successful. Please verify OTP.", "success");
      navigate("/verify-otp", { state: { username: form.username } });
    } catch (error) {
      const mapped = mapRegisterApiError(error);
      if (mapped.type === "duplicate") {
        const field = mapped.field || "username";
        setErrors((prev) => ({ ...prev, [field]: mapped.message }));
        setTouched((prev) => ({ ...prev, [field]: true }));
        notify(mapped.message, "error");
      } else {
        setBackendError(mapped.message);
        notify(mapped.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate({ ...form }, false);
  };

  const setField = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (field === "email" || field === "username") {
      setErrors((prev) => ({
        ...prev,
        username:
          field === "username" && prev.username === "Username already exists, try different username"
            ? ""
            : prev.username,
        email: field === "email" && prev.email === "Gmail already used" ? "" : prev.email,
      }));
    }
    validate(next, false);
  };

  const fieldError = (field) => (touched[field] ? errors[field] : "");
  const showInvalid = (field) => Boolean(touched[field] && errors[field]);

  return (
    <main className="auth-card">
      <h2>Create account</h2>
      {backendError ? (
        <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{backendError}</div>
      ) : null}
      <form onSubmit={handleSubmit} noValidate>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          className={showInvalid("username") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("username", e.target.value)}
          onBlur={() => onBlur("username")}
        />
        {fieldError("username") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{fieldError("username")}</div>
        ) : null}
        <input
          name="email"
          type="text"
          autoComplete="email"
          placeholder="Email"
          value={form.email}
          className={showInvalid("email") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => onBlur("email")}
        />
        {fieldError("email") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{fieldError("email")}</div>
        ) : null}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          value={form.password}
          className={showInvalid("password") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => onBlur("password")}
        />
        {fieldError("password") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
            {fieldError("password")}
          </div>
        ) : null}
        <select
          value={form.role}
          className={showInvalid("role") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("role", e.target.value)}
          onBlur={() => onBlur("role")}
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="CONTENT_CREATOR">Content Creator</option>
          <option value="ADMIN">Admin</option>
        </select>
        {fieldError("role") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{fieldError("role")}</div>
        ) : null}
        <button type="submit">{loading ? "Creating..." : "Register"}</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}
