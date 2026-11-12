// pages/tourist/DepositPaymentPage.tsx
// Tích hợp lớp PaymentProvider (Chế độ SANDBOX có thể thay thế bằng VNPay / MoMo thật):
// - Thành công -> CONFIRMED + DEPOSITED, Slot HOLD -> BUSY
// - Lỗi mạng tạm thời / Hủy giữa chừng / Đóng tab giữa lúc thanh toán -> Khôi phục phiên & cho thử lại trong 15 phút
// - Chống thanh toán trùng (Idempotency Key)
// - Từ chối giao dịch / Hết hạn 15 phút -> Hủy đơn & nhả lịch về AVAILABLE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Countdown, ErrorState } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/money';
import { formatDate, formatTimeRange, getSecondsUntil } from '../../utils/time';
import {
  paymentProvider,
  PaymentGatewayId,
  SandboxOutcome,
} from '../../services/paymentProvider';

export const DepositPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getBookingById, getGuideById, payDeposit, expireDeposit } =
    useBookingContext();
  const { showToast } = useToast();

  const booking = getBookingById(id || '');
  const guideItem = booking ? getGuideById(booking.guideId) : undefined;

  const [gateway, setGateway] = useState<PaymentGatewayId>(() => {
    if (!booking) return 'VNPAY';
    const interrupted = paymentProvider.getInterruptedSession(booking.id, 'DEPOSIT_30');
    return interrupted ? interrupted.gateway : 'VNPAY';
  });
  const [recoveredBanner, setRecoveredBanner] = useState<string>(() => {
    if (!booking) return '';
    const interrupted = paymentProvider.getInterruptedSession(booking.id, 'DEPOSIT_30');
    return interrupted
      ? `Phát hiện phiên thanh toán qua ${interrupted.gateway} trước đó bị gián đoạn (đóng tab hoặc hủy giữa chừng). Chưa có khoản tiền nào bị trừ — khung giờ của bạn vẫn đang được bảo lưu để hoàn tất đặt cọc 30%.`
      : '';
  });
  const [tempRetryError, setTempRetryError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Khởi tạo phiên và bắt sự kiện đóng tab
  useEffect(() => {
    if (!booking || booking.bookingStatus !== 'WAITING_PAYMENT') return;

    paymentProvider.startCheckoutSession({
      bookingId: booking.id,
      phase: 'DEPOSIT_30',
      amount: booking.depositAmount,
      gateway,
    });

    const handleBeforeUnload = () => {
      paymentProvider.markSessionInterrupted(booking.id, 'DEPOSIT_30');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [booking, gateway]);

  if (!booking) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Không tìm thấy đơn đặt lịch cần thanh toán cọc."
          onRetry={() => navigate('/don-cua-toi')}
        />
      </div>
    );
  }

  const isAuthorized =
    !currentUser ||
    currentUser.role === 'admin' ||
    (currentUser.role === 'tourist' && booking.touristId === currentUser.id);

  if (!isAuthorized) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Bạn không có quyền thực hiện thanh toán cọc cho đơn đặt lịch của người khác."
          onRetry={() => navigate('/don-cua-toi')}
        />
      </div>
    );
  }

  // Ngách thanh toán trùng: Đơn đã đặt cọc 30% rồi nhưng người dùng mở lại link thanh toán
  const isAlreadyDeposited =
    booking.paymentStatus === 'DEPOSITED' ||
    booking.paymentStatus === 'PAID' ||
    booking.bookingStatus === 'CONFIRMED' ||
    booking.bookingStatus === 'COMPLETED';

  const secondsLeft = getSecondsUntil(booking.holdExpiresAt, 840);

  const handleExpire = async () => {
    await paymentProvider.processPayment({
      bookingId: booking.id,
      phase: 'DEPOSIT_30',
      amount: booking.depositAmount,
      gateway,
      sandboxOutcome: 'EXPIRED',
    });
    expireDeposit(booking.id);
    showToast(
      `Đã hết thời hạn 15 phút giữ chỗ ! Đơn ${booking.id} đã tự động hủy và nhả lịch về AVAILABLE.`,
      'error'
    );
  };

  const handleSandboxCheckout = async (outcome: SandboxOutcome) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTempRetryError('');

    try {
      const gwResult = await paymentProvider.processPayment({
        bookingId: booking.id,
        phase: 'DEPOSIT_30',
        amount: booking.depositAmount,
        gateway,
        sandboxOutcome: outcome,
      });

      if (gwResult.status === 'DUPLICATE_BLOCKED') {
        setTempRetryError(gwResult.messageVi);
        showToast(gwResult.messageVi, 'warning');
        return;
      }

      if (outcome === 'EXPIRED') {
        expireDeposit(booking.id);
        showToast(gwResult.messageVi, 'error');
        return;
      }

      if (outcome === 'CANCELLED_MIDWAY') {
        setRecoveredBanner(gwResult.messageVi);
        showToast(gwResult.messageVi, 'info');
        return;
      }

      const isSuccess = gwResult.ok;
      const cancelImmediately = outcome === 'REJECTED_RELEASE_SLOT';

      const res = payDeposit(booking.id, isSuccess, gateway, cancelImmediately);

      if (res.ok) {
        showToast(`${res.message} (${gwResult.transactionRef})`, 'success');
        navigate(`/don/${booking.id}`);
      } else if (cancelImmediately) {
        showToast(res.message, 'error');
        navigate(`/don/${booking.id}`);
      } else {
        setTempRetryError(gwResult.messageVi || res.message);
        showToast(gwResult.messageVi || res.message, 'warning');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            Khóa lịch nguyên tử HOLD 15 phút  • {paymentProvider.mode}
          </span>
          <h1 className="text-[24px] font-extrabold text-white mt-1">
            Thanh toán đặt cọc 30% • Đơn {booking.id}
          </h1>
        </div>

        {booking.bookingStatus === 'WAITING_PAYMENT' && (
          <div className="flex flex-col items-end gap-1.5">
            <Countdown
              seconds={secondsLeft}
              onExpire={handleExpire}
              label="Thời gian giữ chỗ"
            />
            <button
              type="button"
              onClick={handleExpire}
              className="text-[11px] text-[#F6E6EA]/80 hover:text-[#1EC1CB] underline cursor-pointer"
            >
              ⚡ Mô phỏng hết 15 phút giữ chỗ ngay
            </button>
          </div>
        )}
      </div>

      {isAlreadyDeposited ? (
        <div className="bg-[#E3F7EF] border border-[#9FE0C6] rounded-[16px] p-8 text-center space-y-4">
          <span className="text-4xl block">🛡️</span>
          <h2 className="text-[22px] font-extrabold text-[#0F6E4B]">
            Đơn {booking.id} đã được đặt cọc 30% thành công
          </h2>
          <p className="text-[14px] text-[#1C1C28] max-w-md mx-auto">
            Hệ thống chống thanh toán trùng lặp (Idempotency Protection) đã khóa giao dịch đặt cọc của đơn này để đảm bảo bạn không bao giờ bị trừ tiền 2 lần.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => navigate(`/don/${booking.id}`)}>
              Xem chi tiết đơn đã xác nhận →
            </Button>
          </div>
        </div>
      ) : booking.bookingStatus === 'CANCELLED' ? (
        <div className="bg-[#FCE8EB] border border-[#F5B2BA] rounded-[16px] p-8 text-center space-y-4">
          <span className="text-4xl block">⏰</span>
          <h2 className="text-[22px] font-extrabold text-[#A61B2B]">
            Đơn đặt lịch {booking.id} đã bị hủy
          </h2>
          <p className="text-[14px] text-[#1C1C28] max-w-md mx-auto">
            {booking.cancelReason ||
              'Đã quá hạn 15 phút giữ chỗ hoặc giao dịch bị từ chối. Khung giờ của Hướng dẫn viên đã được giải phóng về trạng thái Đang trống .'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate(`/don/${booking.id}`)}>
              Xem chi tiết đơn
            </Button>
            <Button variant="primary" onClick={() => navigate(`/guides/${booking.guideId}`)}>
              Đặt lại khung giờ khác →
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-6">
          {recoveredBanner && (
            <div className="p-4 rounded-[12px] bg-[#E5F8F9] border border-[#1EC1CB] text-[13px] text-[#1C1C28] flex items-start justify-between gap-3">
              <div>
                <strong className="block text-[#1A0A0F] mb-0.5">
                  🔄 Khôi phục phiên thanh toán an toàn
                </strong>
                <span>{recoveredBanner}</span>
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo khôi phục phiên"
                onClick={() => setRecoveredBanner('')}
                className="text-[#52526B] hover:text-[#1A0A0F] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Thông tin tóm tắt chuyến đi */}
          <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
            <div>
              <span className="text-[#52526B] block text-[12px]">Hướng dẫn viên bản địa:</span>
              <strong className="text-[#1A0A0F]">
                {guideItem?.user.fullName || 'Dương Đăng Huân'}
              </strong>
            </div>
            <div>
              <span className="text-[#52526B] block text-[12px]">Ngày & Khung giờ giữ chỗ:</span>
              <strong className="text-[#1A0A0F]">
                {formatDate(booking.date)} ({formatTimeRange(booking.startTime, booking.endTime)})
              </strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#52526B] block text-[12px]">Địa điểm đón tại Đà Nẵng:</span>
              <strong className="text-[#1C1C28]">{booking.meetingLocation}</strong>
            </div>
          </div>

          <PaymentSummary
            hourlyRate={booking.hourlyRateSnapshot}
            hours={booking.hours}
            total={booking.totalAmount}
            deposit={booking.depositAmount}
            remaining={booking.remainingAmount}
            mode="tourist"
          />

          {/* Chọn cổng thanh toán */}
          <div className="space-y-3">
            <label className="text-[14px] font-bold text-[#1A0A0F] block">
              Chọn cổng thanh toán trực tuyến:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'VNPAY', label: 'VNPay QR', sub: 'Ngân hàng nội địa' },
                  { id: 'MOMO', label: 'Ví MoMo', sub: 'Siêu ứng dụng' },
                  { id: 'BANK_CARD', label: 'Thẻ ATM / Visa', sub: 'Napas 247' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGateway(item.id)}
                  className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                    gateway === item.id
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28] font-bold shadow-xs'
                      : 'bg-white text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                  }`}
                >
                  <span className="block text-[14px] font-extrabold">{item.label}</span>
                  <span className="block text-[11px] opacity-80">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Số tiền cọc 30% cần thanh toán */}
          <div className="p-5 rounded-[14px] bg-[#F6E6EA] border border-[#E4C3CC] flex items-center justify-between">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] block">
                Số tiền đặt cọc 30% cần thanh toán ngay
              </span>
              <span className="text-[12px] text-[#52526B]">
                Cổng đã chọn: <strong>{gateway}</strong> • Giữ lịch nguyên tử 15 phút
              </span>
            </div>
            <span className="text-[28px] font-black text-[#1A0A0F] tabular-nums">
              {formatMoney(booking.depositAmount)}
            </span>
          </div>

          {tempRetryError && (
            <div className="p-4 bg-[#FEF1DC] border border-[#F8CA84] rounded-[12px] text-[13px] text-[#8C4A08] font-semibold">
              ⚠️ {tempRetryError}
            </div>
          )}

          {/* Cổng thanh toán chế độ SANDBOX (PaymentProvider) */}
          <div className="border-2 border-dashed border-[#E4C3CC] rounded-[14px] p-5 bg-[#FBF4F6] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[13px] font-extrabold text-[#1A0A0F]">
                💳 Cổng thanh toán {paymentProvider.mode} ({gateway})
              </span>
              <span className="text-[11px] bg-[#1C1C28] text-[#1EC1CB] px-2.5 py-0.5 rounded-full font-bold">
                Chống thu trùng • Hỗ trợ khôi phục đóng tab
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                disabled={isProcessing}
                onClick={() => handleSandboxCheckout('SUCCESS')}
                className="w-full sm:col-span-2"
              >
                ✓ Xác nhận thanh toán cọc {formatMoney(booking.depositAmount)} ({gateway})
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => handleSandboxCheckout('FAILED_RETRYABLE')}
                className="w-full"
              >
                🔄 Giả lập Lỗi mạng (Thử lại trong 15p)
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => handleSandboxCheckout('CANCELLED_MIDWAY')}
                className="w-full"
              >
                ⏸ Giả lập Hủy giữa chừng / Đóng tab
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={isProcessing}
                onClick={() => handleSandboxCheckout('REJECTED_RELEASE_SLOT')}
                className="w-full sm:col-span-2"
              >
                ✕ Giả lập Ngân hàng từ chối GD (Hủy đơn & Giải phóng lịch)
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={() => navigate(`/don/${booking.id}`)}>
              ← Quay lại chi tiết đơn
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
