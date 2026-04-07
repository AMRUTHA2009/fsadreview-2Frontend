import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateMinLength, validateRequired } from "../utils/validation";

function getRouteByRole(role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "INSTRUCTOR":
      return "/instructor";
    case "CONTENT_CREATOR":
      return "/content-creator";
    default:
      return "/student";
  }
}

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeOtpLogin } = useAuth();
  const [username, setUsername] = useState(location.state?.username || "");
  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (next = { username, otp }) => {
    const nextErrors = {
      username: validateRequired(next.username, "Username is required"),
      otp:
        validateRequired(next.otp, "OTP is required") ||
        validateMinLength(next.otp, 6, "OTP must be 6 digits"),
    };
    setErrors(nextErrors);
    return nextErrors;
  };

  const isValid =
    Object.values(errors).every((msg) => !msg) &&
    !validateRequired(username) &&
    !validateRequired(otp) &&
    String(otp).length === 6;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBackendError("");
    const nextErrors = validate({ username, otp });
    setTouched({ username: true, otp: true });
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      const user = await completeOtpLogin({ username, otp });
      navigate(getRouteByRole(user?.role), { replace: true });
    } catch (error) {
      setBackendError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate({ username, otp });
  };

  const fieldError = (field) => (touched[field] ? errors[field] : "");

  return (
    <main className="auth-card">
      <h2>Verify OTP</h2>
      {backendError ? (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{backendError}</div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            validate({ username: e.target.value, otp });
          }}
          onBlur={() => onBlur("username")}
          required
        />
        {fieldError("username") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("username")}</div>
        ) : null}
        <input
          name="otp"
          placeholder="6 digit OTP"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            validate({ username, otp: e.target.value });
          }}
          onBlur={() => onBlur("otp")}
          required
        />
        {fieldError("otp") ? (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{fieldError("otp")}</div>
        ) : null}
        <button type="submit" disabled={loading || !isValid}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </main>
  );
}