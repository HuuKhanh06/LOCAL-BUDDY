// components/ui/Button.tsx
// Bảng màu bắt buộc:
// - primary CTA: nền cyan (#1EC1CB), chữ navy (#1C1C28) — TUYỆT ĐỐI KHÔNG dùng chữ trắng trên nền cyan!
// - secondary / outline: nền blush (#F6E6EA) hoặc trắng, viền navy/blush, chữ burgundy/navy
// - danger: nền đỏ ngữ nghĩa (#A61B2B), chữ trắng

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
    'bg-[#1EC1CB] text-[#1C1C28] font-bold hover:bg-[#18A7B0] active:bg-[#138E96] shadow-sm focus-visible:ring-[#1EC1CB] disabled:bg-[#1EC1CB]/40 disabled:text-[#1C1C28]/60',
  secondary:
    'bg-[#F6E6EA] text-[#1A0A0F] font-semibold border border-[#E4C3CC] hover:bg-[#EDD2D9] focus-visible:ring-[#1EC1CB]',
  outline:
    'bg-white text-[#1C1C28] font-semibold border border-[#D4C0C6] hover:bg-[#F6E6EA]/70 focus-visible:ring-[#1EC1CB]',
  dark:
    'bg-[#1C1C28] text-white font-semibold hover:bg-[#2B2B3D] focus-visible:ring-[#1EC1CB]',
  danger:
    'bg-[#A61B2B] text-white font-semibold hover:bg-[#881422] focus-visible:ring-[#A61B2B] disabled:bg-[#F5B2BA] disabled:text-[#A61B2B]/60',
  ghost:
    'bg-transparent text-[#1C1C28] font-semibold hover:bg-[#F6E6EA] focus-visible:ring-[#1EC1CB]',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3.5 min-h-[38px] text-[13px] rounded-[10px]',
  md: 'px-4 min-h-[44px] text-[14px] rounded-[12px]',
  lg: 'px-6 min-h-[50px] text-[15px] rounded-[12px]',
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
