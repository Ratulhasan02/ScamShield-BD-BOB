"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; message: string; kind: ToastKind; }

const ToastContext = createContext<{ show: (msg: string, kind?: ToastKind) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((tt) => tt.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((tItem) => (
          <div
            key={tItem.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-[fadeIn_0.2s_ease-out] ${
              tItem.kind === "success"
                ? "bg-brand-900/90 border-brand-500/40 text-brand-100"
                : tItem.kind === "error"
                ? "bg-danger-500/10 border-danger-500/40 text-danger-50"
                : "bg-ink-700/90 border-white/10 text-white"
            }`}
          >
            {tItem.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
