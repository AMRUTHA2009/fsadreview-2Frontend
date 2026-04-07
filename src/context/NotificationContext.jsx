import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

let nextId = 1;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "info", timeout = 3500) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => removeToast(id), timeout);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toasts, notify, removeToast }), [notify, removeToast, toasts]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }
  return context;
}
