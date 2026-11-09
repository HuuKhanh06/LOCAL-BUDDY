// pages/guide/MyBookingsAndShiftsPage.tsx
// Quản lý toàn bộ Đơn & Ca dẫn khách của Hướng dẫn viên:
// - Bấm "Yêu cầu xác nhận hoàn thành" (UC.17) -> mở cửa sổ 24 giờ cho khách xác nhận (UC.18) hoặc khiếu nại (UC.19)
// - Trong cửa sổ 24 giờ, HDV cũng có quyền gửi khiếu nại nếu khách vi phạm (UC.19)
// - Bấm "Xác nhận đã thu đủ 70% tiền mặt" (UC.21) khi đơn ở COMPLETED + WAITING_RECONCILE -> cộng +(D - F) vào ví
// - Bấm "Hủy nhận dẫn khách" (UC.25, BR-06) -> hoàn 100% cọc cho khách và cộng +1 vào soLanViPham của HDV

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { EmptyState, Countdown } from '../../components/common/GuideCard';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  formatTimeRange,
  getSecondsUntil,
} from '../../utils/time';
import { formatMoney } from '../../utils/money';

export const MyBookingsAndShiftsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    bookings,
    currentUser,
    getUserById,
    getReviewByBookingId,
    requestCompletion,
    autoConfirmCompletionTimeout,
    confirmCashPayment,
    guideCancelBooking,
    submitDispute,
    replyToReview,
  } = useBookingContext();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(
    'Hướng dẫn viên gặp sự cố sức khỏe đột xuất không thể dẫn đoàn.'
  );

  // Modal khiếu nại / No-show từ phía HDV (UC.19)
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>(
    'Du khách tự ý hủy ngang giữa chừng và có hành vi không đúng mực trong chuyến đi.'
  );

  // Modal Đánh giá hai chiều từ HDV -> Du khách
  const [replyBookingId, setReplyBookingId] = useState<string | null>(null);
  const [touristStars, setTouristStars] = useState<number>(5);
  const [replyComment, setReplyComment] = useState<string>(
    'Cảm ơn bạn đã đồng hành tại Đà Nẵng! Du khách rất thân thiện, đúng giờ và tôn trọng văn hóa bản địa.'
  );

  const activeGuideId =
    currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';

  const guideBookings = bookings.filter((b) => b.guideId === activeGuideId);

  const tabs = [
    { id: 'all', label: 'Tất cả đơn & ca', badge: guideBookings.length },
    {
      id: 'CONFIRMED',
      label: 'Đã xác nhận / Đang đi',
      badge:
        guideBookings.filter((b) => b.bookingStatus === 'CONFIRMED').length ||
        undefined,
    },
    {
      id: 'WAITING_RECONCILE',
      label: 'Chờ xác nhận tiền mặt 70%',
      badge:
        guideBookings.filter((b) => b.paymentStatus === 'WAITING_RECONCILE')
          .length || undefined,
    },
    {
      id: 'COMPLETED',
      label: 'Đã hoàn thành',
      badge:
        guideBookings.filter((b) => b.bookingStatus === 'COMPLETED').length ||
        undefined,
    },
    {
      id: 'PENDING_WAITING',
      label: 'Chờ duyệt / Chờ cọc',
      badge:
        guideBookings.filter(
          (b) =>
            b.bookingStatus === 'PENDING' ||
            b.bookingStatus === 'WAITING_PAYMENT'
        ).length || undefined,
    },
    {
      id: 'CANCELLED_DISPUTED',
      label: 'Đã hủy / Tranh chấp',
      badge:
        guideBookings.filter(
          (b) =>
            b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'DISPUTED'
        ).length || undefined,
    },
  ];

  const filtered = useMemo(() => {
    if (activeTab === 'all') return guideBookings;
    if (activeTab === 'WAITING_RECONCILE') {
      return guideBookings.filter((b) => b.paymentStatus === 'WAITING_RECONCILE');
    }
    if (activeTab === 'PENDING_WAITING') {
      return guideBookings.filter(
        (b) =>
          b.bookingStatus === 'PENDING' || b.bookingStatus === 'WAITING_PAYMENT'
      );
    }
    if (activeTab === 'CANCELLED_DISPUTED') {
      return guideBookings.filter(
        (b) =>
          b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'DISPUTED'
      );
    }
    return guideBookings.filter((b) => b.bookingStatus === activeTab);
  }, [guideBookings, activeTab]);

  const handleRequestComplete = (bookingId: string) => {
    const res = requestCompletion(bookingId);
    showToast(res.message, 'success');
  };

  const handleConfirmCash = (bookingId: string) => {
    const res = confirmCashPayment(bookingId);
    showToast(res.message, 'success');
  };

  const handleConfirmGuideCancel = () => {
    if (!cancelBookingId) return;
    if (!cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn.', 'error');
      return;
    }
    const res = guideCancelBooking(cancelBookingId, cancelReason);
    showToast(res.message, 'error');
    setCancelBookingId(null);
  };

  const handleConfirmGuideDispute = () => {
    if (!disputeBookingId) return;
    const res = submitDispute(
      disputeBookingId,
      'Khiếu nại / No-show từ phía Hướng dẫn viên',
      disputeReason
    );
    showToast(res.message, 'warning');
    setDisputeBookingId(null);
  };

  const handleConfirmReplyReview = () => {
    if (!replyBookingId) return;
    const res = replyToReview(replyBookingId, touristStars, replyComment);
    if (res.ok) {
      showToast(res.message, 'success');
      setReplyBookingId(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            UC.17, UC.21, UC.25 • Quản lý ca dẫn khách & Đối soát
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1">
            Đơn & Ca dẫn khách của tôi
          </h1>
          <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
            Gửi yêu cầu xác nhận hoàn thành tour (UC.17), xác nhận thu 70% tiền mặt (UC.21) và đối soát doanh thu
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => navigate('/guide/vi')}>
          💰 Xem Ví & Lịch sử đối soát →
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState
          title="Chưa có đơn đặt lịch nào trong phân mục này"
          description="Bạn có thể chuyển sang tab khác hoặc kiểm tra mục Yêu cầu đặt lịch đến."
          actionText="Xem tất cả đơn của tôi"
          onAction={() => setActiveTab('all')}
        />
      ) : (
        <div className="space-y-6">
          {filtered.map((b) => {
            const tourist = getUserById(b.touristId);
            const platformFee = Math.round(b.totalAmount * b.feeRate);
            const guideReceives = b.totalAmount - platformFee;
            const cashReconcileDelta = b.depositAmount - platformFee;

            return (
              <div
                key={b.id}
                className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4C3CC] pb-4">
                  <div className="flex items-center gap-3.5">
                    {tourist?.avatarUrl && (
                      <img
                        src={tourist.avatarUrl}
                        alt={tourist.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#1EC1CB]"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded bg-[#1A0A0F] text-[#F6E6EA] text-[12px] font-black">
                          {b.id}
                        </span>
                        <StatusBadge status={b.bookingStatus} />
                        <PaymentBadge status={b.paymentStatus} />
                      </div>
                      <h3 className="text-[18px] font-extrabold text-[#1A0A0F] mt-1">
                        Du khách: {tourist?.fullName || 'Dương Đăng Huân'} ({tourist?.phone || '0905123456'})
                      </h3>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[12px] text-[#52526B] block">
                      Thu nhập thực nhận của bạn (G − F):
                    </span>
                    <span className="text-[22px] font-black text-[#0F6E4B] tabular-nums">
                      {formatMoney(guideReceives)}
                    </span>
                  </div>
                </div>

                {/* Banner trạng thái cửa sổ 24h chờ khách xác nhận hoàn thành (UC.17 → UC.18) */}
                {b.bookingStatus === 'CONFIRMED' && b.guideRequestedCompletion && (
                  <div className="p-4 rounded-[12px] bg-[#E5F8F9] border border-[#1EC1CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[13px] text-[#1C1C28]">
                      <strong className="block text-[14px] text-[#1A0A0F]">
                        ⏳ Đã gửi yêu cầu xác nhận hoàn thành (UC.17) — Đang chờ khách xác nhận trong 24 giờ
                      </strong>
                      <span>
                        Nếu sau 24 giờ khách không phản hồi và không có khiếu nại, hệ thống sẽ tự động chuyển đơn sang Đã hoàn thành (COMPLETED).
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Countdown
                        seconds={getSecondsUntil(b.completionAutoConfirmAt, 79200)}
                        onExpire={() => autoConfirmCompletionTimeout(b.id)}
                        label="Cửa sổ 24h"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          autoConfirmCompletionTimeout(b.id);
                          showToast(
                            `Đã giả lập hết 24h -> Đơn ${b.id} tự động chuyển sang COMPLETED + WAITING_FINAL!`,
                            'success'
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-[8px] bg-[#1C1C28] text-[#1EC1CB] text-[11px] font-bold cursor-pointer"
                      >
                        ⚡ Tua hết 24h
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner đối soát tiền mặt 70% (UC.21, BR-13) */}
                {b.bookingStatus === 'COMPLETED' &&
                  b.paymentStatus === 'WAITING_RECONCILE' && (
                    <div className="p-4 rounded-[12px] bg-[#FEF1DC] border-2 border-[#F8CA84] space-y-2 text-[13px] text-[#8C4A08]">
                      <strong className="text-[14px] block">
                        💵 Khách đã chọn trả Tiền mặt 70% ({formatMoney(b.remainingAmount)}) trực tiếp cho bạn (UC.21)
                      </strong>
                      <p className="text-[#1C1C28]">
                        Sau khi nhận đủ <strong>{formatMoney(b.remainingAmount)}</strong> tiền mặt từ khách, hãy bấm nút <strong>“Xác nhận đã thu đủ 70% tiền mặt”</strong> bên dưới. Hệ thống sẽ khấu trừ phí sàn ({formatMoney(platformFee)}) vào khoản cọc 30% ({formatMoney(b.depositAmount)}) đang giữ và cộng thêm phần dư <strong>+{formatMoney(cashReconcileDelta)}</strong> vào ví khả dụng của bạn (BR-13).
                      </p>
                    </div>
                  )}

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
                      <strong className="text-[#1A0A0F]">{b.guestCount} khách</strong>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[#52526B]">📍 Điểm đón tại Đà Nẵng: </span>
                      <strong className="text-[#1A0A0F]">{b.meetingLocation}</strong>
                    </div>
                    <div>
                      <span className="text-[#52526B]">📝 Ghi chú lịch trình: </span>
                      <p className="text-[#1C1C28] italic mt-0.5">“{b.specialRequests}”</p>
                    </div>
                  </div>
                </div>

                <PaymentSummary
                  hourlyRate={b.hourlyRateSnapshot}
                  hours={b.hours}
                  total={b.totalAmount}
                  deposit={b.depositAmount}
                  remaining={b.remainingAmount}
                  feeRate={b.feeRate}
                  platformFee={platformFee}
                  guideReceives={guideReceives}
                  paymentMethod={b.paymentMethod}
                  mode="guide"
                />

                {/* Thanh hành động của HDV */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4C3CC]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/guide/tin-nhan?partner=${b.touristId}&bookingId=${b.id}`)
                    }
                  >
                    💬 Nhắn tin với khách
                  </Button>

                  <div className="flex flex-wrap items-center gap-3">
                    {b.bookingStatus === 'PENDING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/guide/don-den')}
                      >
                        Đi tới duyệt yêu cầu (UC.13) →
                      </Button>
                    )}

                    {b.bookingStatus === 'CONFIRMED' && !b.guideRequestedCompletion && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setDisputeReason(
                              'Du khách vắng mặt tại điểm hẹn quá 30 phút không liên lạc được (No-show).'
                            );
                            setDisputeBookingId(b.id);
                          }}
                        >
                          ⚠️ Báo khách vắng mặt (No-show)
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setCancelBookingId(b.id)}
                        >
                          ✕ Hủy nhận dẫn khách (UC.25)
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleRequestComplete(b.id)}
                        >
                          ✓ Yêu cầu xác nhận hoàn thành tour (UC.17)
                        </Button>
                      </>
                    )}

                    {b.bookingStatus === 'CONFIRMED' && b.guideRequestedCompletion && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDisputeBookingId(b.id)}
                      >
                        ⚠️ Gửi khiếu nại sự cố (UC.19)
                      </Button>
                    )}

                    {b.bookingStatus === 'COMPLETED' &&
                      b.paymentStatus === 'WAITING_RECONCILE' && (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => handleConfirmCash(b.id)}
                        >
                          💵 Xác nhận đã thu đủ {formatMoney(b.remainingAmount)} tiền mặt (UC.21)
                        </Button>
                      )}

                    {b.bookingStatus === 'COMPLETED' && b.paymentStatus === 'PAID' && (
                      <>
                        {(() => {
                          const rev = getReviewByBookingId(b.id);
                          if (rev && !rev.guideReply) {
                            return (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setReplyBookingId(b.id)}
                              >
                                ★ Đánh giá hai chiều & Phản hồi khách
                              </Button>
                            );
                          }
                          if (rev?.guideReply) {
                            return (
                              <span className="px-3 py-1 rounded-full bg-[#E5F8F9] text-[#1C1C28] border border-[#1EC1CB] text-[12px] font-bold">
                                ★ Đã đánh giá hai chiều ({rev.touristRating}★)
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <span className="px-3.5 py-1.5 rounded-full bg-[#E3F7EF] text-[#0F6E4B] border border-[#99E2C4] text-[13px] font-extrabold">
                          ✓✓ Đã hoàn thành & Quyết toán vào Ví
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal HDV hủy đơn đã CONFIRMED (UC.25, BR-06) */}
      <Modal
        isOpen={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        title={`Cảnh báo Hủy đơn đã xác nhận ${cancelBookingId} (UC.25, BR-06)`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelBookingId(null)}>
              Giữ lại lịch dẫn khách
            </Button>
            <Button variant="danger" onClick={handleConfirmGuideCancel}>
              Xác nhận hủy & Chấp nhận +1 vi phạm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#FCE8EB] border border-[#F5B2BA] rounded-[12px] text-[13px] text-[#A61B2B] space-y-1.5">
            <strong className="block text-[14px]">
              ⚠️ Quy tắc chế tài khi HDV hủy đơn đã xác nhận (BR-06):
            </strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Du khách được <strong>hoàn trả 100% tiền đặt cọc (30%)</strong> ngay lập tức.
              </li>
              <li>
                Hướng dẫn viên nhận <strong>0 ₫</strong> và bị hệ thống tự động cộng <strong>+1 lần vi phạm (soLanViPham)</strong>.
              </li>
              <li>
                Lịch sử vi phạm sẽ hiển thị cảnh báo đỏ trên trang Quản lý người dùng của Admin (UC.06).
              </li>
            </ul>
          </div>

          <Textarea
            label="Lý do hủy đơn bắt buộc (CANCELLATION_RECORD.lyDo NOT NULL) *"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* Modal HDV gửi khiếu nại trong cửa sổ 24h (UC.19) */}
      <Modal
        isOpen={Boolean(disputeBookingId)}
        onClose={() => setDisputeBookingId(null)}
        title={`Gửi khiếu nại từ phía HDV cho đơn ${disputeBookingId} (UC.19)`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisputeBookingId(null)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleConfirmGuideDispute}>
              Gửi khiếu nại tới Admin
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#52526B]">
            Trong cửa sổ 24 giờ sau khi yêu cầu hoàn thành, nếu Du khách vi phạm thỏa thuận, bạn có thể gửi khiếu nại để Admin thẩm định và bảo vệ quyền lợi cho bạn (UC.19, UC.27).
          </p>
          <Textarea
            label="Nội dung sự cố / khiếu nại *"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>

      {/* Modal Đánh giá hai chiều từ HDV -> Du khách */}
      <Modal
        isOpen={Boolean(replyBookingId)}
        onClose={() => setReplyBookingId(null)}
        title={`Đánh giá hai chiều & Phản hồi đơn ${replyBookingId}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReplyBookingId(null)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleConfirmReplyReview}>
              Gửi đánh giá & Phản hồi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-bold text-[#1A0A0F] block mb-2">
              Chấm điểm hợp tác của Du khách (1 – 5 sao):
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTouristStars(s)}
                  className={`w-10 h-10 rounded-[10px] text-lg font-bold border cursor-pointer ${
                    s <= touristStars
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-gray-400 border-[#E4C3CC]'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-[13px] font-bold text-[#1A0A0F] ml-1">
                {touristStars} / 5 sao
              </span>
            </div>
          </div>

          <Textarea
            label="Lời cảm ơn & Phản hồi công khai trên hồ sơ của bạn *"
            value={replyComment}
            onChange={(e) => setReplyComment(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};
