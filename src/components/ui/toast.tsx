"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success", duration = 4000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return { toasts, toast, dismiss };
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export function Toaster({
  toasts,
  dismiss,
}: {
  toasts: ReturnType<typeof useToast>["toasts"];
  dismiss: ReturnType<typeof useToast>["dismiss"];
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[360px]
            px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl
            animate-in slide-in-from-bottom-2 fade-in duration-200
            ${
              t.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }
          `}
        >
          {t.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          )}
          <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
