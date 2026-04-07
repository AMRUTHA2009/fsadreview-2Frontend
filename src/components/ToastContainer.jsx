import { useNotification } from "../context/NotificationContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <button
          type="button"
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
