// components/ui/Button.tsx
// Nút bấm theo chuẩn thiết kế [10]: Cam #EB5B38, Nền #272A2D, Bo góc 12px

import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark' | 'blue';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-bold hover:bg-[var(--lb-accent-hover)] active:scale-[0.98] shadow-sm focus-visible:ring-[var(--lb-blue)] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-[var(--lb-surface-2)] text-[var(--lb-text)] font-semibold border border-[var(--lb-border)] hover:bg-[var(--lb-surface)] active:scale-[0.98] focus-visible:ring-[var(--lb-blue)]',
  outline:
    'bg-transparent text-[var(--lb-text)] font-semibold border border-[var(--lb-border)] hover:bg-[var(--lb-surface-2)] active:scale-[0.98] focus-visible:ring-[var(--lb-blue)]',
  dark:
    'bg-[var(--lb-surface)] text-[var(--lb-text)] font-semibold border border-[var(--lb-border)] hover:bg-[var(--lb-surface-2)] active:scale-[0.98] focus-visible:ring-[var(--lb-blue)]',
  blue:
    'bg-[var(--lb-blue-solid)] text-white font-semibold hover:opacity-90 active:scale-[0.98] focus-visible:ring-[var(--lb-blue)]',
  danger:
    'bg-[var(--lb-error)] text-white font-semibold hover:opacity-90 active:scale-[0.98] focus-visible:ring-[var(--lb-error)] disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--lb-muted)] font-medium hover:bg-[var(--lb-surface-2)] hover:text-[var(--lb-text)] focus-visible:ring-[var(--lb-blue)]',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3.5 min-h-[36px] text-[13px] rounded-[12px]',
  md: 'px-5 min-h-[42px] text-[13px] rounded-[12px]',
  lg: 'px-6 min-h-[48px] text-[14px] rounded-[12px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon && <span className="shrink-0 inline-flex items-center">{icon}</span>
      )}
      {children}
    </button>
  );
};
