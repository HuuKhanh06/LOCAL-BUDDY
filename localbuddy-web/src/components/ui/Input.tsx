// components/ui/Input.tsx
// Input chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  const displayHint = hint || helperText;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-[var(--lb-text)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3.5 min-h-[44px] rounded-[12px] border text-[14px] text-[var(--lb-text)] bg-[var(--lb-surface-2)] transition-all placeholder:text-[var(--lb-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--lb-blue)] focus:border-[var(--lb-blue)]',
          error ? 'border-[var(--lb-error)] bg-[var(--lb-surface)]' : 'border-[var(--lb-border)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <span className="text-[12px] font-medium text-[var(--lb-error)]">{error}</span>}
      {displayHint && !error && <span className="text-[12px] text-[var(--lb-muted)]">{displayHint}</span>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  const displayHint = hint || helperText;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-[var(--lb-text)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-[12px] border text-[14px] text-[var(--lb-text)] bg-[var(--lb-surface-2)] transition-all resize-none placeholder:text-[var(--lb-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--lb-blue)] focus:border-[var(--lb-blue)]',
          error ? 'border-[var(--lb-error)] bg-[var(--lb-surface)]' : 'border-[var(--lb-border)]',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <span className="text-[12px] font-medium text-[var(--lb-error)]">{error}</span>}
      {displayHint && !error && <span className="text-[12px] text-[var(--lb-muted)]">{displayHint}</span>}
    </div>
  );
};
