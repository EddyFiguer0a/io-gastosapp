import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl animate-fade-in bg-[var(--bg-card)]/95 border-[var(--border-subtle)] ${
        toast.type === 'success'
          ? 'border-emerald-500/30 text-emerald-400'
          : toast.type === 'error'
          ? 'border-rose-500/30 text-rose-400'
          : 'text-[var(--text-primary)]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
        {toast.type === 'info' && <Info size={16} className="text-cyan-400 shrink-0" />}
        <span className="truncate">{toast.message}</span>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-500 hover:text-white shrink-0 ml-2"
      >
        <X size={14} />
      </button>
    </div>
  );
};
