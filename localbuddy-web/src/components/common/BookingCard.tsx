// components/common/BookingCard.tsx
import React from 'react';
import { Booking } from '../../types';
import { StatusBadge, PaymentBadge } from './StatusBadge';
import { formatMoney, formatHourlyRate } from '../../utils/money';
import { formatDate, formatTimeRange } from '../../utils/time';

interface BookingCardProps {
  booking: Booking;
  guideName?: string;
  guideAvatar?: string;
  touristName?: string;
  onClick?: () => void;
  actionButton?: React.ReactNode;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  guideName,
  guideAvatar,
  touristName,
  onClick,
  actionButton,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#E4C3CC] rounded-[12px] p-5 shadow-[0_2px_10px_rgba(26,10,15,0.04)] hover:border-[#1EC1CB] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {guideAvatar && (
            <img
              src={guideAvatar}
              alt={guideName || 'HDV'}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#1EC1CB] shrink-0"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-extrabold text-[#1A0A0F] bg-[#F6E6EA] px-2.5 py-0.5 rounded-md tracking-wider">
                {booking.id}
              </span>
              {booking.hourlyRateSnapshot && (
                <span className="text-[12px] text-[#52526B] font-medium">
                  ({formatHourlyRate(booking.hourlyRateSnapshot)})
                </span>
              )}
            </div>
            <h4 className="text-[16px] font-bold text-[#1A0A0F] mt-1">
              {guideName
                ? `HDV: ${guideName}`
                : touristName
                ? `Du khách: ${touristName}`
                : 'Đơn đặt lịch theo giờ'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={booking.bookingStatus} />
          <PaymentBadge status={booking.paymentStatus} />
        </div>
      </div>

      {/* Banner cảnh báo nếu đang chờ cọc 15p hoặc chờ xác nhận hoàn thành 24h */}
      {booking.bookingStatus === 'WAITING_PAYMENT' && (
        <div className="bg-[#FEF1DC] border border-[#F8CA84] text-[#8C4A08] px-3.5 py-2 rounded-[10px] text-[13px] font-semibold flex items-center justify-between">
          <span>⏱ Đang giữ chỗ nguyên tử (HOLD) 15 phút — Chờ đặt cọc 30% ({formatMoney(booking.depositAmount)})</span>
        </div>
      )}

      {booking.bookingStatus === 'CONFIRMED' && booking.guideRequestedCompletion && (
        <div className="bg-[#E5F8F9] border border-[#1EC1CB] text-[#1C1C28] px-3.5 py-2 rounded-[10px] text-[13px] font-semibold">
          🔔 HDV đã yêu cầu xác nhận hoàn thành tour — Cửa sổ 24 giờ để xác nhận (UC.18) hoặc khiếu nại (UC.19)
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[13px] text-[#1C1C28] bg-[#FBF4F6] p-3.5 rounded-[10px] border border-[#E4C3CC]/60">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span className="font-semibold">
            {formatDate(booking.date)} ({formatTimeRange(booking.startTime, booking.endTime)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>
            <strong>{booking.guestCount}</strong> khách • <strong>{booking.hours}</strong> giờ
          </span>
        </div>
        {booking.meetingLocation && (
          <div className="flex items-center gap-2 truncate" title={booking.meetingLocation}>
            <span>📍</span>
            <span className="truncate">{booking.meetingLocation}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#E4C3CC] pt-3.5 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-[12px] text-[#52526B]">Tổng dịch vụ (G): </span>
            <span className="text-[16px] font-extrabold text-[#1A0A0F] tabular-nums">
              {formatMoney(booking.totalAmount)}
            </span>
          </div>
          <div className="text-[12px] text-[#52526B]">
            Cọc 30%: <strong className="text-[#1C1C28]">{formatMoney(booking.depositAmount)}</strong> • Còn 70%:{' '}
            <strong className="text-[#1C1C28]">{formatMoney(booking.remainingAmount)}</strong>
          </div>
        </div>
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()}>{actionButton}</div>
        )}
      </div>
    </div>
  );
};
