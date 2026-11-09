// components/ui/Button.tsx
// Phong cách tối giản 1 tông nền sáng: nút chính màu than ấm (#1C1917) chữ sáng hoặc nền sáng viền mảnh, không dùng nhiều màu sặc sỡ.

import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark';

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
    'bg-[#1C1917] text-white font-semibold hover:bg-[#292524] active:bg-[#0C0A09] shadow-2xs focus-visible:ring-[#1C1917] disabled:bg-[#E7E5E4] disabled:text-[#A8A29E]',
  secondary:
    'bg-[#F3F1EC] text-[#1C1917] font-semibold border border-[#E7E5E4] hover:bg-[#E7E5E4]/70 focus-visible:ring-[#1C1917]',
  outline:
    'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] hover:bg-[#FAF9F6] focus-visible:ring-[#1C1917]',
  dark:
    'bg-[#1C1917] text-white font-semibold hover:bg-[#292524] focus-visible:ring-[#1C1917]',
  danger:
    'bg-[#B91C1C] text-white font-semibold hover:bg-[#991B1B] focus-visible:ring-[#B91C1C] disabled:bg-[#FECACA] disabled:text-[#B91C1C]/60',
  ghost:
    'bg-transparent text-[#57534E] font-medium hover:bg-[#F3F1EC] hover:text-[#1C1917] focus-visible:ring-[#1C1917]',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3.5 min-h-[36px] text-[13px] rounded-full',
  md: 'px-5 min-h-[42px] text-[13px] rounded-full',
  lg: 'px-6 min-h-[48px] text-[14px] rounded-full',
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
