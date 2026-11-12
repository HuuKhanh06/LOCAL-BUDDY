// pages/tourist/GuideProfilePage.tsx
// Hồ sơ Hướng dẫn viên 2 cột theo Mục [9] THAM KHẢO UI:
// - Trái: gallery (video & ảnh thực tế Đà Nẵng), giới thiệu, ngôn ngữ, chuyên môn, lịch rảnh, đánh giá thật
// - Phải: panel đặt lịch dính (giá/giờ, tạm tính G, cọc D "chỉ thanh toán sau khi Guide chấp nhận", tóm tắt chính sách huỷ)
// - Mobile: thanh CTA dính đáy
// - Không chat/messaging nội bộ (liên hệ SĐT/Email sau khi cọc 30%)

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { TimeSlot, ErrorState } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';
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
    currentUser,
    getGuideById,
    slots,
    reviews,
    getUserById,
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
    if (!currentUser) {
      showToast('Vui lòng đăng ký hoặc đăng nhập tài khoản để đặt lịch!', 'info');
      navigate(
        `/dang-nhap?returnTo=${encodeURIComponent(`/dat-lich/${user.id}?date=${selectedSlot.date}&start=${selectedSlot.startTime}&end=${selectedSlot.endTime}&slotId=${selectedSlot.id}`)}`
      );
      return;
    }
    navigate(
      `/dat-lich/${user.id}?date=${selectedSlot.date}&start=${selectedSlot.startTime}&end=${selectedSlot.endTime}&slotId=${selectedSlot.id}`
    );
  };

  return (
    <div className="space-y-8 py-2">
      {/* 1. GALLERY: BENTO MEDIA THỰC TẾ ĐẦU TRANG */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[300px] sm:h-[380px]">
        <div className="md:col-span-7 relative rounded-[24px] overflow-hidden bg-[#FDF6ED] border border-[#F1DEC9]">
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
            className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-white/90 text-[#1C1917] text-[12px] font-bold backdrop-blur-xs cursor-pointer hover:bg-white shadow-sm"
          >
            ← Quay lại danh sách
          </button>
          <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-white/90 text-[#1C1917] text-[11px] font-bold backdrop-blur-xs">
            ▶ Thước phim thực tế Đà Nẵng
          </span>
        </div>

        <div className="hidden md:grid md:col-span-5 grid-rows-2 gap-3 h-full">
          <div className="relative rounded-[20px] overflow-hidden bg-[#FDF6ED] border border-[#F1DEC9]">
            <img
              src={profile.coverUrl}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] overflow-hidden bg-[#FDF6ED] border border-[#F1DEC9]">
              <img
                src="https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg"
                alt="Cầu Vàng Đà Nẵng"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-[20px] overflow-hidden bg-[#FDF6ED] border border-[#F1DEC9]">
              <img
                src="https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg"
                alt="Biển Đà Nẵng"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT THEO MỤC [9] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: Gallery, Giới thiệu, Ngôn ngữ, Chuyên môn, Lịch rảnh, Đánh giá */}
        <div className="lg:col-span-7 space-y-6">
          {/* Nhận diện Thổ địa */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#E7E5E4] shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Đã xác minh KYC
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

              {/* Thông báo liên hệ an toàn (thay thế chat) */}
              <div className="text-right">
                <span className="inline-block px-3 py-1.5 rounded-xl bg-[#F3F1EC] text-[#57534E] text-[11px] font-semibold border border-[#E7E5E4]">
                  📞 SĐT & Email hiện sau khi cọc 30%
                </span>
              </div>
            </div>

            {/* Chỉ số uy tín thực tế */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#E7E5E4] text-center">
              <div>
                <strong className="block text-[17px] font-black text-[#1C1917]">
                  ★ {profile.avgRating.toFixed(1)}
                </strong>
                <span className="text-[11px] text-[#78716C]">{profile.totalReviews} đánh giá</span>
              </div>
              <div>
                <strong className="block text-[17px] font-black text-[#1C1917]">
                  {profile.completedTours}+
                </strong>
                <span className="text-[11px] text-[#78716C]">Chuyến đi</span>
              </div>
              <div>
                <strong className="block text-[17px] font-black text-[#1C1917]">
                  {profile.yearsExperience} năm
                </strong>
                <span className="text-[11px] text-[#78716C]">Kinh nghiệm</span>
              </div>
              <div>
                <strong className="block text-[17px] font-black text-[#1C1917]">
                  {profile.responseRate}%
                </strong>
                <span className="text-[11px] text-[#78716C]">Phản hồi</span>
              </div>
            </div>

            {/* Giới thiệu bản thân (Bio & Tagline) */}
            <div className="space-y-2 pt-2 border-t border-[#E7E5E4]">
              <h2 className="text-[15px] font-bold text-[#1C1917]">Giới thiệu Thổ địa</h2>
              <p className="text-[13px] text-[#57534E] italic font-medium">
                “{profile.tagline}”
              </p>
              <p className="text-[13px] text-[#57534E] leading-relaxed">
                {profile.bio}
              </p>
            </div>

            {/* Khu vực & Chuyên môn dạng chip */}
            <div className="space-y-2 pt-2 border-t border-[#E7E5E4]">
              <h2 className="text-[15px] font-bold text-[#1C1917]">Khu vực & Chuyên môn</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.areas.map((a) => (
                  <span
                    key={a}
                    className="text-[12px] font-medium bg-[#F3F1EC] text-[#1C1917] px-3 py-1 rounded-full border border-[#E7E5E4]"
                  >
                    📍 {a}
                  </span>
                ))}
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[12px] font-medium bg-white text-[#57534E] px-3 py-1 rounded-full border border-[#E7E5E4]"
                  >
                    ✨ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lịch rảnh trong tuần */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#1C1917]">
                Lịch rảnh khả dụng
              </h2>
              <span className="text-[12px] text-[#78716C]">
                Cập nhật theo thời gian thực
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                    className={`py-2 px-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-xs'
                        : 'bg-[#F3F1EC]/60 text-[#1C1917] border-[#E7E5E4] hover:border-[#1C1917]'
                    }`}
                  >
                    {formatDate(d)}
                  </button>
                );
              })}
            </div>

            {/* Các ca trống trong ngày */}
            {daySlots.length === 0 ? (
              <div className="p-5 bg-[#F3F1EC] rounded-2xl text-center text-[13px] text-[#78716C]">
                Thổ địa hiện chưa có ca trống trong ngày này.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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

          {/* Đánh giá thật từ du khách */}
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#1C1917]">
                Đánh giá từ du khách ({guideReviews.length})
              </h2>
              <span className="text-[13px] font-bold text-[#1C1917]">
                ★ {profile.avgRating.toFixed(1)} / 5.0
              </span>
            </div>

            {guideReviews.length === 0 ? (
              <p className="text-[13px] text-[#78716C] py-2">
                Chưa có đánh giá nào cho Thổ địa này.
              </p>
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
                        <span className="font-bold text-amber-500">
                          {'★'.repeat(rev.stars)}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#57534E] leading-relaxed">{rev.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: PANEL ĐẶT LỊCH DÍNH (Sticky Booking Panel theo Mục [9]) */}
        <div id="booking-widget" className="lg:col-span-5 lg:sticky lg:top-20 scroll-mt-20">
          <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 shadow-md space-y-5">
            {/* Đơn giá theo giờ */}
            <div className="flex items-baseline justify-between border-b border-[#E7E5E4] pb-4">
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#78716C] block">
                  Đơn giá niêm yết
                </span>
                <span className="text-[22px] font-black text-[#1C1917] tabular-nums">
                  {formatHourlyRate(profile.hourlyRate)}
                </span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Không phụ thu khách
              </span>
            </div>

            {/* Tóm tắt ca đã chọn */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#1C1917] block">
                Khung giờ đang chọn:
              </label>
              {selectedSlot ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-[13px]">
                  <div>
                    <strong className="text-emerald-900 block">
                      {formatDate(selectedSlot.date)}
                    </strong>
                    <span className="text-emerald-700">
                      ⏰ {selectedSlot.startTime} – {selectedSlot.endTime} ({selectedHours} giờ)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    Đã chọn
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-[#F3F1EC] rounded-2xl text-[12px] text-[#78716C] text-center">
                  Vui lòng bấm chọn 1 ô giờ màu xanh ở cột bên trái
                </div>
              )}
            </div>

            {/* Tạm tính G & Cọc D (30%) với nhãn "Chỉ thanh toán sau khi Guide chấp nhận" */}
            <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-2xl p-4 space-y-2 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-[#57534E]">Tạm tính tổng dịch vụ (G):</span>
                <strong className="text-[#1C1917] text-[15px] tabular-nums">
                  {formatMoney(estimatedTotal)}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[#EB5B38] font-bold pt-1 border-t border-[#E7E5E4]">
                <span>Tiền cọc giữ chỗ 30% (D):</span>
                <span className="text-[16px] tabular-nums">
                  {formatMoney(estimatedDeposit)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E7E5E4] text-[11px] font-semibold text-[#1C1917] text-center">
                🔒 Chỉ thanh toán sau khi Guide chấp nhận
              </div>
            </div>

            {/* Nút hành động Đặt lịch */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!selectedSlot}
              onClick={handleProceedBooking}
              className="w-full bg-[#EB5B38] hover:bg-[#d64f2e] text-white py-3.5 rounded-2xl font-bold shadow-md cursor-pointer"
            >
              {selectedSlot
                ? `Tiếp tục đặt khung ${selectedSlot.startTime} – ${selectedSlot.endTime} →`
                : 'Chọn khung giờ trống để tiếp tục'}
            </Button>

            {/* Tóm tắt chính sách huỷ theo Mục [9] */}
            <div className="p-3.5 bg-white border border-[#E7E5E4] rounded-2xl space-y-1.5 text-[11px] text-[#57534E]">
              <strong className="text-[#1C1917] block font-bold text-[12px]">
                Chính sách hủy đơn & Hoàn cọc :
              </strong>
              <div className="flex justify-between">
                <span>• Hủy trước &gt; 48 giờ:</span>
                <strong className="text-emerald-700">Hoàn 100% cọc</strong>
              </div>
              <div className="flex justify-between">
                <span>• Hủy từ 24h – 48 giờ:</span>
                <strong className="text-amber-700">Hoàn 50% cọc</strong>
              </div>
              <div className="flex justify-between">
                <span>• Hủy dưới 24 giờ:</span>
                <strong className="text-red-700">Phạt 100% cọc</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E7E5E4]">
                <span>• Thổ địa hủy đơn:</span>
                <strong className="text-emerald-700">Hoàn 100% cọc ngay</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA theo Mục [9] */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[11px] text-[#78716C] block">
            {selectedSlot ? `Tổng (${selectedHours}h)` : 'Đơn giá'}
          </span>
          <strong className="text-[16px] font-black text-[#1C1917] tabular-nums">
            {selectedSlot
              ? formatMoney(estimatedTotal)
              : formatHourlyRate(profile.hourlyRate)}
          </strong>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold px-5"
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
          {selectedSlot ? 'Đặt lịch ngay →' : 'Chọn khung giờ'}
        </Button>
      </div>
    </div>
  );
};
