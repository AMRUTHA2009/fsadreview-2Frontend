import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { ALL_FIELDS_REQUIRED, mapLoginApiError } from "../utils/validation";
import { requestOtp } from "../services/authService";

function trim(v) {
  return String(v ?? "").trim();
}

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const validate = (next = form, submit = false) => {
    const u = trim(next.username);
    const p = trim(next.password);
    const nextErrors = { username: "", password: "" };

    if (submit) {
      if (!u) nextErrors.username = ALL_FIELDS_REQUIRED;
      if (!p) nextErrors.password = ALL_FIELDS_REQUIRED;
    } else {
      if (touched.username) nextErrors.username = u ? "" : ALL_FIELDS_REQUIRED;
      if (touched.password) nextErrors.password = p ? "" : ALL_FIELDS_REQUIRED;
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setBackendError("");
    const nextErrors = validate(form, true);
    setTouched({ username: true, password: true });
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await requestOtp(form);
      notify("OTP sent to your registered email.", "success");
      navigate("/verify-otp", { state: { username: form.username } });
    } catch (error) {
      const mapped = mapLoginApiError(error);
      if (mapped.field) {
        setErrors({
          username: mapped.field === "username" ? mapped.message : "",
          password: mapped.field === "password" ? mapped.message : "",
        });
        setTouched({ username: true, password: true });
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
    validate(next, false);
  };

  const fieldError = (field) => (touched[field] ? errors[field] : "");
  const showInvalid = (field) => Boolean(touched[field] && errors[field]);

  return (
    <main className="auth-card">
      <h2>Login</h2>
      {backendError ? (
        <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{backendError}</div>
      ) : null}
      <form onSubmit={handleSubmit} noValidate>
        <input
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Username or email"
          value={form.username}
          className={showInvalid("username") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("username", e.target.value)}
          onBlur={() => onBlur("username")}
        />
        {fieldError("username") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{fieldError("username")}</div>
        ) : null}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={form.password}
          className={showInvalid("password") ? "auth-input-invalid" : ""}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => onBlur("password")}
        />
        {fieldError("password") ? (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{fieldError("password")}</div>
        ) : null}
        <button type="submit">{loading ? "Sending OTP..." : "Send OTP"}</button>
      </form>
      <p>
        New user? <Link to="/register">Create account</Link>
      </p>
    </main>
  );
}
