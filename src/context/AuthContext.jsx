import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setApiAuthHandlers } from "../services/api";
import { fetchCurrentUser, verifyOtp } from "../services/authService";
import { normalizeAuthUser } from "../utils/authRole";
import { useNotification } from "./NotificationContext";

const AuthContext = createContext(null);
const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return normalizeAuthUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { notify } = useNotification();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear common legacy keys (safe no-ops if absent).
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("jwt");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setApiAuthHandlers({
      getToken: () => token,
      onUnauthorized: () => {
        logout();
        notify("Session expired. Please login again.", "error");
      },
      onApiError: (message) => {
        if (message) notify(message, "error");
      },
    });
  }, [logout, notify, token]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const data = await fetchCurrentUser();
        const raw = data.user || data;
        const nextUser = normalizeAuthUser(raw);
        if (nextUser) {
          setUser(nextUser);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        }
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };
    bootstrap();
  }, [logout, token]);

  const completeOtpLogin = useCallback(async ({ username, otp }) => {
    const data = await verifyOtp({ username, otp });
    const jwt = data.token || data.jwt;
    const currentUser = normalizeAuthUser(data.user || { username, role: data.role }, username);

    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    setToken(jwt);
    setUser(currentUser);
    notify("Login successful.", "success");
    return currentUser;
  }, [notify]);

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "",
      isAuthenticated: Boolean(token),
      authLoading,
      logout,
      completeOtpLogin,
    }),
    [authLoading, completeOtpLogin, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
