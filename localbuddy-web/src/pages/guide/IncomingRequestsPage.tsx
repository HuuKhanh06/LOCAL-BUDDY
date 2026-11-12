// pages/guide/IncomingRequestsPage.tsx
// Tuân thủ BR-04 & NB-01:
// - Khi bấm "Chấp nhận", hệ thống kiểm tra nguyên tử (Atomic Check) xem khung giờ có đang bị HOLD/BUSY bởi đơn khác không.
// - Nếu trống , khóa slot sang HOLD trong 15 phút và chuyển đơn sang WAITING_PAYMENT + WAITING_DEPOSIT.
// - Nếu bấm "Từ chối", bắt buộc nhập/chọn lý do từ chối và chuyển đơn sang CANCELLED + UNPAID.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import {
  Countdown,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../components/common/GuideCard';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatTimeRange, getSecondsUntil } from '../../utils/time';

const REJECT_PRESETS = [
  'Đã có lịch cá nhân đột xuất trùng vào khung giờ này',
  'Phương tiện di chuyển đang bảo dưỡng, không kịp đón khách',
  'Điểm tham quan yêu cầu đang tạm đóng cửa bảo trì',
];

export const IncomingRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    bookings,
    currentUser,
    getUserById,
    acceptBooking,
    rejectBooking,
    expirePendingBooking,
  } = useBookingContext();
  const { showToast } = useToast();

  const [viewStatus, setViewStatus] = useState<'ready' | 'loading' | 'error'>('ready');
  const [rejectModalBookingId, setRejectModalBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>(REJECT_PRESETS[0]);

  const activeGuideId =
    currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';

  const incomingBookings = bookings.filter(
    (b) => b.bookingStatus === 'PENDING' && b.guideId === activeGuideId
  );

  const handleAccept = (bookingId: string) => {
    const res = acceptBooking(bookingId);
    if (res.ok) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalBookingId) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối đơn đặt lịch.', 'error');
      return;
    }
    const res = rejectBooking(rejectModalBookingId, rejectReason);
    showToast(res.message, 'info');
    setRejectModalBookingId(null);
  };

  return (
    <div className="space-y-6 py-2">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            Phản hồi trong 24 giờ & Khóa lịch nguyên tử 
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1">
            Yêu cầu đặt lịch mới gửi đến ({incomingBookings.length})
          </h1>
          <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
            Khi bạn bấm <strong>Chấp nhận</strong>, hệ thống sẽ khóa khung giờ sang <strong>HOLD (15 phút)</strong> để Du khách thanh toán cọc 30%
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-[12px] text-[12px] self-start">
          {(['ready', 'loading', 'error'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setViewStatus(st)}
              className={`px-2.5 py-1 rounded-[8px] font-bold cursor-pointer ${
                viewStatus === st
                  ? 'bg-[#1EC1CB] text-[#1C1C28]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {st === 'ready' ? 'Thành công' : st === 'loading' ? 'Đang tải' : 'Lỗi'}
            </button>
          ))}
        </div>
      </div>

      {viewStatus === 'error' ? (
        <ErrorState
          message="Không thể đồng bộ danh sách yêu cầu đặt lịch mới."
          onRetry={() => setViewStatus('ready')}
        />
      ) : viewStatus === 'loading' ? (
        <LoadingState message="Đang tải các yêu cầu đặt lịch từ Du khách..." />
      ) : incomingBookings.length === 0 ? (
        <EmptyState
          title="Hiện không có yêu cầu đặt lịch nào đang chờ duyệt"
          description="Tất cả các yêu cầu đặt lịch gửi đến bạn đã được xử lý. Bạn có thể mở thêm khung giờ rảnh hoặc kiểm tra các ca sắp diễn ra."
          actionText="Xem Đơn & Ca làm việc của tôi →"
          onAction={() => navigate('/guide/don-va-ca')}
        />
      ) : (
        <div className="space-y-6">
          {incomingBookings.map((b) => {
            const tourist = getUserById(b.touristId);
            const platformFee = Math.round(b.totalAmount * b.feeRate);
            const guideReceives = b.totalAmount - platformFee;

            return (
              <div
                key={b.id}
                className="bg-white border-2 border-[#E4C3CC] hover:border-[#1EC1CB] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-5 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4C3CC] pb-4">
                  <div className="flex items-center gap-3.5">
                    {tourist?.avatarUrl && (
                      <img
                        src={tourist.avatarUrl}
                        alt={tourist.fullName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#1EC1CB]"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#1A0A0F] text-[#F6E6EA] text-[12px] font-black">
                          {b.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FEF1DC] text-[#8C4A08] border border-[#F8CA84] text-[12px] font-bold">
                          ⏳ Chờ HDV phản hồi
                        </span>
                      </div>
                      <h3 className="text-[19px] font-extrabold text-[#1A0A0F] mt-1">
                        Du khách: {tourist?.fullName || 'Dương Đăng Huân'} ({tourist?.phone || '0905123456'})
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Countdown
                      seconds={getSecondsUntil(b.pendingExpiresAt, 82800)}
                      onExpire={() => expirePendingBooking(b.id)}
                      label="Hạn phản hồi 24h"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        expirePendingBooking(b.id);
                        showToast(
                          `Đã giả lập quá hạn 24h cho đơn ${b.id} -> Tự động chuyển CANCELLED !`,
                          'warning'
                        );
                      }}
                      className="text-[11px] font-bold text-[#A61B2B] underline cursor-pointer"
                    >
                      ⚡ Giả lập hết 24h không phản hồi
                    </button>
                  </div>
                </div>

                {/* Chi tiết ca & Địa điểm hẹn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF4F6] p-4 rounded-[12px] border border-[#E4C3CC] text-[14px]">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[#52526B]">📅 Ngày dẫn khách: </span>
                      <strong className="text-[#1A0A0F]">{formatDate(b.date)}</strong>
                    </div>
                    <div>
                      <span className="text-[#52526B]">⏰ Khung giờ: </span>
                      <strong className="text-[#1A0A0F]">
                        {formatTimeRange(b.startTime, b.endTime)} ({b.hours} giờ)
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#52526B]">👥 Số lượng khách: </span>
                      <strong className="text-[#1A0A0F]">{b.guestCount} người</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[#52526B]">📍 Điểm đón tại Đà Nẵng: </span>
                      <strong className="text-[#1A0A0F]">{b.meetingLocation}</strong>
                    </div>
                    <div>
                      <span className="text-[#52526B]">📝 Ghi chú yêu cầu của khách: </span>
                      <p className="text-[#1C1C28] italic mt-0.5">“{b.specialRequests}”</p>
                    </div>
                  </div>
                </div>

                {/* Bảng tài chính: HDV nhìn thấy rõ Phí sàn và Thu nhập thực nhận  */}
                <PaymentSummary
                  hourlyRate={b.hourlyRateSnapshot}
                  hours={b.hours}
                  total={b.totalAmount}
                  deposit={b.depositAmount}
                  remaining={b.remainingAmount}
                  feeRate={b.feeRate}
                  platformFee={platformFee}
                  guideReceives={guideReceives}
                  mode="guide"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4C3CC]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/guide/tin-nhan?partner=${b.touristId}&bookingId=${b.id}`)
                    }
                  >
                    💬 Nhắn tin hỏi thêm khách
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="danger"
                      onClick={() => setRejectModalBookingId(b.id)}
                    >
                      ✕ Từ chối yêu cầu
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleAccept(b.id)}
                    >
                      ✓ Chấp nhận & Khóa giữ lịch 15p
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal xác nhận từ chối đơn  */}
      <Modal
        isOpen={Boolean(rejectModalBookingId)}
        onClose={() => setRejectModalBookingId(null)}
        title={`Từ chối yêu cầu đặt lịch ${rejectModalBookingId} `}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectModalBookingId(null)}>
              Quay lại
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Xác nhận từ chối đơn
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#52526B]">
            Khi từ chối đơn đang chờ phản hồi (<strong>PENDING</strong>), bạn <strong>không bị tính lỗi vi phạm</strong> và khung giờ vẫn giữ trạng thái Đang trống .
          </p>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#1A0A0F] block">
              Chọn hoặc nhập lý do từ chối gửi tới Du khách *:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REJECT_PRESETS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectReason(r)}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border cursor-pointer ${
                    rejectReason === r
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#1C1C28] border-[#E4C3CC]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
