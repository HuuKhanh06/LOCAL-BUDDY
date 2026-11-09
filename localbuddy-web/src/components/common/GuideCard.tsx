// components/common/GuideCard.tsx
// Thiết kế tối giản 1 tông nền sáng (#FFFFFF / #FAF9F6), rất ít chữ, tập trung vào ảnh chân thực.

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { SlotStatus } from '../../types';
import { formatHourlyRate } from '../../utils/money';

export interface GuideCardProps {
  id: string;
  name: string;
  tagline?: string;
  bio: string;
  hourlyRate: number;
  avgRating: number;
  totalReviews: number;
  completedTours?: number;
  areas: string[];
  languages?: string[];
  skills?: string[];
  avatarUrl?: string;
  coverUrl?: string;
  isVerified: boolean;
  onClick?: () => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({
  name,
  hourlyRate,
  avgRating,
  totalReviews,
  areas,
  languages = ['Tiếng Việt', 'Tiếng Anh'],
  avatarUrl,
  coverUrl,
  isVerified,
  onClick,
}) => {
  return (
    <article
      onClick={onClick}
      className="group bg-white border border-[#E7E5E4] rounded-[20px] overflow-hidden hover:shadow-[0_14px_30px_rgba(28,25,23,0.07)] hover:border-[#D6D3D1] transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* Ảnh lớn sáng rõ */}
      <div className="relative h-64 w-full bg-[#F3F1EC] overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#F3F1EC]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {isVerified && (
          <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#1C1917] backdrop-blur-xs shadow-2xs">
            ✓ KYC
          </span>
        )}

        <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-[#1C1917] text-[12px] font-bold backdrop-blur-xs shadow-2xs">
          <span>★</span>
          <span className="tabular-nums">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
          <span className="text-[#78716C] font-normal">({totalReviews})</span>
        </div>

        {/* Avatar tròn + Tên ngắn gọn ngay trên ảnh */}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-white bg-[#FAF9F6] overflow-hidden shrink-0 shadow-md">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#1C1917]">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 text-white">
            <h3 className="text-[17px] font-bold text-white truncate leading-tight">
              {name}
            </h3>
            <p className="text-[12px] text-white/90 truncate">
              {areas[0] || 'Đà Nẵng'} • {languages.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Chân thẻ tối giản: chỉ hiện Đơn giá / giờ + Nút */}
      <div className="px-4 py-3.5 bg-white flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold text-[#1C1917] tabular-nums">
          {formatHourlyRate(hourlyRate)}
        </span>
        <span className="px-3.5 py-1.5 rounded-full bg-[#F3F1EC] text-[#1C1917] text-[12px] font-semibold group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
          Đặt lịch →
        </span>
      </div>
    </article>
  );
};

// ---------- TimeSlot ----------
export interface TimeSlotProps {
  startTime: string;
  endTime: string;
  status: SlotStatus;
  isSelected?: boolean;
  onClick?: () => void;
  holdSecondsLeft?: number;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  startTime,
  endTime,
  status,
  isSelected,
  onClick,
  holdSecondsLeft,
}) => {
  const isAvailable = status === 'AVAILABLE';

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={isAvailable ? onClick : undefined}
      className={clsx(
        'px-3.5 py-2.5 rounded-[12px] border text-[13px] font-semibold transition-all flex flex-col items-center justify-center min-h-[50px] cursor-pointer disabled:cursor-not-allowed',
        isSelected && 'bg-[#1C1917] text-white border-[#1C1917]',
        !isSelected &&
          isAvailable &&
          'bg-white border-[#E7E5E4] text-[#1C1917] hover:border-[#1C1917]',
        status === 'HOLD' && 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]',
        status === 'BUSY' && 'bg-[#F3F1EC] border-[#E7E5E4] text-[#A8A29E] line-through'
      )}
    >
      <span className="tabular-nums">
        {startTime} – {endTime}
      </span>
      {status === 'HOLD' && (
        <span className="text-[10px] mt-0.5">
          {holdSecondsLeft ? `${Math.ceil(holdSecondsLeft / 60)}p` : 'Giữ 15p'}
        </span>
      )}
      {status === 'BUSY' && <span className="text-[10px] mt-0.5 no-underline">Đã kín</span>}
      {status === 'AVAILABLE' && (
        <span className={clsx('text-[10px] mt-0.5', isSelected ? 'text-white/80' : 'text-[#78716C]')}>
          {isSelected ? 'Đã chọn' : 'Trống'}
        </span>
      )}
    </button>
  );
};

// ---------- Countdown ----------
export const Countdown: React.FC<{
  seconds: number;
  onExpire?: () => void;
  label?: string;
}> = ({ seconds, onExpire, label }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    let current = seconds;
    if (current <= 0) {
      onExpire?.();
      return;
    }
    const timer = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        onExpire?.();
      } else {
        setTimeLeft(current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[#F3F1EC] text-[#1C1917] border border-[#E7E5E4]">
      <span>⏱</span>
      {label && <span>{label}:</span>}
      <span className="font-mono tabular-nums">
        {hrs > 0 && `${String(hrs).padStart(2, '0')}:`}
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-[#E7E5E4] rounded-[20px] bg-white">
    <h3 className="text-[16px] font-bold text-[#1C1917]">{title}</h3>
    {description && (
      <p className="text-[13px] text-[#78716C] mt-1 max-w-sm">{description}</p>
    )}
    {actionText && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 px-5 py-2 bg-[#1C1917] text-white rounded-full text-[13px] font-semibold hover:bg-[#292524] cursor-pointer"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const LoadingState: React.FC<{ message?: string; rows?: number }> = ({
  message = 'Đang tải...',
  rows = 3,
}) => (
  <div className="space-y-4 py-6" aria-busy="true" aria-label={message}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#E7E5E4] rounded-[20px] p-4 space-y-3 animate-pulse"
        >
          <div className="h-56 bg-[#F3F1EC] rounded-[14px]" />
          <div className="h-4 bg-[#F3F1EC] rounded w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-10 px-6 text-center border border-[#E7E5E4] rounded-[20px] bg-white">
    <p className="text-[14px] text-[#1C1917] mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2 bg-[#1C1917] text-white rounded-full text-[13px] font-semibold cursor-pointer"
      >
        Thử lại
      </button>
    )}
  </div>
);
