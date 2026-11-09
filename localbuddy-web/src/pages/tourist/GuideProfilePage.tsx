// pages/tourist/GuideProfilePage.tsx (UC.08: Xem chi tiết Hồ sơ Hướng dẫn viên & Lịch rảnh theo giờ)
// Tham chiếu bố cục: ToursByLocals (số liệu uy tín, lời chứng thực, FAQ) + Withlocals (hàng trấn an hủy/hoàn) + ShowAround (đặt theo giờ)

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { TimeSlot, ErrorState } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { formatMoney, formatHourlyRate } from '../../utils/money';
import { formatDate } from '../../utils/time';
import { TimeSlotData } from '../../types';

export const GuideProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const {
    getGuideById,
    slots,
    reviews,
    getUserById,
    sendMessage,
  } = useBookingContext();

  const guideItem = getGuideById(id || '');

  // Tìm các ngày có trong lịch của HDV
  const availableDates = useMemo(() => {
    const guideSlots = slots.filter((s) => s.guideId === id);
    const uniqueDates = Array.from(new Set(guideSlots.map((s) => s.date))).sort();
    return uniqueDates.length > 0
      ? uniqueDates
      : ['2026-11-12', '2026-11-13', '2026-11-14'];
  }, [slots, id]);

  const requestedDate = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    requestedDate && availableDates.includes(requestedDate)
      ? requestedDate
      : availableDates[0] || '2026-11-12'
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);

  // Modal nhắn tin nhanh với HDV (UC.15)
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');

  if (!guideItem) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Không tìm thấy hồ sơ Hướng dẫn viên này trên hệ thống Đà Nẵng."
          onRetry={() => navigate('/guides')}
        />
      </div>
    );
  }

  const { user, profile } = guideItem;

  const daySlots = slots.filter(
    (s) => s.guideId === user.id && s.date === selectedDate
  );

  const guideReviews = reviews.filter((r) => r.guideId === user.id);

  // Tính số giờ của slot đang chọn
  const calcSlotHours = (slot: TimeSlotData | null): number => {
    if (!slot) return 3;
    const startH = parseInt(slot.startTime.split(':')[0], 10);
    const endH = parseInt(slot.endTime.split(':')[0], 10);
    return Math.max(1, endH - startH);
  };

  const selectedHours = calcSlotHours(selectedSlot);
  const estimatedTotal = profile.hourlyRate * selectedHours;
  const estimatedDeposit = Math.round(estimatedTotal * 0.3);

  const handleProceedBooking = () => {
    if (!selectedSlot) {
      showToast('Vui lòng chọn một khung giờ Đang trống (AVAILABLE) để đặt lịch!', 'warning');
      return;
    }
    navigate(
      `/dat-lich/${user.id}?date=${selectedSlot.date}&start=${selectedSlot.startTime}&end=${selectedSlot.endTime}&slotId=${selectedSlot.id}`
    );
  };

  const handleSendQuickMessage = () => {
    const res = sendMessage(user.id, quickMessage);
    if (!res.ok) {
      showToast(res.message, 'error');
      return;
    }
    showToast(`Đã gửi tin nhắn cho HDV ${user.fullName}!`, 'success');
    setQuickMessage('');
    setChatModalOpen(false);
    navigate(`/tin-nhan?partner=${user.id}`);
  };

  return (
    <div className="space-y-8 py-2">
      {/* 1. HERO HỒ SƠ HDV (Phong cách Withlocals + ToursByLocals) */}
      <div className="bg-white border border-[#E4C3CC] rounded-[20px] overflow-hidden shadow-md">
        <div className="relative h-56 sm:h-72 bg-[#1C1C28]">
          <img
            src={profile.coverUrl}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0F] via-[#1A0A0F]/40 to-transparent" />
          <button
            type="button"
            onClick={() => navigate('/guides')}
            className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-[#1C1C28]/85 text-white text-[13px] font-bold hover:bg-[#1C1C28] backdrop-blur-xs cursor-pointer"
          >
            ← Quay lại danh sách HDV
          </button>
        </div>

        <div className="p-6 sm:p-8 -mt-16 relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <img
              src={profile.avatarUrl}
              alt={user.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#1EC1CB] bg-white shadow-xl"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#1EC1CB] text-[#1C1C28]">
                  ✓ Đã xác minh KYC Sở Du lịch Đà Nẵng
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F6E6EA] text-[#1A0A0F]">
                  ⏱ {profile.responseTimeText}
                </span>
              </div>
              <h1 className="text-[28px] sm:text-[32px] font-black text-[#1A0A0F]">
                {user.fullName}
              </h1>
              <p className="text-[15px] font-semibold text-[#1C1C28]">
                {profile.tagline}
              </p>
            </div>
          </div>

          {/* Đơn giá nổi bật "250.000 ₫ / giờ" + Nút Nhắn tin */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 bg-[#FBF4F6] p-4 rounded-[14px] border border-[#E4C3CC]">
            <div className="lg:text-right">
              <span className="text-[12px] text-[#52526B] font-semibold block">
                Đơn giá thuê riêng theo giờ
              </span>
              <span className="text-[24px] font-black text-[#1A0A0F] tabular-nums">
                {formatHourlyRate(profile.hourlyRate)}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setChatModalOpen(true)}
            >
              💬 Nhắn tin trao đổi với {user.fullName.split(' ').pop()}
            </Button>
          </div>
        </div>

        {/* Hàng số liệu uy tín (ToursByLocals Credentials Bar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#E4C3CC] bg-[#F6E6EA]/50 divide-y sm:divide-y-0 sm:divide-x divide-[#E4C3CC]">
          <div className="p-4 text-center">
            <span className="block text-[20px] font-black text-[#1A0A0F]">
              ★ {profile.avgRating.toFixed(1)} / 5.0
            </span>
            <span className="text-[12px] text-[#52526B] font-medium">
              {profile.totalReviews} đánh giá xác thực
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="block text-[20px] font-black text-[#1A0A0F]">
              {profile.completedTours}+ chuyến
            </span>
            <span className="text-[12px] text-[#52526B] font-medium">
              Đã hoàn thành tại Đà Nẵng
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="block text-[20px] font-black text-[#1A0A0F]">
              {profile.yearsExperience} năm
            </span>
            <span className="text-[12px] text-[#52526B] font-medium">
              Kinh nghiệm dẫn khách bản địa
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="block text-[20px] font-black text-[#1A0A0F]">
              {profile.responseRate}%
            </span>
            <span className="text-[12px] text-[#52526B] font-medium">
              Tỷ lệ phản hồi đúng hạn
            </span>
          </div>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT: CHI TIẾT CHUYÊN MÔN (TRÁI) & KHUNG ĐẶT LỊCH THEO GIỜ (PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Giới thiệu, Điểm nổi bật, Khu vực, Kỹ năng, Đánh giá, FAQ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-4">
            <h2 className="text-[20px] font-extrabold text-[#1A0A0F]">
              Giới thiệu về {user.fullName}
            </h2>
            <p className="text-[15px] text-[#1C1C28] leading-relaxed">
              {profile.bio}
            </p>

            {profile.highlights.length > 0 && (
              <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-4 space-y-2">
                <h3 className="text-[14px] font-extrabold text-[#1A0A0F]">
                  ✨ Điểm đặc biệt khi đồng hành cùng {user.fullName}:
                </h3>
                <ul className="space-y-1.5 text-[14px] text-[#1C1C28]">
                  {profile.highlights.map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#0F6E4B] font-bold">✓</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#52526B] mb-2">
                  📍 Khu vực hoạt động
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.areas.map((a) => (
                    <span
                      key={a}
                      className="text-[12px] font-semibold bg-[#F6E6EA] text-[#1A0A0F] px-2.5 py-1 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#52526B] mb-2">
                  🗣 Ngôn ngữ
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((l) => (
                    <span
                      key={l}
                      className="text-[12px] font-semibold bg-[#E5F8F9] text-[#1C1C28] border border-[#1EC1CB]/50 px-2.5 py-1 rounded-full"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#52526B] mb-2">
                  🎯 Kỹ năng chuyên môn
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="text-[12px] font-semibold bg-[#FBF4F6] text-[#1C1C28] border border-[#E4C3CC] px-2.5 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chính sách hủy & hoàn cọc hiển thị rõ (BR-06, Withlocals Reassurance) */}
          <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-[20px] font-extrabold text-[#1A0A0F]">
                Chính sách hủy & hoàn tiền đặt cọc 30%
              </h2>
              <span className="text-[11px] font-bold bg-[#E3F7EF] text-[#0F6E4B] px-2.5 py-1 rounded-full">
                Bảo vệ bởi LocalBuddy (BR-06)
              </span>
            </div>
            <p className="text-[13px] text-[#52526B] leading-relaxed">
              Mức hoàn cọc được hệ thống tự động tính theo khoảng thời gian <strong>ΔT</strong> từ thời điểm hủy đến giờ hẹn bắt đầu chuyến đi tại Đà Nẵng:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-3.5 rounded-[12px] bg-[#E3F7EF]/60 border border-[#9FE0C6]">
                <strong className="text-[#0F6E4B] block">✓ Hủy trước &gt; 48 giờ (ΔT &gt; 48h)</strong>
                <span className="text-[#1C1C28]">Hoàn lại <strong>100%</strong> tiền đặt cọc 30% (Phạt 0%).</span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#FEF1DC]/70 border border-[#F8CA84]">
                <strong className="text-[#8C4A08] block">⚠ Hủy từ 24 – 48 giờ (24h ≤ ΔT ≤ 48h)</strong>
                <span className="text-[#1C1C28]">Hoàn lại <strong>50%</strong> tiền đặt cọc (Phạt 50% cọc).</span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#FCE8EB]/60 border border-[#F5B2BA]">
                <strong className="text-[#A61B2B] block">✕ Hủy sát giờ &lt; 24 giờ (ΔT &lt; 24h)</strong>
                <span className="text-[#1C1C28]">Không hoàn cọc (Phạt <strong>100%</strong> cọc để bồi thường lịch HDV).</span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#E5F8F9]/70 border border-[#1EC1CB]">
                <strong className="text-[#1C1C28] block">🛡 Nếu HDV hủy hoặc quá hạn xác nhận</strong>
                <span className="text-[#1C1C28]">Du khách luôn được hoàn <strong>100%</strong> tiền cọc.</span>
              </div>
            </div>
          </div>

          {/* Câu hỏi thường gặp (FAQ kiểu ToursByLocals) */}
          {profile.faqs.length > 0 && (
            <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-4">
              <h2 className="text-[20px] font-extrabold text-[#1A0A0F]">
                Câu hỏi thường gặp khi đặt lịch
              </h2>
              <div className="space-y-3">
                {profile.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[12px] bg-[#FBF4F6] border border-[#E4C3CC] space-y-1.5"
                  >
                    <h4 className="text-[14px] font-bold text-[#1A0A0F]">
                      ❓ {faq.question}
                    </h4>
                    <p className="text-[13px] text-[#52526B] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách đánh giá thực tế từ Du khách (UC.26) */}
          <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-extrabold text-[#1A0A0F]">
                Đánh giá từ Du khách ({guideReviews.length})
              </h2>
              <span className="text-[14px] font-bold text-[#1A0A0F] bg-[#F6E6EA] px-3 py-1 rounded-full">
                ★ Trung bình {profile.avgRating.toFixed(1)} / 5.0
              </span>
            </div>

            {guideReviews.length === 0 ? (
              <p className="text-[14px] text-[#52526B]">
                Chưa có đánh giá nào cho Hướng dẫn viên này.
              </p>
            ) : (
              <div className="divide-y divide-[#E4C3CC]">
                {guideReviews.map((rev) => {
                  const reviewer = getUserById(rev.touristId);
                  return (
                    <div key={rev.id} className="py-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-[#1A0A0F]">
                            {reviewer?.fullName || 'Du khách Đà Nẵng'}
                          </span>
                          <span className="text-[11px] bg-[#E3F7EF] text-[#0F6E4B] px-2 py-0.5 rounded font-semibold">
                            ✓ Đã hoàn thành đơn {rev.bookingId}
                          </span>
                        </div>
                        <span className="text-amber-500 font-bold text-sm">
                          {'★'.repeat(rev.stars)}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#1C1C28] leading-relaxed">
                        {rev.comment}
                      </p>
                      <span className="text-[11px] text-[#52526B] block">
                        Ngày đánh giá: {formatDate(rev.createdAt.split('T')[0])}
                      </span>
                      {rev.guideReply && (
                        <div className="mt-2 ml-3 pl-3.5 py-2.5 pr-3 rounded-[10px] bg-[#FBF4F6] border-l-3 border-[#1EC1CB] space-y-1">
                          <div className="flex items-center justify-between text-[12px]">
                            <strong className="text-[#1A0A0F]">
                              ↳ Phản hồi từ HDV {user.fullName}
                            </strong>
                            {rev.touristRating && (
                              <span className="text-[11px] font-bold text-[#0F6E4B]">
                                Đánh giá khách: {'★'.repeat(rev.touristRating)}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#1C1C28]">{rev.guideReply}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Widget Chọn Lịch Rảnh Theo Giờ & Tính Tiền Tạm Tính (Sticky) */}
        <div id="booking-widget" className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 scroll-mt-24">
          <div className="bg-white border-2 border-[#1EC1CB] rounded-[16px] p-6 shadow-lg space-y-5">
            <div className="border-b border-[#E4C3CC] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A0A0F] bg-[#F6E6EA] px-2.5 py-0.5 rounded">
                  Đặt lịch theo giờ (UC.12)
                </span>
                <h3 className="text-[19px] font-extrabold text-[#1A0A0F] mt-1">
                  Chọn ngày & Khung giờ trống
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[18px] font-black text-[#1A0A0F] tabular-nums">
                  {formatHourlyRate(profile.hourlyRate)}
                </span>
              </div>
            </div>

            {/* Chọn ngày */}
            <div>
              <label className="text-[13px] font-bold text-[#1A0A0F] block mb-2">
                1. Chọn ngày khởi hành tại Đà Nẵng:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableDates.map((d) => {
                  const isActive = selectedDate === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                      }}
                      className={`py-2.5 px-2 rounded-[10px] text-[13px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28] shadow-xs'
                          : 'bg-[#FBF4F6] text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                      }`}
                    >
                      📅 {formatDate(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lưới khung giờ */}
            <div>
              <label className="text-[13px] font-bold text-[#1A0A0F] block mb-2">
                2. Chọn khung giờ của ngày {formatDate(selectedDate)}:
              </label>

              {daySlots.length === 0 ? (
                <div className="p-4 bg-[#FBF4F6] rounded-[12px] border border-[#E4C3CC] text-center text-[13px] text-[#52526B]">
                  Chưa có ca mở sẵn trong ngày này. Hãy chọn ngày khác hoặc nhắn tin trực tiếp cho HDV!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {daySlots.map((slot) => (
                    <TimeSlot
                      key={slot.id}
                      startTime={slot.startTime}
                      endTime={slot.endTime}
                      status={slot.status}
                      isSelected={selectedSlot?.id === slot.id}
                      onClick={() => setSelectedSlot(slot)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Chú thích 3 trạng thái lịch chuẩn BR-04 */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-[#52526B] bg-[#FBF4F6] p-2.5 rounded-[10px] border border-[#E4C3CC]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E4B]" /> Đang trống
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C4A08]" /> Giữ 15p (HOLD)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#52526B]" /> Đã kín (BUSY)
              </span>
            </div>

            {/* Tóm tắt chi phí tạm tính khi đã chọn khung giờ */}
            {selectedSlot && (
              <div className="bg-[#F6E6EA]/70 border border-[#E4C3CC] rounded-[12px] p-4 space-y-2 text-[13px]">
                <div className="flex justify-between font-bold text-[#1A0A0F]">
                  <span>
                    Khung giờ đã chọn ({selectedHours} giờ):
                  </span>
                  <span>
                    {selectedSlot.startTime} – {selectedSlot.endTime}
                  </span>
                </div>
                <div className="flex justify-between text-[#1C1C28]">
                  <span>Tổng tiền tạm tính (G):</span>
                  <strong className="tabular-nums">{formatMoney(estimatedTotal)}</strong>
                </div>
                <div className="flex justify-between text-[#0F6E4B] font-semibold">
                  <span>Đặt cọc 30% (sau khi HDV duyệt):</span>
                  <span className="tabular-nums">{formatMoney(estimatedDeposit)}</span>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!selectedSlot}
              onClick={handleProceedBooking}
              className="w-full"
            >
              {selectedSlot
                ? `Tiếp tục đặt khung ${selectedSlot.startTime} – ${selectedSlot.endTime} →`
                : 'Chọn 1 khung giờ Đang trống ở trên'}
            </Button>

            {/* Hàng trấn an Withlocals */}
            <div className="text-[12px] text-[#52526B] space-y-1 pt-2 border-t border-[#E4C3CC]">
              <p>🛡 <strong>Chưa thu tiền ngay:</strong> Chỉ khi {user.fullName} chấp nhận lịch, hệ thống mới giữ chỗ 15 phút để bạn đặt cọc 30%.</p>
              <p>🔄 <strong>Hoàn cọc minh bạch:</strong> Hủy trước 48 giờ hoàn 100% cọc; từ 24–48 giờ hoàn 50% cọc (BR-06).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh nút "Đặt lịch" cố định (Sticky Mobile CTA) trên thiết bị di động */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E4C3CC] px-4 py-3 shadow-[0_-6px_20px_rgba(26,10,15,0.1)] flex items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] text-[#52526B] font-semibold">
            {selectedSlot
              ? `Đã chọn ${selectedSlot.startTime} – ${selectedSlot.endTime}`
              : 'Đơn giá theo giờ'}
          </span>
          <strong className="text-[17px] font-black text-[#1A0A0F] tabular-nums">
            {selectedSlot
              ? formatMoney(estimatedTotal)
              : formatHourlyRate(profile.hourlyRate)}
          </strong>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            if (selectedSlot) {
              handleProceedBooking();
            } else {
              document
                .getElementById('booking-widget')
                ?.scrollIntoView({ behavior: 'smooth' });
              showToast('Hãy chọn ngày và khung giờ trống bên dưới để đặt lịch!', 'info');
            }
          }}
        >
          {selectedSlot ? 'Đặt lịch ngay →' : 'Chọn giờ & Đặt lịch'}
        </Button>
      </div>

      {/* Modal Nhắn tin nhanh với HDV (UC.15) */}
      <Modal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        title={`Nhắn tin với HDV ${user.fullName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setChatModalOpen(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleSendQuickMessage}>
              Gửi tin nhắn →
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#52526B]">
            Bạn có thể hỏi trước {user.fullName} về lịch trình dự kiến tại Đà Nẵng, phương tiện di chuyển hoặc điểm đón trước khi đặt lịch.
          </p>
          <Textarea
            label="Nội dung tin nhắn *"
            placeholder={`Chào ${user.fullName}, nhóm mình muốn đi Sơn Trà và Chợ Cồn...`}
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};
