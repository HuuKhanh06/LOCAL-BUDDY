// components/ui/Modal.tsx – Modal trên Desktop/Tablet & Bottom-Sheet mượt mà trên Mobile (430px)
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#1C1C28]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'w-full bg-white rounded-t-[20px] sm:rounded-[16px] shadow-[0_20px_40px_rgba(26,10,15,0.25)] border border-[#E4C3CC] overflow-hidden flex flex-col max-h-[90vh]',
          maxWClass
        )}
      >
        {/* Thanh kéo bottom-sheet trên mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-[#E4C3CC]" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4C3CC] bg-[#FBF4F6]">
          <h3 className="text-[18px] font-bold text-[#1A0A0F]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#52526B] hover:text-[#1A0A0F] hover:bg-[#F6E6EA] w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-[15px] text-[#1C1C28]">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FBF4F6] border-t border-[#E4C3CC] flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
