// components/ui/Modal.tsx – Modal chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB
import React, { useEffect } from 'react';
import { clsx } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  size,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveSize = size || maxWidth || 'md';
  const maxWClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
  }[effectiveSize];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'w-full bg-[var(--lb-surface)] rounded-t-[20px] sm:rounded-[20px] shadow-2xl border border-[var(--lb-border)] overflow-hidden flex flex-col max-h-[90vh]',
          maxWClass
        )}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-[var(--lb-border)]" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--lb-border)] bg-[var(--lb-surface-2)]">
          <h3 className="text-[17px] font-bold text-[var(--lb-text)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--lb-muted)] hover:text-[var(--lb-text)] hover:bg-[var(--lb-surface)] w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-bold transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-[14px] text-[var(--lb-text)]">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--lb-surface-2)] border-t border-[var(--lb-border)] flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
