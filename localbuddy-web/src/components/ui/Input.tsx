// components/ui/Input.tsx
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
        <label htmlFor={inputId} className="text-[14px] font-semibold text-[#1A0A0F]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3.5 min-h-[44px] rounded-[12px] border text-[15px] text-[#1C1C28] bg-white transition-all placeholder:text-[#52526B]/60',
          'focus:outline-none focus:ring-2 focus:ring-[#1EC1CB] focus:border-[#1EC1CB]',
          error ? 'border-[#A61B2B] bg-[#FCE8EB]/30' : 'border-[#E4C3CC]',
          'disabled:bg-[#F6E6EA]/50 disabled:text-[#52526B] disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <span className="text-[12px] font-medium text-[#A61B2B]">{error}</span>}
      {displayHint && !error && <span className="text-[12px] text-[#52526B]">{displayHint}</span>}
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
        <label htmlFor={inputId} className="text-[14px] font-semibold text-[#1A0A0F]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-[12px] border text-[15px] text-[#1C1C28] bg-white transition-all resize-none placeholder:text-[#52526B]/60',
          'focus:outline-none focus:ring-2 focus:ring-[#1EC1CB] focus:border-[#1EC1CB]',
          error ? 'border-[#A61B2B] bg-[#FCE8EB]/30' : 'border-[#E4C3CC]',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <span className="text-[12px] font-medium text-[#A61B2B]">{error}</span>}
      {displayHint && !error && <span className="text-[12px] text-[#52526B]">{displayHint}</span>}
    </div>
  );
};
