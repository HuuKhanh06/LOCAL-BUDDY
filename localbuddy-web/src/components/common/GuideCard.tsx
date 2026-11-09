// components/common/GuideCard.tsx, TimeSlot, Countdown & 4 States (Skeleton, Empty, Error, Success)
// Phong cách Withlocals + ToursByLocals + ShowAround:
// - Thẻ hướng ảnh, host avatar tròn nổi bật, điểm đánh giá, ngôn ngữ, kỹ năng
// - Đơn giá hiển thị bắt buộc dạng: "250.000 ₫ / giờ"
// - Chữ trên nền cyan (#1EC1CB) luôn là navy (#1C1C28)

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
  tagline,
  bio,
  hourlyRate,
  avgRating,
  totalReviews,
  completedTours = 50,
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
      className="group bg-white border border-[#E4C3CC] rounded-[12px] overflow-hidden shadow-[0_2px_10px_rgba(26,10,15,0.05)] hover:shadow-[0_12px_28px_rgba(26,10,15,0.12)] hover:border-[#1EC1CB] transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Ảnh bìa địa danh Đà Nẵng kiểu Withlocals */}
        <div className="relative h-44 w-full bg-[#1C1C28] overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Khám phá Đà Nẵng cùng ${name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1A0A0F] to-[#1C1C28]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0F]/80 via-[#1A0A0F]/20 to-transparent" />

          {/* Badge xác minh KYC */}
          {isVerified && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1EC1CB] text-[#1C1C28] shadow-sm">
              ✓ Đã xác minh KYC
            </span>
          )}

          {/* Điểm đánh giá góc trên phải */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1C1C28]/90 text-white text-[12px] font-bold backdrop-blur-xs">
            <span className="text-amber-400">★</span>
            <span className="tabular-nums">{avgRating > 0 ? avgRating.toFixed(1) : 'Mới'}</span>
            <span className="text-white/75 font-normal">({totalReviews})</span>
          </div>

          {/* Avatar tròn của Host đè lên mép ảnh bìa (Chuẩn Withlocals) */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3 right-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#1EC1CB] bg-[#F6E6EA] overflow-hidden shrink-0 shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#1A0A0F] text-[18px]">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 text-white">
              <p className="text-[11px] uppercase tracking-wider text-[#1EC1CB] font-bold">
                Hướng dẫn viên bản địa
              </p>
              <h3 className="text-[17px] font-extrabold text-white truncate leading-tight">
                {name}
              </h3>
              <p className="text-[12px] text-white/85 truncate">
                🗣 {languages.join(' • ')}
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung thẻ */}
        <div className="p-4 pb-3">
          {tagline && (
            <h4 className="text-[15px] font-bold text-[#1A0A0F] line-clamp-2 mb-1.5 group-hover:text-[#1C1C28]">
              {tagline}
            </h4>
          )}
          <p className="text-[13px] text-[#52526B] line-clamp-2 mb-3 leading-relaxed">
            {bio}
          </p>

          {/* Khu vực Đà Nẵng */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {areas.slice(0, 3).map((area, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold bg-[#F6E6EA] text-[#1A0A0F] px-2.5 py-1 rounded-full"
              >
                📍 {area}
              </span>
            ))}
            {areas.length > 3 && (
              <span className="text-[11px] font-semibold bg-[#FBF4F6] border border-[#E4C3CC] text-[#52526B] px-2 py-1 rounded-full">
                +{areas.length - 3} khu vực
              </span>
            )}
          </div>

          {/* Hàng trấn an hủy miễn phí (Withlocals reassurance row) */}
          <div className="flex items-center justify-between text-[11px] text-[#52526B] bg-[#FBF4F6] px-2.5 py-1.5 rounded-[8px] border border-[#E4C3CC]/60">
            <span>🛡 Cọc trước 30% • Giữ lịch 15p</span>
            <span>✓ {completedTours}+ chuyến đi</span>
          </div>
        </div>
      </div>

      {/* Chân thẻ: Đơn giá chuẩn "250.000 ₫ / giờ" + Nút CTA */}
      <div className="px-4 py-3.5 bg-[#FBF4F6] border-t border-[#E4C3CC] flex items-center justify-between gap-2">
        <div>
          <span className="block text-[11px] text-[#52526B] font-medium">
            Đơn giá thuê riêng
          </span>
          <span className="text-[16px] font-extrabold text-[#1A0A0F] tabular-nums">
            {formatHourlyRate(hourlyRate)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] text-[13px] font-bold group-hover:bg-[#18A7B0] transition-colors">
          Xem lịch & Đặt →
        </span>
      </div>
    </article>
  );
};

// ---------- TimeSlot (4 trạng thái: AVAILABLE, HOLD, BUSY, SELECTED) ----------
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
        'px-3.5 py-2.5 rounded-[12px] border text-[13px] font-bold transition-all flex flex-col items-center justify-center min-h-[52px] cursor-pointer disabled:cursor-not-allowed',
        isSelected &&
          'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28] ring-2 ring-[#1EC1CB]/40 shadow-sm',
        !isSelected &&
          isAvailable &&
          'bg-white border-[#E4C3CC] text-[#1C1C28] hover:border-[#1EC1CB] hover:bg-[#E5F8F9]/40',
        status === 'HOLD' &&
          'bg-[#FEF1DC] border-[#F8CA84] text-[#8C4A08]',
        status === 'BUSY' &&
          'bg-[#F6E6EA]/70 border-[#E4C3CC] text-[#52526B]/60 line-through'
      )}
    >
      <span className="tabular-nums">
        {startTime} – {endTime}
      </span>
      {status === 'HOLD' && (
        <span className="text-[11px] font-semibold mt-0.5">
          {holdSecondsLeft
            ? `⏱ Đang giữ chỗ (${Math.ceil(holdSecondsLeft / 60)}p)`
            : '⏱ Tạm giữ 15p'}
        </span>
      )}
      {status === 'BUSY' && (
        <span className="text-[11px] font-normal mt-0.5 no-underline">Đã kín lịch</span>
      )}
      {status === 'AVAILABLE' && (
        <span
          className={clsx(
            'text-[11px] font-semibold mt-0.5',
            isSelected ? 'text-[#1C1C28]' : 'text-[#0F6E4B]'
          )}
        >
          {isSelected ? '✓ Đang chọn' : '● Đang trống'}
        </span>
      )}
    </button>
  );
};

// ---------- Countdown (Đồng hồ đếm ngược trực quan cho 15m HOLD & 24h Window) ----------
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
  const isUrgent = timeLeft < 300; // dưới 5 phút

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] text-[14px] font-bold border',
        isUrgent
          ? 'bg-[#FCE8EB] text-[#A61B2B] border-[#F5B2BA]'
          : 'bg-[#FEF1DC] text-[#8C4A08] border-[#F8CA84]'
      )}
    >
      <span>⏱</span>
      {label && <span className="font-semibold text-[13px]">{label}:</span>}
      <span className="font-mono tabular-nums text-[15px]">
        {hrs > 0 && `${String(hrs).padStart(2, '0')}:`}
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};

// ---------- 4 Trạng thái giao diện chuẩn: EmptyState, LoadingState (Skeleton), ErrorState ----------
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-[#E4C3CC] rounded-[16px] bg-white">
    <div className="w-14 h-14 rounded-full bg-[#F6E6EA] text-[#1A0A0F] flex items-center justify-center text-2xl mb-3">
      🧭
    </div>
    <h3 className="text-[18px] font-bold text-[#1A0A0F]">{title}</h3>
    {description && (
      <p className="text-[14px] text-[#52526B] mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
    )}
    {actionText && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-5 py-2.5 bg-[#1EC1CB] text-[#1C1C28] rounded-[12px] text-[14px] font-bold hover:bg-[#18A7B0] transition-colors cursor-pointer"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const LoadingState: React.FC<{ message?: string; rows?: number }> = ({
  message = 'Đang tải dữ liệu từ hệ thống...',
  rows = 3,
}) => (
  <div className="space-y-4 py-6" aria-busy="true" aria-label={message}>
    <div className="flex items-center gap-2.5 text-[13px] text-[#52526B] font-semibold">
      <span className="inline-block w-3 h-3 rounded-full bg-[#1EC1CB] animate-pulse" />
      <span>{message}</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#E4C3CC] rounded-[12px] p-5 space-y-3 animate-pulse"
        >
          <div className="h-32 bg-[#F6E6EA] rounded-[10px]" />
          <div className="h-4 bg-[#F6E6EA] rounded w-3/4" />
          <div className="h-3 bg-[#F6E6EA]/70 rounded w-1/2" />
          <div className="h-9 bg-[#F6E6EA] rounded-[8px] mt-2" />
        </div>
      ))}
    </div>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-[#F5B2BA] rounded-[16px] bg-[#FCE8EB]/50">
    <span className="text-3xl mb-2">⚠️</span>
    <h4 className="text-[17px] font-bold text-[#A61B2B]">Không thể hoàn tất thao tác</h4>
    <p className="text-[14px] text-[#1C1C28] mt-1.5 max-w-md mb-5">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 bg-[#1EC1CB] text-[#1C1C28] rounded-[12px] text-[14px] font-bold hover:bg-[#18A7B0] cursor-pointer"
      >
        Thử lại ngay
      </button>
    )}
  </div>
);
