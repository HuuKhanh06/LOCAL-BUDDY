// components/common/GuideCard.tsx
// Thẻ Guide & Slot chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

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
      className="group bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[16px] overflow-hidden hover:border-[var(--lb-accent)] transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* Cover Media */}
      <div className="relative h-60 w-full bg-[var(--lb-surface-2)] overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[var(--lb-surface-2)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--lb-bg-deep)]/85 via-transparent to-transparent" />

        {isVerified && (
          <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--lb-surface)] text-[var(--lb-text)] border border-[var(--lb-border)] backdrop-blur-xs">
            ✓ Đã xác thực KYC
          </span>
        )}

        <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--lb-surface)] text-[var(--lb-text)] border border-[var(--lb-border)] text-[12px] font-bold backdrop-blur-xs">
          <span className="text-[var(--lb-warning)]">★</span>
          <span className="tabular-nums">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
          <span className="text-[var(--lb-muted)] font-normal">({totalReviews})</span>
        </div>

        {/* Avatar + Name on cover */}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-[var(--lb-accent)] bg-[var(--lb-surface-2)] overflow-hidden shrink-0 shadow-md">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[var(--lb-text)]">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 text-[var(--lb-text)]">
            <h3 className="text-[16px] font-bold text-[var(--lb-text)] truncate leading-tight">
              {name}
            </h3>
            <p className="text-[12px] text-[var(--lb-muted)] truncate">
              {areas[0] || 'Đà Nẵng'} • {languages.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 bg-[var(--lb-surface)] flex items-center justify-between gap-2 border-t border-[var(--lb-border)]">
        <span className="text-[15px] font-bold text-[var(--lb-text)] tabular-nums">
          {formatHourlyRate(hourlyRate)}
        </span>
        <span className="px-3 py-1.5 rounded-[12px] bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[var(--lb-text)] text-[12px] font-semibold group-hover:bg-[var(--lb-accent)] group-hover:text-[var(--lb-on-accent)] transition-colors">
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
        isSelected && 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] border-[var(--lb-accent)]',
        !isSelected &&
          isAvailable &&
          'bg-[var(--lb-surface-2)] border-[var(--lb-border)] text-[var(--lb-text)] hover:border-[var(--lb-accent)]',
        status === 'HOLD' && 'bg-[var(--lb-surface-2)] border-[var(--lb-warning)] text-[var(--lb-warning)]',
        status === 'BUSY' && 'bg-[var(--lb-surface)] border-[var(--lb-border)] text-[var(--lb-muted)] opacity-40 line-through'
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
        <span className={clsx('text-[10px] mt-0.5', isSelected ? 'text-[var(--lb-on-accent)]' : 'text-[var(--lb-muted)]')}>
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
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--lb-surface-2)] text-[var(--lb-text)] border border-[var(--lb-border)]">
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
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-[var(--lb-border)] rounded-[20px] bg-[var(--lb-surface)]">
    <h3 className="text-[16px] font-bold text-[var(--lb-text)]">{title}</h3>
    {description && (
      <p className="text-[13px] text-[var(--lb-muted)] mt-1 max-w-sm">{description}</p>
    )}
    {actionText && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 px-5 py-2 bg-[var(--lb-accent)] text-[var(--lb-on-accent)] rounded-[12px] text-[13px] font-bold hover:bg-[var(--lb-accent-hover)] cursor-pointer"
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
          className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[16px] p-4 space-y-3 animate-pulse"
        >
          <div className="h-56 bg-[var(--lb-surface-2)] rounded-[12px]" />
          <div className="h-4 bg-[var(--lb-surface-2)] rounded w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-10 px-6 text-center border border-[var(--lb-border)] rounded-[20px] bg-[var(--lb-surface)]">
    <p className="text-[14px] text-[var(--lb-text)] mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2 bg-[var(--lb-accent)] text-[var(--lb-on-accent)] rounded-[12px] text-[13px] font-bold cursor-pointer"
      >
        Thử lại
      </button>
    )}
  </div>
);
