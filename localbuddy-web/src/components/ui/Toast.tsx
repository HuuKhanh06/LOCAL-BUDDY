// components/ui/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100%-2.5rem)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto p-4 rounded-[12px] shadow-xl border text-[14px] font-semibold flex items-start justify-between gap-3 transition-all',
              t.type === 'success' && 'bg-[#E3F7EF] text-[#0F6E4B] border-[#99E2C4]',
              t.type === 'error' && 'bg-[#FCE8EB] text-[#A61B2B] border-[#F5B2BA]',
              t.type === 'warning' && 'bg-[#FEF1DC] text-[#8C4A08] border-[#F8CA84]',
              t.type === 'info' && 'bg-[#1C1C28] text-white border-[#1EC1CB]'
            )}
          >
            <span className="leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-current opacity-70 hover:opacity-100 font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
