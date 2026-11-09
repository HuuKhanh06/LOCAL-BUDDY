// pages/tourist/GuideProfilePage.tsx
// Hồ sơ Hướng dẫn viên tối giản: 1 tông nền sáng (#FAF9F6 / #FFFFFF), rất ít chữ,
// tích hợp Hình ảnh + Video thực tế Đà Nẵng cùng chủ đề và khung chọn lịch theo giờ.

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

const GUIDE_ROUTE_VIDEOS: Record<string, string> = {
  'u-guide-1': 'https://assets.mixkit.co/videos/5371/5371-720.mp4',
  'u-guide-2': 'https://assets.mixkit.co/videos/41576/41576-720.mp4',
  'u-guide-3': 'https://assets.mixkit.co/videos/51500/51500-720.mp4',
  'u-guide-4': 'https://assets.mixkit.co/videos/5369/5369-720.mp4',
  'u-guide-5': 'https://assets.mixkit.co/videos/5363/5363-720.mp4',
};

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
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');

  if (!guideItem) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Không tìm thấy hồ sơ Hướng dẫn viên."
          onRetry={() => navigate('/guides')}
        />
      </div>
    );
  }

  const { user, profile } = guideItem;
  const routeVideo =
    GUIDE_ROUTE_VIDEOS[user.id] || 'https://assets.mixkit.co/videos/5371/5371-720.mp4';

  const daySlots = slots.filter(
    (s) => s.guideId === user.id && s.date === selectedDate
  );

  const guideReviews = reviews.filter((r) => r.guideId === user.id);

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
      showToast('Vui lòng chọn 1 khung giờ trống!', 'warning');
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
    showToast(`Đã gửi tin nhắn cho ${user.fullName}!`, 'success');
    setQuickMessage('');
    setChatModalOpen(false);
    navigate(`/tin-nhan?partner=${user.id}`);
  };

  return (
    <div className="space-y-6 py-2">
      {/* 1. BỘ SƯU TẬP VIDEO & ẢNH THỰC TẾ ĐẦU TRANG (Bento Media Header) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[300px] sm:h-[360px]">
        <div className="md:col-span-7 relative rounded-[24px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4]">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={profile.coverUrl}
            className="w-full h-full object-cover"
          >
            <source src={routeVideo} type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={() => navigate('/guides')}
            className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-white/90 text-[#1C1917] text-[12px] font-bold backdrop-blur-xs cursor-pointer"
          >
            ← Quay lại
          </button>
          <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-white/90 text-[#1C1917] text-[11px] font-bold backdrop-blur-xs">
            ▶ Thước phim thực tế Đà Nẵng
          </span>
        </div>

        <div className="hidden md:grid md:col-span-5 grid-rows-2 gap-3 h-full">
          <div className="relative rounded-[20px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4]">
            <img
              src={profile.coverUrl}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4]">
              <img
                src="https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg"
                alt="Cầu Vàng Đà Nẵng"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-[20px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4]">
              <img
                src="https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg"
                alt="Biển Đà Nẵng"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT TRÊN NỀN SÁNG ĐỒNG NHẤT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Nhận diện + KYC + Đánh giá ngắn gọn */}
        <div className="lg:col-span-7 space-y-5">
          {/* Thẻ nhận diện HDV tối giản */}
          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#E7E5E4]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F1EC] text-[#1C1917]">
                      ✓ Đã xác thực KYC
                    </span>
                    <span className="text-[12px] text-[#78716C]">📍 Đà Nẵng</span>
                  </div>
                  <h1 className="text-[24px] font-black text-[#1C1917] mt-1">
                    {user.fullName}
                  </h1>
                  <p className="text-[13px] text-[#57534E]">
                    🗣 {profile.languages.join(' • ')}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setChatModalOpen(true)}
              >
                💬 Nhắn tin
              </Button>
            </div>

            {/* 4 chỉ số uy tín ngắn gọn */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#E7E5E4] text-center">
              <div>
                <strong className="block text-[16px] font-black text-[#1C1917]">
                  ★ {profile.avgRating.toFixed(1)}
                </strong>
                <span className="text-[11px] text-[#78716C]">{profile.totalReviews} đánh giá</span>
              </div>
              <div>
                <strong className="block text-[16px] font-black text-[#1C1917]">
                  {profile.completedTours}+
                </strong>
                <span className="text-[11px] text-[#78716C]">Chuyến đi</span>
              </div>
              <div>
                <strong className="block text-[16px] font-black text-[#1C1917]">
                  {profile.yearsExperience} năm
                </strong>
                <span className="text-[11px] text-[#78716C]">Kinh nghiệm</span>
              </div>
              <div>
                <strong className="block text-[16px] font-black text-[#1C1917]">
                  {profile.responseRate}%
                </strong>
                <span className="text-[11px] text-[#78716C]">Phản hồi</span>
              </div>
            </div>

            {/* Điểm đến & Kỹ năng dạng chip ngắn */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.areas.map((a) => (
                <span
                  key={a}
                  className="text-[12px] font-medium bg-[#FAF9F6] border border-[#E7E5E4] text-[#1C1917] px-3 py-1 rounded-full"
                >
                  📍 {a}
                </span>
              ))}
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="text-[12px] font-medium bg-[#F3F1EC] text-[#57534E] px-3 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Chính sách hoàn cọc & Độ tin cậy KYC cực gọn */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#E7E5E4] rounded-[18px] p-4">
              <strong className="text-[13px] font-bold text-[#1C1917] block">
                ✓ Hoàn 100% cọc
              </strong>
              <span className="text-[12px] text-[#78716C]">Hủy trước 48 giờ</span>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-[18px] p-4">
              <strong className="text-[13px] font-bold text-[#1C1917] block">
                ✓ Hoàn 50% cọc
              </strong>
              <span className="text-[12px] text-[#78716C]">Hủy từ 24 – 48 giờ</span>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-[18px] p-4">
              <strong className="text-[13px] font-bold text-[#1C1917] block">
                ✓ Đã duyệt CCCD
              </strong>
              <span className="text-[12px] text-[#78716C]">Sở Du lịch Đà Nẵng</span>
            </div>
          </div>

          {/* Đánh giá thực tế gọn */}
          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-4">
            <h2 className="text-[17px] font-bold text-[#1C1917]">
              Đánh giá ({guideReviews.length})
            </h2>

            {guideReviews.length === 0 ? (
              <p className="text-[13px] text-[#78716C]">Chưa có đánh giá.</p>
            ) : (
              <div className="divide-y divide-[#E7E5E4]">
                {guideReviews.map((rev) => {
                  const reviewer = getUserById(rev.touristId);
                  return (
                    <div key={rev.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <strong className="text-[#1C1917]">
                          {reviewer?.fullName || 'Du khách'}
                        </strong>
                        <span className="font-bold text-[#1C1917]">
                          {'★'.repeat(rev.stars)}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#57534E]">{rev.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Khung chọn lịch rảnh theo giờ tối giản */}
        <div id="booking-widget" className="lg:col-span-5 lg:sticky lg:top-22 scroll-mt-22">
          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 shadow-xs space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#E7E5E4] pb-3.5">
              <span className="text-[14px] font-bold text-[#1C1917]">Chọn khung giờ</span>
              <span className="text-[20px] font-black text-[#1C1917] tabular-nums">
                {formatHourlyRate(profile.hourlyRate)}
              </span>
            </div>

            {/* Chọn ngày */}
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
                    className={`py-2 px-2 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-[#FAF9F6] text-[#1C1917] border-[#E7E5E4] hover:border-[#1C1917]'
                    }`}
                  >
                    {formatDate(d)}
                  </button>
                );
              })}
            </div>

            {/* Khung giờ */}
            {daySlots.length === 0 ? (
              <div className="p-4 bg-[#FAF9F6] rounded-[14px] text-center text-[13px] text-[#78716C]">
                Chưa có ca trống ngày này.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
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

            {selectedSlot && (
              <div className="bg-[#FAF9F6] border border-[#E7E5E4] rounded-[14px] p-3.5 space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Tổng ({selectedHours} giờ)</span>
                  <strong className="text-[#1C1917] tabular-nums">
                    {formatMoney(estimatedTotal)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Đặt cọc 30%</span>
                  <strong className="text-[#1C1917] tabular-nums">
                    {formatMoney(estimatedDeposit)}
                  </strong>
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
                ? `Đặt khung ${selectedSlot.startTime} – ${selectedSlot.endTime} →`
                : 'Chọn khung giờ trống'}
            </Button>

            <p className="text-[11px] text-center text-[#78716C]">
              HDV xác nhận mới thu cọc 30% • Giữ lịch 15 phút
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="lg:hidden fixed bottom-15 left-0 right-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E7E5E4] px-4 py-3 flex items-center justify-between gap-3">
        <strong className="text-[16px] font-black text-[#1C1917] tabular-nums">
          {selectedSlot
            ? formatMoney(estimatedTotal)
            : formatHourlyRate(profile.hourlyRate)}
        </strong>
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
            }
          }}
        >
          {selectedSlot ? 'Đặt ngay →' : 'Chọn giờ'}
        </Button>
      </div>

      <Modal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        title={`Nhắn tin ${user.fullName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setChatModalOpen(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleSendQuickMessage}>
              Gửi →
            </Button>
          </>
        }
      >
        <Textarea
          label="Tin nhắn"
          placeholder={`Chào ${user.fullName}...`}
          value={quickMessage}
          onChange={(e) => setQuickMessage(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
};
