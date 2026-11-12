// pages/tourist/BookingDetailPage.tsx
// Màn hình chi tiết đơn đặt lịch của Du khách theo Mục [9] THAM KHẢO UI:
// - Timeline dọc truy vết tiến trình (BOOKING_LOG)
// - Đồng hồ đếm ngược theo từng trạng thái (24h chờ duyệt, 15p giữ chỗ, 24h xác nhận/khiếu nại)
// - MỘT hành động chính nổi bật cho mỗi trạng thái
// - Hiển thị liên hệ trực tiếp SĐT/Email sau khi cọc 30% thành công (không chat nội bộ)
// - Chuẩn tokens thương hiệu: --lb-bg (#272A2D), --lb-accent (#EB5B38), --lb-sand (#E6E4DC), --lb-blue (#347CCB)

import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { Countdown, ErrorState } from '../../components/common/GuideCard';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/money';
import {
  formatDate,
  formatDateTime,
  formatTimeRange,
  calcDeltaHours,
  getSecondsUntil,
} from '../../utils/time';
import { calcPenaltySplit } from '../../features/payment/calc';
import { getBookingActions } from '../../features/booking/actions';

const CANCEL_REASON_PRESETS = [
  'Thay đổi lịch bay / tàu đến Đà Nẵng đột xuất',
  'Thời tiết mưa lớn không thuận lợi để đi tham quan ngoài trời',
  'Thành viên trong đoàn gặp vấn đề sức khỏe',
  'Muốn đổi sang ngày hoặc khung giờ khác',
];

const DISPUTE_CATEGORY_PRESETS = [
  'HDV vắng mặt tại điểm hẹn (No-show quá 30 phút)',
  'HDV đến trễ giờ hẹn quá 30 phút làm ảnh hưởng lịch trình',
  'HDV tự ý cắt giảm thời lượng hoặc bỏ qua điểm tham quan đã thỏa thuận',
  'Thái độ phục vụ hoặc chuyên môn không đúng cam kết trên hồ sơ',
  'HDV yêu cầu thu thêm phụ phí ngoài thỏa thuận trên hệ thống',
];

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    currentUser,
    getBookingById,
    getGuideById,
    getUserById,
    getDisputeByBookingId,
    getReviewByBookingId,
    cancelBooking,
    confirmCompletion,
    expirePendingBooking,
    expireDeposit,
    autoConfirmCompletionTimeout,
    submitDispute,
    submitReview,
    uploadFile,
  } = useBookingContext();
  const { showToast } = useToast();

  const booking = getBookingById(id || '');
  const guideItem = booking ? getGuideById(booking.guideId) : undefined;
  const touristUser = booking ? getUserById(booking.touristId) : undefined;
  const disputeRecord = booking ? getDisputeByBookingId(booking.id) : undefined;
  const existingReview = booking ? getReviewByBookingId(booking.id) : undefined;

  const handleEvidenceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadFile('complaint-evidences', file);
    if (res.ok) {
      setDisputeEvidenceUrl(res.url);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(
    searchParams.get('huy') === '1'
  );
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Cancel modal state (Giả lập ΔT kiểm thử đủ 3 bậc phạt BR-06)
  const realDelta = booking
    ? Math.max(1, calcDeltaHours(booking.date, booking.startTime))
    : 56;
  const [simulatedDelta, setSimulatedDelta] = useState<number>(realDelta);
  const [cancelReason, setCancelReason] = useState<string>(
    CANCEL_REASON_PRESETS[0]
  );

  // Dispute modal state
  const [disputeCategory, setDisputeCategory] = useState<string>(
    DISPUTE_CATEGORY_PRESETS[0]
  );
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState<string>('');

  // Review modal state (chỉ Du khách đánh giá Thổ địa, không đánh giá hai chiều)
  const [reviewStars, setReviewStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  if (!booking) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Không tìm thấy mã đơn đặt lịch này."
          onRetry={() => navigate('/don-cua-toi')}
        />
      </div>
    );
  }

  const isAuthorized =
    !currentUser ||
    currentUser.role === 'admin' ||
    (currentUser.role === 'tourist' && booking.touristId === currentUser.id) ||
    (currentUser.role === 'guide' && booking.guideId === currentUser.id);

  if (!isAuthorized) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Bạn không có quyền truy cập đơn đặt lịch này. Mỗi du khách chỉ có thể quản lý các chuyến đi do chính mình đặt."
          onRetry={() => navigate('/don-cua-toi')}
        />
      </div>
    );
  }

  const actions = getBookingActions({
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    role: 'tourist',
    guideRequestedCompletion: booking.guideRequestedCompletion,
    canReview: !existingReview,
    deltaHours: simulatedDelta,
  });

  const isDeposited = booking.paymentStatus === 'DEPOSITED';
  const previewSplit = isDeposited
    ? calcPenaltySplit(booking.depositAmount, simulatedDelta, booking.feeRate)
    : {
        penaltyRate: 0,
        penaltyAmount: 0,
        refundToTourist: 0,
        platformFeeOnPenalty: 0,
        guideCompensation: 0,
      };

  const handleActionClick = (key: string) => {
    if (key === 'pay_deposit') {
      navigate(`/don/${booking.id}/dat-coc`);
    } else if (key === 'cancel') {
      setIsCancelModalOpen(true);
    } else if (key === 'confirm_complete') {
      const res = confirmCompletion(booking.id);
      showToast(res.message, 'success');
    } else if (key === 'pay_final') {
      navigate(`/don/${booking.id}/thanh-toan-70`);
    } else if (key === 'dispute') {
      setIsDisputeModalOpen(true);
    } else if (key === 'review') {
      setIsReviewModalOpen(true);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      showToast(
        'Vui lòng nhập hoặc chọn lý do hủy đơn (Ràng buộc CANCELLATION_RECORD.lyDo NOT NULL).',
        'error'
      );
      return;
    }
    const res = cancelBooking(booking.id, cancelReason, simulatedDelta);
    setIsCancelModalOpen(false);
    showToast(res.message, 'info');
  };

  const handleConfirmDispute = () => {
    if (!disputeDescription.trim() && !disputeCategory.trim()) {
      showToast('Vui lòng nhập nội dung chi tiết khiếu nại.', 'error');
      return;
    }
    const res = submitDispute(
      booking.id,
      disputeCategory,
      disputeDescription || disputeCategory,
      disputeEvidenceUrl ? [disputeEvidenceUrl] : []
    );
    if (!res.ok) {
      showToast(res.message, 'error');
      return;
    }
    setIsDisputeModalOpen(false);
    showToast(res.message, 'warning');
  };

  const handleConfirmReview = () => {
    if (!reviewComment.trim()) {
      showToast('Vui lòng chia sẻ nhận xét về chuyến đi.', 'error');
      return;
    }
    const res = submitReview(booking.id, reviewStars, reviewComment);
    if (!res.ok) {
      showToast(res.message, 'error');
      return;
    }
    setIsReviewModalOpen(false);
    showToast(res.message, 'success');
  };

  const isDepositPaid =
    booking.paymentStatus !== 'UNPAID' &&
    booking.paymentStatus !== 'WAITING_DEPOSIT';

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Nút điều hướng & Thẻ liên hệ trực tiếp SĐT/Email (Thay thế chat) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/don-cua-toi')}>
          ← Quay lại danh sách đơn của tôi
        </Button>
        <div>
          {isDepositPaid ? (
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[12px] font-semibold text-emerald-900 shadow-xs">
              <span>📞 SĐT Thổ địa: <strong>{guideItem?.user.phone || '0905111222'}</strong></span>
              <span>•</span>
              <span>✉️ {guideItem?.user.email || 'duongdanghuan.guide@gmail.com'}</span>
            </div>
          ) : (
            <span className="text-[12px] text-[#78716C] bg-[#F3F1EC] px-3.5 py-1.5 rounded-full border border-[#E7E5E4]">
              🔒 SĐT & Email Thổ địa sẽ hiển thị ngay sau khi cọc 30%
            </span>
          )}
        </div>
      </div>

      {/* 1. KHỐI HEADER ĐƠN & TRẠNG THÁI SONG SONG */}
      <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E5E4] pb-5">
          <div className="flex items-center gap-4">
            {guideItem?.profile.avatarUrl && (
              <img
                src={guideItem.profile.avatarUrl}
                alt={guideItem.user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#E7E5E4] shadow-xs shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-[#FEEDDC] text-[#1C1917] border border-[#F1DEC9] text-[12px] font-bold tracking-wider">
                  {booking.id}
                </span>
                <span className="text-[12px] text-[#78716C]">
                  Tạo lúc: {formatDateTime(booking.createdAt)}
                </span>
              </div>
              <h1 className="text-[20px] sm:text-[24px] font-black text-[#1C1917] mt-1">
                Chuyến đi cùng Thổ địa {guideItem?.user.fullName || 'Dương Đăng Huân'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={booking.bookingStatus} />
            <PaymentBadge status={booking.paymentStatus} />
          </div>
        </div>

        {/* 2. ĐẾM NGƯỢC THEO TRẠNG THÁI THEO MỤC [9] */}
        {booking.bookingStatus === 'PENDING' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <strong className="text-[14px] text-amber-900 block">
                ⏳ Đang chờ Thổ địa phản hồi trong 24 giờ 
              </strong>
              <span className="text-[13px] text-amber-800">
                Khung giờ trên lịch vẫn mở  cho đến khi Thổ địa chấp nhận.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Countdown
                seconds={getSecondsUntil(booking.pendingExpiresAt, 82800)}
                onExpire={() => expirePendingBooking(booking.id)}
                label="Hạn 24h"
              />
              <button
                type="button"
                onClick={() => {
                  expirePendingBooking(booking.id);
                  showToast('Đã giả lập quá hạn 24h HDV không phản hồi -> Đơn tự động hủy!', 'warning');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#D12B79] hover:bg-[#B51E63] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
              >
                ⚡ Tua hết 24h
              </button>
            </div>
          </div>
        )}

        {booking.bookingStatus === 'WAITING_PAYMENT' && (
          <div className="p-4 rounded-2xl bg-orange-50 border-2 border-[#EB5B38] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <strong className="text-[14px] text-[#EB5B38] block">
                ⏱ Khung giờ đang được giữ chỗ nguyên tử  trong 15 phút!
              </strong>
              <span className="text-[13px] text-[#1C1917]">
                Thổ địa đã chấp nhận. Vui lòng thanh toán cọc 30% ({formatMoney(booking.depositAmount)}) trước khi hết hạn.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Countdown
                seconds={getSecondsUntil(booking.holdExpiresAt, 840)}
                onExpire={() => expireDeposit(booking.id)}
                label="Giữ chỗ"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(`/don/${booking.id}/dat-coc`)}
                className="bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold"
              >
                💳 Đặt cọc 30% ngay
              </Button>
            </div>
          </div>
        )}

        {/* Cửa sổ 24 giờ sau khi HDV bấm Yêu cầu hoàn thành */}
        {booking.bookingStatus === 'CONFIRMED' && booking.guideRequestedCompletion && (
          <div className="p-5 rounded-2xl bg-sky-50 border-2 border-sky-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] px-2.5 py-0.5 rounded">
                  Cửa sổ xác nhận 24 giờ 
                </span>
                <h3 className="text-[16px] font-bold text-[#1C1917] mt-1">
                  Thổ địa {guideItem?.user.fullName} đã gửi yêu cầu xác nhận hoàn thành tour!
                </h3>
                <p className="text-[13px] text-[#57534E]">
                  Bạn có <strong>24 giờ</strong> để bấm <strong>Xác nhận hoàn thành</strong> (chuyển sang tất toán 70%) hoặc <strong>Gửi khiếu nại</strong> nếu có sự cố. Khi đã hoàn thành , quyền khiếu nại sẽ khóa lại.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Countdown
                  seconds={getSecondsUntil(booking.completionAutoConfirmAt, 79200)}
                  onExpire={() => autoConfirmCompletionTimeout(booking.id)}
                  label="Tự chốt sau"
                />
                <button
                  type="button"
                  onClick={() => {
                    autoConfirmCompletionTimeout(booking.id);
                    showToast(
                      'Đã giả lập trôi qua 24h không có khiếu nại -> Tự động chuyển COMPLETED!',
                      'success'
                    );
                  }}
                  className="text-[11px] font-bold text-[#1C1917] underline cursor-pointer"
                >
                  ⚡ Giả lập trôi 24h
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chờ HDV xác nhận 70% tiền mặt */}
        {booking.bookingStatus === 'COMPLETED' &&
          booking.paymentStatus === 'WAITING_RECONCILE' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
              💵 <strong>Đang chờ Thổ địa xác nhận thu 70% tiền mặt ({formatMoney(booking.remainingAmount)}):</strong> Bạn đã chọn thanh toán trực tiếp. Khi Thổ địa bấm xác nhận, đơn sẽ chuyển sang <strong>Đã thanh toán 100% </strong>.
            </div>
          )}

        {/* Thông tin chi tiết lịch trình */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F3F1EC] p-5 rounded-2xl border border-[#E7E5E4] text-[13px]">
          <div className="space-y-2">
            <div>
              <span className="text-[#78716C]">📅 Ngày khởi hành: </span>
              <strong className="text-[#1C1917]">{formatDate(booking.date)}</strong>
            </div>
            <div>
              <span className="text-[#78716C]">⏰ Khung giờ: </span>
              <strong className="text-[#1C1917]">
                {formatTimeRange(booking.startTime, booking.endTime)} ({booking.hours} giờ)
              </strong>
            </div>
            <div>
              <span className="text-[#78716C]">👥 Số lượng khách: </span>
              <strong className="text-[#1C1917]">{booking.guestCount} khách</strong>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[#78716C]">📍 Điểm hẹn tại Đà Nẵng: </span>
              <strong className="text-[#1C1917]">{booking.meetingLocation}</strong>
            </div>
            <div>
              <span className="text-[#78716C]">📝 Ghi chú yêu cầu: </span>
              <p className="text-[#1C1917] italic mt-0.5">“{booking.specialRequests}”</p>
            </div>
          </div>
        </div>

        {/* Hồ sơ tranh chấp nếu có */}
        {(booking.bookingStatus === 'DISPUTED' || disputeRecord) && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-red-900">
                ⚖️ Hồ sơ Khiếu nại ({disputeRecord?.id || 'Đang thẩm định'})
              </h3>
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-white text-red-800 border border-red-200">
                {disputeRecord?.status === 'RESOLVED' ? 'Đã có phán quyết Admin' : 'Chờ Admin xử lý '}
              </span>
            </div>
            {disputeRecord && (
              <>
                <p className="text-red-950">
                  <strong>Hạng mục:</strong> {disputeRecord.reasonCategory}
                </p>
                <p className="text-red-950">
                  <strong>Mô tả:</strong> {disputeRecord.description}
                </p>
                {disputeRecord.resolutionNote && (
                  <div className="p-3 bg-white rounded-xl border border-red-200 mt-2">
                    <strong className="text-[#1C1917] block">
                      Biên bản phán quyết của Admin:
                    </strong>
                    <p className="text-[#57534E] mt-0.5">{disputeRecord.resolutionNote}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. KHỐI TÀI CHÍNH / QUYẾT TOÁN HỦY */}
      <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-4">
        {booking.bookingStatus === 'CANCELLED' ? (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-red-700">
              Biên bản quyết toán đơn đã hủy ({booking.id})
            </h2>
            <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-2xl p-5 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Lý do hủy:</span>
                <strong className="text-[#1C1917] text-right max-w-md">
                  {booking.cancelReason || 'Đã hủy theo yêu cầu'}
                </strong>
              </div>
              {booking.deltaHours !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Khoảng cách trước giờ hẹn :</span>
                  <strong className="text-[#1C1917] tabular-nums">{booking.deltaHours} giờ</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#78716C]">Tiền cọc 30% ban đầu:</span>
                <strong className="text-[#1C1917] tabular-nums">
                  {formatMoney(booking.depositAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Mức phạt áp dụng :</span>
                <strong className="tabular-nums">−{formatMoney(booking.penalty || 0)}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 border-t border-[#E7E5E4] pt-2.5 text-[15px] font-bold">
                <span>Số tiền hoàn trả về tài khoản:</span>
                <span className="tabular-nums">+{formatMoney(booking.refund || 0)}</span>
              </div>
            </div>
          </div>
        ) : (
          <PaymentSummary
            hourlyRate={booking.hourlyRateSnapshot}
            hours={booking.hours}
            total={booking.totalAmount}
            deposit={booking.depositAmount}
            remaining={booking.remainingAmount}
            mode="tourist"
          />
        )}
      </div>

      {/* Đánh giá chuyến đi (chỉ Du khách đánh giá Thổ địa) */}
      {existingReview && (
        <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#1C1917]">
              Đánh giá của bạn cho chuyến đi này 
            </h3>
            <span className="text-amber-500 font-bold">
              {'★'.repeat(existingReview.stars)} ({existingReview.stars}/5 sao)
            </span>
          </div>
          <p className="text-[14px] text-[#57534E] italic">“{existingReview.comment}”</p>
          {existingReview.guideReply && (
            <div className="p-3.5 rounded-2xl bg-[#F3F1EC] border-l-4 border-[#EB5B38] space-y-1">
              <strong className="text-[12px] text-[#1C1917] block">
                ↳ Phản hồi từ Thổ địa {guideItem?.user.fullName || 'Đà Nẵng'}:
              </strong>
              <p className="text-[13px] text-[#57534E]">{existingReview.guideReply}</p>
            </div>
          )}
        </div>
      )}

      {/* 4. THỎA THUẬN ĐIỆN TỬ & TIMELINE DỌC (BOOKING_LOG theo Mục [9]) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thỏa thuận dịch vụ điện tử */}
        <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#347CCB]">
                Hợp đồng dịch vụ
              </span>
              <h3 className="text-[16px] font-bold text-[#1C1917]">
                Thỏa thuận dịch vụ điện tử
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isDepositPaid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isDepositPaid ? '✓ Đã kích hoạt' : '⏳ Kích hoạt sau khi cọc'}
            </span>
          </div>

          <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-2xl p-4 text-[13px] text-[#57534E] space-y-2 leading-relaxed">
            <p>
              <strong>Bên A (Du khách):</strong> {touristUser?.fullName || 'Khách hàng'} •{' '}
              <strong>Bên B (Thổ địa):</strong> {guideItem?.user.fullName || 'Dương Đăng Huân'}
            </p>
            <p>
              • <strong>Địa điểm:</strong> {booking.meetingLocation} vào ngày {formatDate(booking.date)} ({booking.startTime} – {booking.endTime}).
            </p>
            <p>
              • <strong>Thanh toán:</strong> Tổng giá trị {formatMoney(booking.totalAmount)} (Cọc 30%: {formatMoney(booking.depositAmount)}, Tất toán 70%: {formatMoney(booking.remainingAmount)}).
            </p>
            <p>
              • <strong>Chính sách hủy:</strong> Hủy trước &gt;48h hoàn 100% cọc; từ 24h–48h hoàn 50% cọc; dưới 24h phạt 100% cọc. Nếu Thổ địa hủy, hoàn 100% cọc.
            </p>
          </div>
        </div>

        {/* TIMELINE DỌC (BOOKING_LOG THEO MỤC [9]) */}
        <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#347CCB]">
                BOOKING_LOG • Tiến trình đơn
              </span>
              <h3 className="text-[16px] font-bold text-[#1C1917]">
                Nhật ký truy vết thời gian thực
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#78716C]">Audit Trail</span>
          </div>

          <ol className="relative border-l-2 border-[#EB5B38] ml-3 space-y-4 text-[13px] py-1">
            <li className="ml-5">
              <div className="absolute w-3 h-3 bg-[#EB5B38] rounded-full -left-[7px] mt-1 ring-4 ring-orange-100" />
              <div className="font-bold text-[#1C1917]">
                Khởi tạo yêu cầu đặt lịch 
              </div>
              <div className="text-[12px] text-[#78716C]">
                {formatDateTime(booking.createdAt)} • Chờ Thổ địa phản hồi trong 24 giờ
              </div>
            </li>

            {booking.acceptedAt && (
              <li className="ml-5">
                <div className="absolute w-3 h-3 bg-[#347CCB] rounded-full -left-[7px] mt-1 ring-4 ring-sky-100" />
                <div className="font-bold text-[#1C1917]">
                  Thổ địa chấp nhận & Giữ chỗ nguyên tử 
                </div>
                <div className="text-[12px] text-[#78716C]">
                  {formatDateTime(booking.acceptedAt)} • Khóa lịch HOLD 15 phút để cọc 30%
                </div>
              </li>
            )}

            {booking.confirmedAt && (
              <li className="ml-5">
                <div className="absolute w-3 h-3 bg-emerald-600 rounded-full -left-[7px] mt-1 ring-4 ring-emerald-100" />
                <div className="font-bold text-emerald-800">
                  Đặt cọc 30% thành công ({formatMoney(booking.depositAmount)}) 
                </div>
                <div className="text-[12px] text-[#78716C]">
                  {formatDateTime(booking.confirmedAt)} • Khởi tạo SERVICE_AGREEMENT điện tử
                </div>
              </li>
            )}

            {booking.completionRequestedAt && (
              <li className="ml-5">
                <div className="absolute w-3 h-3 bg-[#347CCB] rounded-full -left-[7px] mt-1 ring-4 ring-sky-100" />
                <div className="font-bold text-[#1C1917]">
                  Thổ địa gửi yêu cầu xác nhận hoàn thành tour 
                </div>
                <div className="text-[12px] text-[#78716C]">
                  {formatDateTime(booking.completionRequestedAt)} • Mở cửa sổ 24 giờ xác nhận hoặc khiếu nại
                </div>
              </li>
            )}

            {booking.completedAt && (
              <li className="ml-5">
                <div className="absolute w-3 h-3 bg-emerald-600 rounded-full -left-[7px] mt-1 ring-4 ring-emerald-100" />
                <div className="font-bold text-emerald-800">
                  Hoàn thành chuyến đi & Tất toán 70% 
                </div>
                <div className="text-[12px] text-[#78716C]">
                  {formatDateTime(booking.completedAt)} • Trạng thái thanh toán: {booking.paymentStatus}
                </div>
              </li>
            )}

            {booking.cancelledAt && (
              <li className="ml-5">
                <div className="absolute w-3 h-3 bg-red-600 rounded-full -left-[7px] mt-1 ring-4 ring-red-100" />
                <div className="font-bold text-red-800">
                  Đơn đặt lịch đã hủy 
                </div>
                <div className="text-[12px] text-[#78716C]">
                  {formatDateTime(booking.cancelledAt)} • Lý do: {booking.cancelReason}
                </div>
              </li>
            )}
          </ol>
        </div>
      </div>

      {/* 5. MỘT HÀNH ĐỘNG CHÍNH NỔI BẬT THEO MỤC [9] */}
      {actions.length > 0 && (
        <div className="bg-white border-2 border-[#EB5B38] rounded-[22px] p-5 shadow-md flex flex-wrap gap-3 items-center justify-between">
          <span className="text-[13px] font-bold text-[#1C1917]">
            Thao tác khả dụng cho đơn {booking.id}:
          </span>
          <div className="flex flex-wrap gap-3">
            {booking.bookingStatus === 'CONFIRMED' && !booking.guideRequestedCompletion && (
              <Button
                variant="secondary"
                onClick={() => {
                  setDisputeCategory(DISPUTE_CATEGORY_PRESETS[0]);
                  setDisputeDescription(
                    'Đã quá giờ hẹn 30 phút tại điểm đón nhưng Thổ địa không có mặt (No-show).'
                  );
                  setIsDisputeModalOpen(true);
                }}
              >
                ⚠️ Báo Thổ địa vắng mặt (No-show)
              </Button>
            )}
            {actions.map((act) => (
              <Button
                key={act.key}
                variant={act.variant}
                onClick={() => handleActionClick(act.key)}
                className={
                  act.variant === 'primary'
                    ? 'bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold'
                    : ''
                }
              >
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: HỦY ĐƠN  */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Xác nhận hủy đơn ${booking.id} `}
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
              Giữ lại đơn
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Xác nhận hủy đơn đặt lịch
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {isDeposited ? (
            <>
              <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[12px] font-bold text-[#1C1917]">
                    ⚡ Chọn mốc thời gian để xem mức hoàn hủy:
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'Thời gian hủy = 72h (>48h: 0%)', val: 72 },
                      { label: 'Thời gian hủy = 36h (24–48h: 50%)', val: 36 },
                      { label: 'Thời gian hủy = 12h (<24h: 100%)', val: 12 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSimulatedDelta(opt.val)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                          simulatedDelta === opt.val
                            ? 'bg-[#D12B79] text-white border-[#D12B79]'
                            : 'bg-white text-[#1C1917] border-[#F1DEC9]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 text-[13px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Khoảng cách đến giờ hẹn :</span>
                  <strong className="text-[#1C1917] tabular-nums">{simulatedDelta} giờ</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Tiền cọc 30% đã đóng:</span>
                  <strong className="text-[#1C1917] tabular-nums">
                    {formatMoney(booking.depositAmount)}
                  </strong>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>
                    Mức phạt áp dụng ({(previewSplit.penaltyRate * 100).toFixed(0)}% tiền cọc):
                  </span>
                  <strong className="tabular-nums">
                    −{formatMoney(previewSplit.penaltyAmount)}
                  </strong>
                </div>
                <div className="flex justify-between text-emerald-700 border-t border-orange-200 pt-2 font-bold text-[14px]">
                  <span>Số tiền hoàn trả cho bạn (Refund):</span>
                  <span className="tabular-nums">
                    +{formatMoney(previewSplit.refundToTourist)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[13px] text-emerald-800 font-semibold">
              ✓ Đơn này chưa thanh toán tiền cọc nên bạn được hủy miễn phí (Phí phạt: 0 ₫).
            </div>
          )}

          {/* Lý do hủy bắt buộc */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#1C1917] block">
              Chọn nhanh hoặc nhập Lý do hủy đơn * (Bắt buộc):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CANCEL_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCancelReason(preset)}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border cursor-pointer ${
                    cancelReason === preset
                      ? 'bg-[#D12B79] text-white border-[#D12B79]'
                      : 'bg-[#FEEDDC] text-[#1C1917] border-[#F1DEC9]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập chi tiết lý do hủy đơn..."
              rows={2}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: GỬI KHIẾU NẠI */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title={`Gửi hồ sơ khiếu nại đơn ${booking.id} `}
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleConfirmDispute}>
              Gửi khiếu nại tới Admin thẩm định
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#78716C]">
            Khi gửi khiếu nại, đơn sẽ chuyển sang trạng thái <strong>Đang khiếu nại </strong> và tạm dừng thu 70% còn lại cho đến khi Quản trị viên đưa ra phán quyết .
          </p>

          <div>
            <label className="text-[13px] font-bold text-[#1C1917] block mb-1.5">
              Hạng mục sự cố *:
            </label>
            <select
              value={disputeCategory}
              onChange={(e) => setDisputeCategory(e.target.value)}
              className="w-full px-3.5 min-h-[44px] rounded-2xl border border-[#E7E5E4] text-[13px] text-[#1C1917] bg-white focus:outline-none"
            >
              {DISPUTE_CATEGORY_PRESETS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Mô tả chi tiết sự việc & yêu cầu giải quyết *"
            placeholder="Nêu rõ thời gian, địa điểm và chi tiết sự việc để Admin đối soát..."
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            rows={4}
          />

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#1C1917] block mb-1">
              Hình ảnh / Minh chứng đính kèm:
            </label>
            <input
              type="text"
              value={disputeEvidenceUrl}
              onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
              className="w-full px-3.5 min-h-[42px] rounded-2xl border border-[#E7E5E4] text-[13px] text-[#1C1917] focus:outline-none"
            />
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#347CCB] hover:text-[#1C1917] cursor-pointer pt-1">
              <span>📤 Tải tệp bằng chứng khiếu nại (Storage: complaint-evidences)</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => void handleEvidenceFileUpload(e)}
              />
            </label>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: ĐÁNH GIÁ THỔ ĐỊA */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Đánh giá Thổ địa ${guideItem?.user.fullName || ''} `}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>
              Để sau
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReview}
              className="bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold"
            >
              Gửi đánh giá xác thực
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[14px] font-bold text-[#1C1917] block mb-2">
              Mức độ hài lòng của bạn (1 – 5 sao):
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewStars(s)}
                  className={`w-11 h-11 rounded-2xl text-xl font-bold border transition-all cursor-pointer ${
                    s <= reviewStars
                      ? 'bg-[#EB5B38] text-white border-[#EB5B38]'
                      : 'bg-[#F3F1EC] text-gray-400 border-[#E7E5E4]'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-[14px] font-bold text-[#1C1917]">
                {reviewStars} / 5 sao
              </span>
            </div>
          </div>

          <Textarea
            label="Chia sẻ cảm nhận về chuyến đi tại Đà Nẵng *"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};
