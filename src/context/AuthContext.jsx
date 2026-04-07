import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setApiAuthHandlers } from "../services/api";
import { fetchCurrentUser, verifyOtp } from "../services/authService";
import { useNotification } from "./NotificationContext";

const AuthContext = createContext(null);
const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
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
        const nextUser = data.user || data;
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
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
    const currentUser = data.user || { username, role: data.role };

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
