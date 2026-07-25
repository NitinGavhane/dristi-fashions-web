import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    /*
     * `w-full` pinned to `right-6` made the stack 24px wider than the viewport
     * on any phone narrower than a 24rem card, handing the page a horizontal
     * scrollbar. It now spans between both gutters on mobile and only becomes a
     * right-anchored card once there is room. `z-[60]` keeps it above the
     * mobile navigation drawer, which is z-50.
     */
    <div className="fixed inset-x-3 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm z-[60] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              isSuccess
                ? 'bg-[#0d1648]/95 text-white border-[#fed255]/40 shadow-navy-900/40'
                : isError
                ? 'bg-[#ba1a1a] text-white border-red-300'
                : 'bg-white text-[#181a2d] border-[#c6c5d0]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#fed255]" />}
              {isError && <AlertCircle className="w-5 h-5 text-white" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#755b00]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-wide font-sans">{toast.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-sans">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-75 transition-opacity shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
