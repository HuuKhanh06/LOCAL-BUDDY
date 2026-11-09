// pages/tourist/BookingDetailPage.tsx
// Màn hình trung tâm điều phối toàn bộ vòng đời đơn đặt lịch của Du khách:
// - Đồng hồ đếm ngược 24h chờ HDV phản hồi (PENDING - BR-03) + nút Giả lập hết 24h
// - Đồng hồ đếm ngược 15p giữ chỗ nguyên tử (WAITING_PAYMENT - BR-05) + nút Đặt cọc 30%
// - Cửa sổ 24h sau khi HDV bấm Yêu cầu hoàn thành (UC.17 → UC.18 Xác nhận hoàn thành / UC.19 Gửi khiếu nại) + nút Giả lập trôi qua 24h
// - Modal Hủy đơn (UC.24) có Bảng tính phạt/hoàn theo ΔT (>48h: 0%, 24-48h: 50%, <24h: 100%) + nút thử 3 mốc ΔT + bắt buộc nhập Lý do hủy (CANCELLATION_RECORD.lyDo NOT NULL)
// - Modal Đánh giá 1–5 sao (UC.26) khi COMPLETED + PAID

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

  // Cancel modal state (Cho phép giả lập ΔT để kiểm thử đủ 3 bậc phạt BR-06)
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
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState<string>(
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=80'
  );

  // Review modal state
  const [reviewStars, setReviewStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>(
    'Hướng dẫn viên rất nhiệt tình, đúng giờ và am hiểu sâu sắc văn hóa ẩm thực Đà Nẵng!'
  );

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

  const actions = getBookingActions({
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    role: 'tourist',
    guideRequestedCompletion: booking.guideRequestedCompletion,
    canReview: !existingReview,
    deltaHours: simulatedDelta,
  });

  // Tính xem trước tiền phạt/hoàn theo simulatedDelta
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

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Nút điều hướng đầu trang */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/don-cua-toi')}>
          ← Quay lại danh sách đơn của tôi
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/tin-nhan?partner=${booking.guideId}&bookingId=${booking.id}`)}
          >
            💬 Nhắn tin với HDV ({guideItem?.user.fullName || 'Đà Nẵng'})
          </Button>
        </div>
      </div>

      {/* 1. KHỐI HEADER ĐƠN & TRẠNG THÁI SONG SONG (BookingStatus + PaymentStatus) */}
      <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4C3CC] pb-5">
          <div className="flex items-center gap-4">
            {guideItem?.profile.avatarUrl && (
              <img
                src={guideItem.profile.avatarUrl}
                alt={guideItem.user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#1EC1CB] shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-[#1A0A0F] text-[#F6E6EA] text-[12px] font-black tracking-wider">
                  {booking.id}
                </span>
                <span className="text-[12px] text-[#52526B]">
                  Tạo lúc: {formatDateTime(booking.createdAt)}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#1A0A0F] mt-1">
                Hành trình Đà Nẵng cùng HDV {guideItem?.user.fullName || 'Nguyễn Hữu Khanh'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={booking.bookingStatus} />
            <PaymentBadge status={booking.paymentStatus} />
          </div>
        </div>

        {/* 2. BANNER ĐẾM NGƯỢC & TÁC VỤ TỰ ĐỘNG THEO TỪNG GIAI ĐOẠN (Automation 1, 2, 3) */}
        {booking.bookingStatus === 'PENDING' && (
          <div className="p-4 rounded-[12px] bg-[#FEF1DC] border border-[#F8CA84] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <strong className="text-[14px] text-[#8C4A08] block">
                ⏳ Đang chờ Hướng dẫn viên phản hồi trong 24 giờ (BR-03)
              </strong>
              <span className="text-[13px] text-[#1C1C28]">
                Khung giờ trên lịch vẫn đang mở (AVAILABLE) cho đến khi HDV bấm Chấp nhận (BR-04).
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
                className="px-2.5 py-1.5 rounded-[8px] bg-[#1C1C28] text-[#1EC1CB] text-[11px] font-bold cursor-pointer"
              >
                ⚡ Tua hết 24h
              </button>
            </div>
          </div>
        )}

        {booking.bookingStatus === 'WAITING_PAYMENT' && (
          <div className="p-4 rounded-[12px] bg-[#FEF1DC] border-2 border-[#F8CA84] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <strong className="text-[14px] text-[#8C4A08] block">
                ⏱ Khung giờ đang được khóa nguyên tử (HOLD) trong 15 phút!
              </strong>
              <span className="text-[13px] text-[#1C1C28]">
                Vui lòng thanh toán đặt cọc 30% ({formatMoney(booking.depositAmount)}) trước khi hết giờ.
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
              >
                💳 Đặt cọc 30% ngay
              </Button>
            </div>
          </div>
        )}

        {/* Cửa sổ 24 giờ sau khi HDV bấm Yêu cầu hoàn thành (UC.17 → UC.18 / UC.19) */}
        {booking.bookingStatus === 'CONFIRMED' && booking.guideRequestedCompletion && (
          <div className="p-5 rounded-[14px] bg-[#E5F8F9] border-2 border-[#1EC1CB] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#1C1C28] text-[#1EC1CB] px-2.5 py-0.5 rounded">
                  UC.17 → UC.18 / UC.19 • Cửa sổ xác nhận 24 giờ (BR-08, BR-12)
                </span>
                <h3 className="text-[16px] font-extrabold text-[#1A0A0F] mt-1">
                  HDV {guideItem?.user.fullName} đã gửi yêu cầu xác nhận hoàn thành tour!
                </h3>
                <p className="text-[13px] text-[#1C1C28]">
                  Bạn có <strong>24 giờ</strong> để bấm <strong>Xác nhận hoàn thành</strong> (chuyển sang tất toán 70%) hoặc bấm <strong>Gửi khiếu nại</strong> nếu có sự cố. Một khi đã hoàn thành (COMPLETED), quyền khiếu nại sẽ tự động khóa theo BR-12.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Countdown
                  seconds={getSecondsUntil(booking.completionAutoConfirmAt, 79200)}
                  onExpire={() => autoConfirmCompletionTimeout(booking.id)}
                  label="Tự động chốt sau"
                />
                <button
                  type="button"
                  onClick={() => {
                    autoConfirmCompletionTimeout(booking.id);
                    showToast(
                      'Đã giả lập trôi qua 24h không có khiếu nại -> Tự động chuyển COMPLETED + WAITING_FINAL (BR-08)!',
                      'success'
                    );
                  }}
                  className="text-[11px] font-bold text-[#1A0A0F] underline cursor-pointer"
                >
                  ⚡ Giả lập trôi qua 24h (Auto-Complete)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thông báo chờ HDV xác nhận tiền mặt 70% (WAITING_RECONCILE - UC.21) */}
        {booking.bookingStatus === 'COMPLETED' &&
          booking.paymentStatus === 'WAITING_RECONCILE' && (
            <div className="p-4 rounded-[12px] bg-[#FEF1DC] border border-[#F8CA84] text-[13px] text-[#8C4A08]">
              💵 <strong>Đang chờ HDV xác nhận đã thu 70% tiền mặt ({formatMoney(booking.remainingAmount)}):</strong> Bạn đã chọn trả tiền mặt trực tiếp. Ngay khi HDV bấm <em>“Xác nhận đã thu đủ 70% tiền mặt”</em> (UC.21), đơn sẽ chuyển sang <strong>Đã thanh toán 100% (PAID)</strong>.
            </div>
          )}

        {/* Thông tin chi tiết lịch trình */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF4F6] p-5 rounded-[12px] border border-[#E4C3CC] text-[14px]">
          <div className="space-y-2">
            <div>
              <span className="text-[#52526B]">📅 Ngày khởi hành: </span>
              <strong className="text-[#1A0A0F]">{formatDate(booking.date)}</strong>
            </div>
            <div>
              <span className="text-[#52526B]">⏰ Khung giờ: </span>
              <strong className="text-[#1A0A0F]">
                {formatTimeRange(booking.startTime, booking.endTime)} ({booking.hours} giờ)
              </strong>
            </div>
            <div>
              <span className="text-[#52526B]">👥 Số lượng khách: </span>
              <strong className="text-[#1A0A0F]">{booking.guestCount} khách</strong>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[#52526B]">📍 Địa điểm hẹn tại Đà Nẵng: </span>
              <strong className="text-[#1A0A0F]">{booking.meetingLocation}</strong>
            </div>
            <div>
              <span className="text-[#52526B]">📝 Ghi chú lịch trình (Booking Notes): </span>
              <p className="text-[#1C1C28] italic mt-0.5">“{booking.specialRequests}”</p>
            </div>
          </div>
        </div>

        {/* Nếu đơn đang DISPUTED hoặc đã xử lý tranh chấp, hiển thị chi tiết hồ sơ tranh chấp */}
        {(booking.bookingStatus === 'DISPUTED' || disputeRecord) && (
          <div className="p-5 rounded-[12px] bg-[#FCE8EB]/70 border border-[#F5B2BA] space-y-2 text-[14px]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#A61B2B]">
                ⚖️ Hồ sơ Khiếu nại & Tranh chấp ({disputeRecord?.id || 'Đang thẩm định'})
              </h3>
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#A61B2B] border border-[#F5B2BA]">
                {disputeRecord?.status === 'RESOLVED' ? 'Đã có phán quyết của Admin' : 'Chờ Admin phán quyết (UC.27)'}
              </span>
            </div>
            {disputeRecord && (
              <>
                <p className="text-[#1C1C28]">
                  <strong>Hạng mục:</strong> {disputeRecord.reasonCategory}
                </p>
                <p className="text-[#1C1C28]">
                  <strong>Mô tả sự việc:</strong> {disputeRecord.description}
                </p>
                {disputeRecord.resolutionNote && (
                  <div className="p-3 bg-white rounded-[10px] border border-[#E4C3CC] mt-2">
                    <strong className="text-[#1A0A0F] block">
                      Biên bản phán quyết của Admin:
                    </strong>
                    <p className="text-[#1C1C28] mt-0.5">{disputeRecord.resolutionNote}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. KHỐI THÔNG TIN THANH TOÁN / QUYẾT TOÁN HỦY ĐƠN */}
      <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-4">
        {booking.bookingStatus === 'CANCELLED' ? (
          <div className="space-y-4">
            <h2 className="text-[18px] font-extrabold text-[#A61B2B]">
              Biên bản quyết toán đơn đã hủy ({booking.id})
            </h2>
            <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-5 space-y-2.5 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#52526B]">Lý do hủy đã ghi nhận:</span>
                <strong className="text-[#1A0A0F] text-right max-w-md">
                  {booking.cancelReason || 'Đã hủy theo yêu cầu'}
                </strong>
              </div>
              {booking.deltaHours !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#52526B]">Khoảng cách thời gian trước giờ hẹn (ΔT):</span>
                  <strong className="text-[#1C1C28] tabular-nums">{booking.deltaHours} giờ</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#52526B]">Tiền đặt cọc 30% ban đầu (D):</span>
                <strong className="text-[#1C1C28] tabular-nums">
                  {formatMoney(booking.depositAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-[#A61B2B]">
                <span>Tiền phạt cọc theo quy tắc BR-06:</span>
                <strong className="tabular-nums">−{formatMoney(booking.penalty || 0)}</strong>
              </div>
              <div className="flex justify-between text-[#0F6E4B] border-t border-[#E4C3CC] pt-2.5 text-[15px] font-extrabold">
                <span>Số tiền hoàn trả về tài khoản Du khách:</span>
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

      {/* Nếu đã đánh giá, hiển thị đánh giá hai chiều của khách và HDV */}
      {existingReview && (
        <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#1A0A0F]">
              Đánh giá hai chiều cho chuyến đi này (UC.26)
            </h3>
            <span className="text-amber-500 font-bold">
              {'★'.repeat(existingReview.stars)} ({existingReview.stars}/5)
            </span>
          </div>
          <p className="text-[14px] text-[#1C1C28] italic">“{existingReview.comment}”</p>
          {existingReview.guideReply ? (
            <div className="p-3.5 rounded-[12px] bg-[#FBF4F6] border-l-3 border-[#1EC1CB] space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <strong className="text-[#1A0A0F]">
                  ↳ Phản hồi từ HDV {guideItem?.user.fullName || 'Đà Nẵng'}:
                </strong>
                {existingReview.touristRating && (
                  <span className="font-bold text-[#0F6E4B]">
                    HDV đánh giá bạn: {'★'.repeat(existingReview.touristRating)} ({existingReview.touristRating}/5)
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#1C1C28]">{existingReview.guideReply}</p>
            </div>
          ) : (
            <p className="text-[12px] text-[#52526B]">
              ⏳ Đang chờ Hướng dẫn viên gửi phản hồi đánh giá hai chiều.
            </p>
          )}
        </div>
      )}

      {/* 3B. THỎA THUẬN DỊCH VỤ ĐIỆN TỬ (SERVICE_AGREEMENT - BR-10) & NHẬT KÝ SỰ KIỆN ĐƠN (BOOKING_LOG - BR-11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thỏa thuận dịch vụ điện tử (BR-10) */}
        <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4C3CC] pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#118B93]">
                SERVICE_AGREEMENT • BR-10
              </span>
              <h3 className="text-[16px] font-extrabold text-[#1A0A0F]">
                Thỏa thuận dịch vụ điện tử Đà Nẵng
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                booking.paymentStatus !== 'UNPAID' &&
                booking.paymentStatus !== 'WAITING_DEPOSIT'
                  ? 'bg-[#E6F7F0] text-[#146C43] border border-[#B2E5D0]'
                  : 'bg-[#FFF5E5] text-[#9A5B06] border border-[#F8D39A]'
              }`}
            >
              {booking.paymentStatus !== 'UNPAID' &&
              booking.paymentStatus !== 'WAITING_DEPOSIT'
                ? '✓ Cả hai bên đã ký số'
                : '⏳ Khởi tạo sau khi đặt cọc 30%'}
            </span>
          </div>

          <div className="bg-[#FDF7F9] border border-[#E8CED5] rounded-[12px] p-4 text-[13px] text-[#1C1C28] space-y-2 leading-relaxed">
            <p>
              <strong>Bên A (Du khách):</strong> {touristUser?.fullName || 'Dương Đăng Huân'} •{' '}
              <strong>Bên B (HDV bản địa):</strong> {guideItem?.user.fullName || 'Nguyễn Hữu Khanh'}
            </p>
            <p>
              • <strong>Phạm vi dịch vụ:</strong> Hướng dẫn du lịch theo giờ tại{' '}
              <strong>{booking.meetingLocation}</strong> vào ngày{' '}
              <strong>{formatDate(booking.date)}</strong> ({booking.startTime} – {booking.endTime},{' '}
              {booking.hours} giờ).
            </p>
            <p>
              • <strong>Điều khoản tài chính (BR-05, BR-13):</strong> Tổng giá trị{' '}
              <strong>{formatMoney(booking.totalAmount)}</strong> (Đặt cọc 30%:{' '}
              <strong>{formatMoney(booking.depositAmount)}</strong>, Tất toán 70% còn lại sau tour:{' '}
              <strong>{formatMoney(booking.remainingAmount)}</strong>).
            </p>
            <p>
              • <strong>Chính sách hủy theo ΔT (BR-06):</strong> Hủy trước &gt;48h hoàn 100% cọc; từ
              24h–48h phạt 50% cọc; dưới 24h phạt 100% cọc. Nếu HDV hủy đơn, hoàn 100% cọc cho khách.
            </p>
          </div>
        </div>

        {/* Nhật ký sự kiện đơn đặt lịch (BOOKING_LOG - BR-11) */}
        <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4C3CC] pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#118B93]">
                BOOKING_LOG • BR-11
              </span>
              <h3 className="text-[16px] font-extrabold text-[#1A0A0F]">
                Nhật ký truy vết trạng thái đơn
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#52526B]">Audit Trail</span>
          </div>

          <ol className="relative border-l-2 border-[#1EC1CB] ml-3 space-y-3 text-[13px]">
            <li className="ml-4">
              <div className="absolute w-2.5 h-2.5 bg-[#1EC1CB] rounded-full -left-[6px] mt-1.5" />
              <div className="font-bold text-[#1A0A0F]">
                Khởi tạo yêu cầu đặt lịch (PENDING)
              </div>
              <div className="text-[12px] text-[#52526B]">
                {formatDateTime(booking.createdAt)} • Khung giờ vẫn mở (AVAILABLE) chờ HDV duyệt (BR-04)
              </div>
            </li>

            {booking.acceptedAt && (
              <li className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-[#1EC1CB] rounded-full -left-[6px] mt-1.5" />
                <div className="font-bold text-[#1A0A0F]">
                  HDV chấp nhận đơn & Khóa nguyên tử khung giờ 15 phút (WAITING_PAYMENT)
                </div>
                <div className="text-[12px] text-[#52526B]">
                  {formatDateTime(booking.acceptedAt)} • Slot chuyển sang HOLD 15 phút (BR-05)
                </div>
              </li>
            )}

            {booking.confirmedAt && (
              <li className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-[#1B8A5A] rounded-full -left-[6px] mt-1.5" />
                <div className="font-bold text-[#146C43]">
                  Thanh toán đặt cọc 30% ({formatMoney(booking.depositAmount)}) thành công (CONFIRMED)
                </div>
                <div className="text-[12px] text-[#52526B]">
                  {formatDateTime(booking.confirmedAt)} • Khởi tạo SERVICE_AGREEMENT (BR-10)
                </div>
              </li>
            )}

            {booking.completionRequestedAt && (
              <li className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-[#1EC1CB] rounded-full -left-[6px] mt-1.5" />
                <div className="font-bold text-[#1A0A0F]">
                  HDV gửi yêu cầu xác nhận hoàn thành tour (UC.17)
                </div>
                <div className="text-[12px] text-[#52526B]">
                  {formatDateTime(booking.completionRequestedAt)} • Mở cửa sổ 24 giờ xác nhận/khiếu nại (BR-08)
                </div>
              </li>
            )}

            {booking.completedAt && (
              <li className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-[#1B8A5A] rounded-full -left-[6px] mt-1.5" />
                <div className="font-bold text-[#146C43]">
                  Hoàn thành chuyến đi & Chốt thanh toán 70% cuối (COMPLETED)
                </div>
                <div className="text-[12px] text-[#52526B]">
                  {formatDateTime(booking.completedAt)} • Trạng thái thanh toán: {booking.paymentStatus}
                </div>
              </li>
            )}

            {booking.cancelledAt && (
              <li className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-[#C93B3B] rounded-full -left-[6px] mt-1.5" />
                <div className="font-bold text-[#A61B2B]">
                  Đơn đặt lịch đã hủy (CANCELLED)
                </div>
                <div className="text-[12px] text-[#52526B]">
                  {formatDateTime(booking.cancelledAt)} • Lý do: {booking.cancelReason}
                </div>
              </li>
            )}
          </ol>
        </div>
      </div>

      {/* 4. THANH NÚT HÀNH ĐỘNG CHÍNH XÁC THEO MA TRẬN TRẠNG THÁI */}
      {actions.length > 0 && (
        <div className="bg-white border-2 border-[#1EC1CB] rounded-[16px] p-5 shadow-md flex flex-wrap gap-3 items-center justify-between">
          <span className="text-[13px] font-bold text-[#1A0A0F]">
            Thao tác khả dụng cho đơn {booking.id}:
          </span>
          <div className="flex flex-wrap gap-3">
            {booking.bookingStatus === 'CONFIRMED' && !booking.guideRequestedCompletion && (
              <Button
                variant="secondary"
                onClick={() => {
                  setDisputeCategory(DISPUTE_CATEGORY_PRESETS[0]);
                  setDisputeDescription(
                    'Đã quá giờ hẹn 30 phút tại điểm đón nhưng Hướng dẫn viên không có mặt (No-show).'
                  );
                  setIsDisputeModalOpen(true);
                }}
              >
                ⚠️ Báo HDV vắng mặt (No-show)
              </Button>
            )}
            {actions.map((act) => (
              <Button
                key={act.key}
                variant={act.variant}
                onClick={() => handleActionClick(act.key)}
              >
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: HỦY ĐƠN & BẢNG XEM TRƯỚC PHẠT/HOÀN THEO ΔT + LÝ DO BẮT BUỘC (UC.24, BR-06, BR-07) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Xác nhận hủy đơn ${booking.id} (UC.24)`}
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
              <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[12px] font-bold text-[#1A0A0F]">
                    ⚡ Chọn mốc thời gian ΔT để kiểm thử 3 bậc phạt của BR-06:
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'ΔT = 72h (>48h: 0%)', val: 72 },
                      { label: 'ΔT = 36h (24–48h: 50%)', val: 36 },
                      { label: 'ΔT = 12h (<24h: 100%)', val: 12 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSimulatedDelta(opt.val)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                          simulatedDelta === opt.val
                            ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                            : 'bg-white text-[#1C1C28] border-[#E4C3CC]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#F6E6EA]/60 border border-[#E4C3CC] rounded-[12px] p-4 text-[14px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#52526B]">Khoảng cách đến giờ khởi hành (ΔT):</span>
                  <strong className="text-[#1A0A0F] tabular-nums">{simulatedDelta} giờ</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52526B]">Tiền đặt cọc 30% đã đóng (D):</span>
                  <strong className="text-[#1C1C28] tabular-nums">
                    {formatMoney(booking.depositAmount)}
                  </strong>
                </div>
                <div className="flex justify-between text-[#A61B2B]">
                  <span>
                    Mức phạt áp dụng ({(previewSplit.penaltyRate * 100).toFixed(0)}% tiền cọc):
                  </span>
                  <strong className="tabular-nums">
                    −{formatMoney(previewSplit.penaltyAmount)}
                  </strong>
                </div>
                <div className="flex justify-between text-[#0F6E4B] border-t border-[#E4C3CC] pt-2 font-extrabold text-[15px]">
                  <span>Số tiền hoàn trả cho bạn (Refund):</span>
                  <span className="tabular-nums">
                    +{formatMoney(previewSplit.refundToTourist)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3.5 bg-[#E3F7EF] border border-[#99E2C4] rounded-[12px] text-[13px] text-[#0F6E4B] font-semibold">
              ✓ Đơn này chưa thanh toán tiền cọc nên bạn được hủy miễn phí (Phí phạt: 0 ₫).
            </div>
          )}

          {/* Lý do hủy bắt buộc (CANCELLATION_RECORD.lyDo NOT NULL) */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#1A0A0F] block">
              Chọn nhanh hoặc nhập Lý do hủy đơn * (Bắt buộc lưu vào CSDL):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CANCEL_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCancelReason(preset)}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border cursor-pointer ${
                    cancelReason === preset
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#1C1C28] border-[#E4C3CC]'
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

      {/* MODAL 2: GỬI KHIẾU NẠI TRONG CỬA SỔ 24 GIỜ (UC.19, BR-12) */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title={`Gửi hồ sơ khiếu nại đơn ${booking.id} (UC.19)`}
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
          <p className="text-[13px] text-[#52526B]">
            Khi gửi khiếu nại, đơn sẽ chuyển sang trạng thái <strong>Đang khiếu nại (DISPUTED)</strong> và tạm dừng thu 70% còn lại cho đến khi Quản trị viên đưa ra phán quyết (UC.27).
          </p>

          <div>
            <label className="text-[13px] font-bold text-[#1A0A0F] block mb-1.5">
              Hạng mục sự cố *:
            </label>
            <select
              value={disputeCategory}
              onChange={(e) => setDisputeCategory(e.target.value)}
              className="w-full px-3.5 min-h-[44px] rounded-[12px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
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
            placeholder="Nêu rõ thời gian, địa điểm và chi tiết sự việc để Admin đối soát với HDV..."
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            rows={4}
          />

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#1A0A0F] block mb-1">
              Hình ảnh / Minh chứng đính kèm (URL hoặc tải tệp):
            </label>
            <input
              type="text"
              value={disputeEvidenceUrl}
              onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
              className="w-full px-3.5 min-h-[42px] rounded-[12px] border border-[#E4C3CC] text-[13px] text-[#1C1C28]"
            />
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer pt-1">
              <span>📤 Tải tệp bằng chứng khiếu nại từ máy (Supabase Storage: complaint-evidences)</span>
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

      {/* MODAL 3: ĐÁNH GIÁ HƯỚNG DẪN VIÊN (UC.26, BR-09) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Đánh giá HDV ${guideItem?.user.fullName || ''} (UC.26)`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>
              Để sau
            </Button>
            <Button variant="primary" onClick={handleConfirmReview}>
              Gửi đánh giá xác thực
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[14px] font-bold text-[#1A0A0F] block mb-2">
              Mức độ hài lòng của bạn (1 – 5 sao):
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewStars(s)}
                  className={`w-11 h-11 rounded-[10px] text-xl font-bold border transition-all cursor-pointer ${
                    s <= reviewStars
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-gray-400 border-[#E4C3CC]'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-[14px] font-bold text-[#1A0A0F]">
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
