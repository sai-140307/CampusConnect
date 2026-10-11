import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  toast: { id: number; message: string } | null;
  onDismiss: () => void;
}

const VISIBLE_MS = 3600;
const EXIT_MS = 220;

/**
 * One toast at a time. A new message replaces the current one and restarts the
 * timer, so an earlier toast can never dismiss a later one.
 */
export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setLeaving(false);
    const leaveTimer = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const removeTimer = setTimeout(onDismiss, VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onDismiss]);

  return (
    <div className="fixed bottom-5 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none" role="status" aria-live="polite">
      {toast && (
        <div
          key={toast.id}
          className={`cc-toast ${leaving ? 'is-leaving' : ''} pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 rounded-xl text-sm font-medium shadow-xl max-w-md`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
