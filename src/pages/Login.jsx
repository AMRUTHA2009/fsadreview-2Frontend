import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestOtp } from "../services/authService";
import { useNotification } from "../context/NotificationContext";
import { validateMinLength, validateRequired } from "../utils/validation";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const validate = (next = form) => {
    const nextErrors = {
      username: validateRequired(next.username, "Username is required"),
      password:
        validateRequired(next.password, "Password is required") ||
        validateMinLength(next.password, 6, "Password must be at least 6 characters"),
    };
    setErrors(nextErrors);
    return nextErrors;
  };

  const isValid =
    Object.values(errors).every((msg) => !msg) &&
    !validateRequired(form.username) &&
    !validateRequired(form.password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBackendError("");
    const nextErrors = validate(form);
    setTouched({ username: true, password: true });
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      await requestOtp(form);
      notify("OTP sent to your registered email.", "success");
      navigate("/verify-otp", { state: { username: form.username } });
    } catch (error) {
      setBackendError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Invalid login"
      );
      notify(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Invalid login",
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
      <h2>Login</h2>
      {backendError ? (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{backendError}</div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          type="text"
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
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => onBlur("password")}
          required
        />
        {fieldError("password") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("password")}</div>
        ) : null}
        <button type="submit" disabled={loading || !isValid}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
      <p>
        New user? <Link to="/register">Create account</Link>
      </p>
    </main>
  );
}