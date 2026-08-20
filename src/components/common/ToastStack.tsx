import { AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-md"
          style={{
            background: "var(--color-surface)",
            borderColor: toast.tone === "error" ? "#fecaca" : "var(--color-border)",
            maxWidth: 360,
          }}
        >
          {toast.tone === "error" ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" strokeWidth={1.75} />
          ) : (
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-[color:var(--color-text-muted)]"
              strokeWidth={1.75}
            />
          )}
          <span className="text-[13px] leading-snug text-[color:var(--color-text)]">
            {toast.message}
          </span>
          <button
            type="button"
            title="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="ml-1 shrink-0 rounded p-0.5 text-[color:var(--color-text-faint)] hover:bg-zinc-100 hover:text-[color:var(--color-text)]"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
}
