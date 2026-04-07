import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useNotification } from "../context/NotificationContext";
import { validateEmail, validateMinLength, validateRequired } from "../utils/validation";

export default function Register() {
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

  const validate = (next = form) => {
    const nextErrors = {
      username: validateRequired(next.username, "Username is required"),
      email:
        validateRequired(next.email, "Email is required") ||
        validateEmail(next.email, "Enter a valid email"),
      password:
        validateRequired(next.password, "Password is required") ||
        validateMinLength(next.password, 6, "Password must be at least 6 characters"),
      role: validateRequired(next.role, "Role is required"),
    };
    setErrors(nextErrors);
    return nextErrors;
  };

  const isValid = Object.values(errors).every((msg) => !msg) &&
    !validateRequired(form.username) &&
    !validateRequired(form.email) &&
    !validateRequired(form.password) &&
    !validateRequired(form.role);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBackendError("");
    const nextErrors = validate(form);
    setTouched({ username: true, email: true, password: true, role: true });
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      console.log(form);
      const data = await registerUser(form);
      notify(data?.message || "Registration successful. Continue to OTP verification.", "success");
      navigate("/verify-otp", { state: { username: form.username } });
    } catch (error) {
      console.error("Register error:", error);
      setBackendError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed"
      );
      notify(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate({ ...form });
  };

  const setField = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    validate(next);
  };

  const fieldError = (field) => (touched[field] ? errors[field] : "");

  return (
    <main className="auth-card">
      <h2>Create account</h2>
      {backendError ? (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{backendError}</div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setField("username", e.target.value)}
          onBlur={() => onBlur("username")}
          required
        />
        {fieldError("username") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("username")}</div>
        ) : null}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => onBlur("email")}
          required
        />
        {fieldError("email") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("email")}</div>
        ) : null}
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => onBlur("password")}
          required
        />
        {fieldError("password") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
            {fieldError("password")}
          </div>
        ) : null}
        <select
          value={form.role}
          onChange={(e) => setField("role", e.target.value)}
          onBlur={() => onBlur("role")}
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="CONTENT_CREATOR">Content Creator</option>
          <option value="ADMIN">Admin</option>
        </select>
        {fieldError("role") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("role")}</div>
        ) : null}
        <button type="submit" disabled={loading || !isValid}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}
