import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg';
  brandColor?: string;
}

/**
 * Logo LocalBuddy thiết kế chuẩn theo phong cách Withlocals:
 * Biểu tượng 2 khuôn mặt cười kết nối hình kính/vô cực thân thiện + typography bo tròn đậm nét.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  brandColor,
}) => {
  const isWhite = variant === 'white';
  const color = brandColor || (isWhite ? '#FFFFFF' : '#D12B79');
  const textColor = isWhite ? '#FFFFFF' : (brandColor || '#D12B79');

  const sizeClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
  }[size];

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 68 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses} w-auto ${className}`}
        aria-label="LocalBuddy Logo"
      >
        {/* Vòng ngoài liên kết đôi mắt cười phong cách Withlocals */}
        <path
          d="M 18 3 C 9.716 3 3 9.716 3 18 C 3 26.284 9.716 33 18 33 C 24.3 33 29.6 29.1 31.8 23.5 C 33.2 20 34.8 20 36.2 23.5 C 38.4 29.1 43.7 33 50 33 C 58.284 33 65 26.284 65 18 C 65 9.716 58.284 3 50 3 C 43.7 3 38.4 6.9 36.2 12.5 C 34.8 16 33.2 16 31.8 12.5 C 29.6 6.9 24.3 3 18 3 Z"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Mặt cười bên trái (Local Guide) */}
        <circle cx="13.5" cy="14" r="2.2" fill={color} />
        <circle cx="22.5" cy="14" r="2.2" fill={color} />
        <path
          d="M 11.5 19 C 11.5 19 14 25 18 25 C 22 25 24.5 19 24.5 19"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mặt cười bên phải (Tourist) */}
        <circle cx="45.5" cy="14" r="2.2" fill={color} />
        <circle cx="54.5" cy="14" r="2.2" fill={color} />
        <path
          d="M 43.5 19 C 43.5 19 46 25 50 25 C 54 25 56.5 19 56.5 19"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Icon đôi mặt cười Withlocals style */}
      <svg
        viewBox="0 0 68 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses} w-auto shrink-0`}
        aria-hidden="true"
      >
        <path
          d="M 18 3 C 9.716 3 3 9.716 3 18 C 3 26.284 9.716 33 18 33 C 24.3 33 29.6 29.1 31.8 23.5 C 33.2 20 34.8 20 36.2 23.5 C 38.4 29.1 43.7 33 50 33 C 58.284 33 65 26.284 65 18 C 65 9.716 58.284 3 50 3 C 43.7 3 38.4 6.9 36.2 12.5 C 34.8 16 33.2 16 31.8 12.5 C 29.6 6.9 24.3 3 18 3 Z"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Mặt cười 1 */}
        <circle cx="13.5" cy="14" r="2.2" fill={color} />
        <circle cx="22.5" cy="14" r="2.2" fill={color} />
        <path
          d="M 11.5 19 C 11.5 19 14 25 18 25 C 22 25 24.5 19 24.5 19"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mặt cười 2 */}
        <circle cx="45.5" cy="14" r="2.2" fill={color} />
        <circle cx="54.5" cy="14" r="2.2" fill={color} />
        <path
          d="M 43.5 19 C 43.5 19 46 25 50 25 C 54 25 56.5 19 56.5 19"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Typography Withlocals style */}
      <span
        style={{ color: textColor }}
        className="font-black tracking-tight text-[20px] sm:text-[22px] leading-none"
      >
        local<span className="font-extrabold">buddy</span>
      </span>
    </div>
  );
};
