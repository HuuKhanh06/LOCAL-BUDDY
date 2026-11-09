// pages/tourist/BookingFormPage.tsx (UC.12: Đặt lịch Hướng dẫn viên theo giờ)
// Tuân thủ chốt Câu hỏi 2 & 3:
// - Bắt buộc nhập cả Địa điểm hẹn (diaDiemHen) và Ghi chú yêu cầu (ghiChuYeuCau) + có chip gợi ý điểm đón Đà Nẵng (NB-05).
// - Khi gửi yêu cầu (PENDING), khung giờ VẪN GIỮ LÀ AVAILABLE (BR-04), chỉ khóa HOLD khi HDV bấm Chấp nhận (UC.13).

import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { PaymentSummary } from '../../components/common/PaymentSummary';
import { ErrorState } from '../../components/common/GuideCard';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/time';
import { DANANG_MEETING_SPOTS } from '../../data/mockData';

export const BookingFormPage: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getGuideById, createBooking, slots } = useBookingContext();
  const { showToast } = useToast();

  const guideItem = getGuideById(guideId || '');
  const date = searchParams.get('date') || '2026-11-12';
  const startTime = searchParams.get('start') || '08:00';
  const endTime = searchParams.get('end') || '11:00';
  const slotId = searchParams.get('slotId') || '';

  const startHour = parseInt(startTime.split(':')[0], 10) || 8;
  const endHour = parseInt(endTime.split(':')[0], 10) || 11;
  const defaultHours = Math.max(1, endHour - startHour);

  const [hours, setHours] = useState<number>(defaultHours);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [meetingLocation, setMeetingLocation] = useState<string>(
    DANANG_MEETING_SPOTS[0]
  );
  const [specialRequests, setSpecialRequests] = useState<string>(
    'Nhóm mình muốn khám phá ẩm thực địa phương và chụp ảnh tại các điểm nổi bật ở Đà Nẵng.'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!guideItem) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <ErrorState
          message="Không tìm thấy thông tin Hướng dẫn viên để đặt lịch."
          onRetry={() => navigate('/guides')}
        />
      </div>
    );
  }

  const { user, profile } = guideItem;
  const totalAmount = profile.hourlyRate * hours;
  const depositAmount = Math.round(totalAmount * 0.3);
  const remainingAmount = totalAmount - depositAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!guestCount || guestCount < 1 || guestCount > 20) {
      setErrorMsg('Số lượng khách tham gia phải từ 1 đến 20 người.');
      return;
    }

    if (!meetingLocation.trim()) {
      setErrorMsg(
        'Theo quy định FR 4.1 (UC.12), vui lòng nhập hoặc chọn Địa điểm hẹn đón khách tại Đà Nẵng.'
      );
      return;
    }

    if (!specialRequests.trim()) {
      setErrorMsg(
        'Theo quy định FR 4.1 (UC.12), vui lòng nhập Ghi chú yêu cầu / Lịch trình mong muốn để HDV chuẩn bị.'
      );
      return;
    }

    // Kiểm tra xem khung giờ có đang bị HOLD hoặc BUSY không
    const matchedSlot = slots.find(
      (s) =>
        s.guideId === user.id &&
        s.date === date &&
        s.startTime === startTime
    );

    if (matchedSlot && matchedSlot.status !== 'AVAILABLE') {
      setErrorMsg(
        `Khung giờ ${startTime} – ${endTime} ngày ${formatDate(
          date
        )} hiện đang ở trạng thái ${matchedSlot.status}, vui lòng chọn khung giờ khác.`
      );
      return;
    }

    const newBooking = createBooking({
      guideId: user.id,
      date,
      startTime,
      endTime,
      hours,
      guestCount,
      meetingLocation,
      specialRequests,
      slotIds: slotId ? [slotId] : undefined,
    });

    showToast(
      `Đã tạo yêu cầu đặt lịch ${newBooking.id}! Hướng dẫn viên có 24 giờ để phản hồi (BR-03).`,
      'success'
    );
    navigate(`/don/${newBooking.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] bg-[#F6E6EA] px-3 py-1 rounded-full">
            UC.12 • Gửi yêu cầu đặt lịch theo giờ
          </span>
          <h1 className="text-[26px] font-extrabold text-[#1A0A0F] mt-2">
            Xác nhận thông tin chuyến đi tại Đà Nẵng
          </h1>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/guides/${user.id}`)}>
          ← Đổi khung giờ khác
        </Button>
      </div>

      {/* Thẻ tóm tắt HDV & Ca đã chọn */}
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatarUrl}
            alt={user.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#1EC1CB]"
          />
          <div>
            <span className="text-[11px] font-bold text-[#1EC1CB] uppercase tracking-wider">
              Hướng dẫn viên đồng hành
            </span>
            <h3 className="text-[19px] font-extrabold text-white">{user.fullName}</h3>
            <p className="text-[13px] text-[#F6E6EA]/90 mt-0.5">
              📅 Ngày {formatDate(date)} • ⏰ Khung giờ {startTime} – {endTime} ({hours} giờ)
            </p>
          </div>
        </div>
        <div className="sm:text-right bg-white/10 px-4 py-2.5 rounded-[12px]">
          <span className="text-[11px] text-[#F6E6EA]/80 block">Đơn giá áp dụng</span>
          <span className="text-[18px] font-black text-[#1EC1CB] tabular-nums">
            {profile.hourlyRate.toLocaleString('vi-VN')} ₫ / giờ
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số lượng khách tham gia * (1 – 20 người)"
            type="number"
            min={1}
            max={20}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            hint="Giá thuê tính theo giờ của HDV, không phụ thu theo đầu người"
          />

          <Input
            label="Số giờ thuê trong ca *"
            type="number"
            min={1}
            max={10}
            value={hours}
            onChange={(e) => setHours(Math.max(1, Math.min(10, Number(e.target.value))))}
            hint={`Khung giờ gốc: ${startTime} – ${endTime}`}
          />
        </div>

        {/* Địa điểm hẹn bắt buộc + Chip chọn nhanh địa danh Đà Nẵng (NB-05) */}
        <div className="space-y-2">
          <Input
            label="Địa điểm hẹn đón khách tại Đà Nẵng * (Bắt buộc - FR 4.1)"
            placeholder="Nhập địa chỉ khách sạn hoặc điểm hẹn tại Đà Nẵng..."
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
          />
          <div>
            <span className="text-[12px] font-semibold text-[#52526B] block mb-1.5">
              📍 Chọn nhanh điểm hẹn phổ biến tại Đà Nẵng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DANANG_MEETING_SPOTS.map((spot) => (
                <button
                  key={spot}
                  type="button"
                  onClick={() => setMeetingLocation(spot)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer ${
                    meetingLocation === spot
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                  }`}
                >
                  {spot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ghi chú yêu cầu bắt buộc (FR 4.1, UC.12) */}
        <Textarea
          label="Ghi chú yêu cầu & Lịch trình mong muốn * (Bắt buộc - FR 4.1, UC.12)"
          placeholder="Ví dụ: Muốn đi Chùa Linh Ứng Sơn Trà, ăn hải sản Bé Mặn và nhờ HDV chụp ảnh gia đình..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={4}
          hint="Thông tin này giúp Hướng dẫn viên chuẩn bị lộ trình phù hợp nhất cho bạn"
        />

        {/* Tóm tắt thanh toán (Mode tourist: Tuyệt đối ẩn phí sàn) */}
        <PaymentSummary
          hourlyRate={profile.hourlyRate}
          hours={hours}
          total={totalAmount}
          deposit={depositAmount}
          remaining={remainingAmount}
          mode="tourist"
        />

        <div className="p-4 rounded-[12px] bg-[#E5F8F9] border border-[#1EC1CB] text-[13px] text-[#1C1C28] space-y-1">
          <p className="font-bold">
            ℹ️ Cơ chế giữ lịch nguyên tử của LocalBuddy (BR-03, BR-04, BR-05):
          </p>
          <p>
            1. Khi bạn bấm <strong>Gửi yêu cầu đặt lịch</strong>, đơn sẽ ở trạng thái <strong>Chờ HDV phản hồi (PENDING)</strong>. Bạn chưa phải thanh toán ngay.
          </p>
          <p>
            2. Ngay khi HDV <strong>{user.fullName}</strong> bấm Chấp nhận (trong vòng 24 giờ), hệ thống sẽ khóa nguyên tử khung giờ (<strong>HOLD</strong>) trong <strong>15 phút</strong> để bạn thanh toán cọc 30%.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#E4C3CC] flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/guides/${user.id}`)}
          >
            ← Quay lại hồ sơ HDV
          </Button>
          <Button type="submit" variant="primary" size="lg">
            Gửi yêu cầu đặt lịch ngay →
          </Button>
        </div>
      </form>
    </div>
  );
};
