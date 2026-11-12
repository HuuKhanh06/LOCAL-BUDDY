// pages/tourist/BalancePaymentPage.tsx
// Tích hợp lớp PaymentProvider (SANDBOX) hỗ trợ 2 nhánh chuẩn BR-13 + Khôi phục đóng tab + Chống thanh toán trùng:
// 1. ONLINE (VNPay / MoMo / Thẻ): Thành công -> PaymentStatus = PAID, Ví HDV cộng +(G - F).
// 2. CASH (Tiền mặt trực tiếp): PaymentStatus = WAITING_RECONCILE (Chờ HDV bấm xác nhận đã nhận đủ 70% tiền mặt ở UC.21).

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { ErrorState } from '../../components/common/GuideCard';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/money';
import { formatDate, formatTimeRange } from '../../utils/time';
import {
  paymentProvider,
  PaymentGatewayId,
  SandboxOutcome,
} from '../../services/paymentProvider';

export const BalancePaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getBookingById, getGuideById, payFinal } = useBookingContext();
  const { showToast } = useToast();

  const booking = getBookingById(id || '');
  const guideItem = booking ? getGuideById(booking.guideId) : undefined;

  const [method, setMethod] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [gateway, setGateway] = useState<PaymentGatewayId>(() => {
    if (!booking) return 'VNPAY';
    const interrupted = paymentProvider.getInterruptedSession(booking.id, 'BALANCE_70');
    return interrupted ? interrupted.gateway : 'VNPAY';
  });
  const [recoveredBanner, setRecoveredBanner] = useState<string>(() => {
    if (!booking) return '';
    const interrupted = paymentProvider.getInterruptedSession(booking.id, 'BALANCE_70');
    return interrupted
      ? `Phát hiện phiên thanh toán 70% qua ${interrupted.gateway} trước đó bị gián đoạn (đóng tab hoặc hủy giữa chừng). Hệ thống chưa trừ tiền — bạn có thể hoàn tất thanh toán hoặc chọn trả Tiền mặt cho HDV.`
      : '';
  });
  const [onlineError, setOnlineError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!booking || booking.paymentStatus === 'PAID') return;

    paymentProvider.startCheckoutSession({
      bookingId: booking.id,
      phase: 'BALANCE_70',
      amount: booking.remainingAmount,
      gateway,
    });

    const handleBeforeUnload = () => {
      paymentProvider.markSessionInterrupted(booking.id, 'BALANCE_70');
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
          message="Không tìm thấy đơn đặt lịch cần tất toán 70%."
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
          message="Bạn không có quyền thực hiện tất toán cho đơn đặt lịch của người khác."
          onRetry={() => navigate('/don-cua-toi')}
        />
      </div>
    );
  }

  const handleOnlineSandbox = async (outcome: SandboxOutcome) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOnlineError('');

    try {
      const gwResult = await paymentProvider.processPayment({
        bookingId: booking.id,
        phase: 'BALANCE_70',
        amount: booking.remainingAmount,
        gateway,
        sandboxOutcome: outcome,
      });

      if (gwResult.status === 'DUPLICATE_BLOCKED') {
        setOnlineError(gwResult.messageVi);
        showToast(gwResult.messageVi, 'warning');
        return;
      }

      if (outcome === 'CANCELLED_MIDWAY') {
        setRecoveredBanner(gwResult.messageVi);
        showToast(gwResult.messageVi, 'info');
        return;
      }

      const res = payFinal(booking.id, 'ONLINE', gwResult.ok, gateway);
      if (res.ok) {
        showToast(`${res.message} (${gwResult.transactionRef})`, 'success');
        navigate(`/don/${booking.id}`);
      } else {
        setOnlineError(gwResult.messageVi || res.message);
        showToast(gwResult.messageVi || res.message, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashConfirm = () => {
    paymentProvider.clearCheckoutSession(booking.id, 'BALANCE_70');
    const res = payFinal(booking.id, 'CASH', true, 'CASH_DIRECT');
    if (res.ok) {
      showToast(res.message, 'info');
      navigate(`/don/${booking.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
          Quyết toán chuyến đi đã hoàn thành  • {paymentProvider.mode}
        </span>
        <h1 className="text-[24px] font-extrabold text-white mt-1">
          Tất toán 70% còn lại • Đơn {booking.id}
        </h1>
        <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
          Hướng dẫn viên: <strong>{guideItem?.user.fullName || 'Dương Đăng Huân'}</strong> • Ngày{' '}
          {formatDate(booking.date)} ({formatTimeRange(booking.startTime, booking.endTime)})
        </p>
      </div>

      {booking.paymentStatus === 'PAID' ? (
        <div className="bg-[#E3F7EF] border border-[#9FE0C6] rounded-[16px] p-8 text-center space-y-4">
          <span className="text-4xl block">✅</span>
          <h2 className="text-[22px] font-extrabold text-[#0F6E4B]">
            Đơn {booking.id} đã tất toán đầy đủ 100%
          </h2>
          <p className="text-[14px] text-[#1C1C28] max-w-md mx-auto">
            Hệ thống đã ghi nhận đầy đủ khoản thanh toán 70% cuối cùng và khóa chống thu tiền trùng lặp.
          </p>
          <Button variant="primary" onClick={() => navigate(`/don/${booking.id}`)}>
            Quay về chi tiết đơn & Đánh giá HDV →
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-6">
          {recoveredBanner && (
            <div className="p-4 rounded-[12px] bg-[#E5F8F9] border border-[#1EC1CB] text-[13px] text-[#1C1C28] flex items-start justify-between gap-3">
              <div>
                <strong className="block text-[#1A0A0F] mb-0.5">
                  🔄 Khôi phục phiên tất toán an toàn
                </strong>
                <span>{recoveredBanner}</span>
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo khôi phục"
                onClick={() => setRecoveredBanner('')}
                className="text-[#52526B] hover:text-[#1A0A0F] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <PaymentSummary
            hourlyRate={booking.hourlyRateSnapshot}
            hours={booking.hours}
            total={booking.totalAmount}
            deposit={booking.depositAmount}
            remaining={booking.remainingAmount}
            mode="tourist"
          />

          <div className="p-5 bg-[#F6E6EA] rounded-[14px] border border-[#E4C3CC] flex items-center justify-between">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] block">
                Khoản tiền 70% còn lại cần tất toán (B = 70% G)
              </span>
              <span className="text-[12px] text-[#52526B]">
                Đã trừ khoản đặt cọc 30% ({formatMoney(booking.depositAmount)})
              </span>
            </div>
            <span className="text-[28px] font-black text-[#1A0A0F] tabular-nums">
              {formatMoney(booking.remainingAmount)}
            </span>
          </div>

          {/* Chọn phương thức: ONLINE hoặc CASH */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-bold text-[#1A0A0F]">
              Chọn phương thức thanh toán 70% cuối:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMethod('ONLINE');
                  setOnlineError('');
                }}
                className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                  method === 'ONLINE'
                    ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28] font-bold shadow-xs'
                    : 'bg-white text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                }`}
              >
                <span className="text-[15px] font-extrabold block">
                  💳 Thanh toán Online qua Cổng
                </span>
                <span className="text-[12px] opacity-85">
                  Đơn chuyển sang Đã thanh toán đủ  ngay lập tức
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('CASH');
                  setOnlineError('');
                }}
                className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer ${
                  method === 'CASH'
                    ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28] font-bold shadow-xs'
                    : 'bg-white text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                }`}
              >
                <span className="text-[15px] font-extrabold block">
                  💵 Trả Tiền mặt trực tiếp cho HDV
                </span>
                <span className="text-[12px] opacity-85">
                  HDV sẽ bấm xác nhận đã nhận đủ 70% tiền mặt trên ứng dụng 
                </span>
              </button>
            </div>
          </div>

          {method === 'ONLINE' ? (
            <div className="border-2 border-dashed border-[#E4C3CC] rounded-[14px] p-5 bg-[#FBF4F6] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[14px] font-bold text-[#1A0A0F]">
                  Chọn cổng thanh toán Online ({paymentProvider.mode}):
                </span>
                <div className="flex gap-2">
                  {(['VNPAY', 'MOMO', 'BANK_CARD'] as const).map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setGateway(gw)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold border cursor-pointer ${
                        gateway === gw
                          ? 'bg-[#1C1C28] text-[#1EC1CB] border-[#1C1C28]'
                          : 'bg-white text-[#1C1C28] border-[#E4C3CC]'
                      }`}
                    >
                      {gw}
                    </button>
                  ))}
                </div>
              </div>

              {onlineError && (
                <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
                  ⚠️ {onlineError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant="primary"
                  disabled={isProcessing}
                  onClick={() => handleOnlineSandbox('SUCCESS')}
                  className="w-full"
                >
                  ✓ Tất toán {formatMoney(booking.remainingAmount)}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isProcessing}
                  onClick={() => handleOnlineSandbox('CANCELLED_MIDWAY')}
                  className="w-full"
                >
                  ⏸ Hủy giữa chừng
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={isProcessing}
                  onClick={() => handleOnlineSandbox('FAILED_RETRYABLE')}
                  className="w-full"
                >
                  ✕ Giả lập Lỗi cổng
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-[#F8CA84] rounded-[14px] p-5 bg-[#FEF1DC]/50 space-y-4">
              <h4 className="text-[15px] font-bold text-[#8C4A08]">
                💵 Hướng dẫn thanh toán Tiền mặt trực tiếp:
              </h4>
              <p className="text-[14px] text-[#1C1C28] leading-relaxed">
                Bạn sẽ trao trực tiếp số tiền <strong>{formatMoney(booking.remainingAmount)}</strong> cho Hướng dẫn viên{' '}
                <strong>{guideItem?.user.fullName}</strong>. Sau khi bạn bấm nút xác nhận bên dưới, trạng thái thanh toán sẽ chuyển sang{' '}
                <strong>Chờ HDV xác nhận tiền mặt </strong> cho đến khi HDV bấm xác nhận đã nhận đủ tiền.
              </p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleCashConfirm}
                className="w-full"
              >
                Xác nhận trả Tiền mặt {formatMoney(booking.remainingAmount)} cho HDV →
              </Button>
            </div>
          )}

          <div className="pt-2">
            <Button variant="ghost" onClick={() => navigate(`/don/${booking.id}`)}>
              ← Quay lại chi tiết đơn
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
