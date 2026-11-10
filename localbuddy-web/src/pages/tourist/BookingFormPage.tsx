// pages/tourist/BookingFormPage.tsx (UC.12: Đặt lịch Hướng dẫn viên theo giờ)
// Thiết kế theo Mục [9] THAM KHẢO UI:
// Gửi yêu cầu: chọn ngày → lưới giờ rảnh → số giờ → địa điểm hẹn → số khách → ghi chú → tóm tắt tiền →
// "Gửi yêu cầu đặt lịch (chưa tính phí cho đến khi Guide chấp nhận)"
// Tuân thủ:
// - Bắt buộc nhập cả Địa điểm hẹn và Ghi chú yêu cầu + chip gợi ý điểm đón Đà Nẵng
// - Khung giờ VẪN GIỮ LÀ AVAILABLE (BR-04) khi PENDING, chỉ HOLD 15 phút khi HDV Chấp nhận (UC.13)
// - Tourist mode: Tuyệt đối không bao giờ hiển thị phí sàn

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
  const { currentUser, getGuideById, createBooking, slots } = useBookingContext();
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
  const [specialRequests, setSpecialRequests] = useState<string>('');
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

    if (!currentUser) {
      showToast('Vui lòng đăng ký hoặc đăng nhập tài khoản để đặt lịch!', 'info');
      navigate(
        `/dang-nhap?returnTo=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

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
        'Theo quy định FR 4.1 (UC.12), vui lòng nhập Ghi chú yêu cầu / Lịch trình mong muốn để Thổ địa chuẩn bị.'
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
      `Đã tạo yêu cầu đặt lịch ${newBooking.id}! Thổ địa có 24 giờ để phản hồi (BR-03).`,
      'success'
    );
    navigate(`/don/${newBooking.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#EB5B38] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
            Bước xác nhận chuyến đi • UC.12
          </span>
          <h1 className="text-[24px] sm:text-[28px] font-black text-[#1C1917] mt-2">
            Gửi yêu cầu đặt Thổ địa Đà Nẵng
          </h1>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/guides/${user.id}`)}>
          ← Đổi khung giờ khác
        </Button>
      </div>

      {/* Thẻ tóm tắt HDV & Ca đã chọn */}
      <div className="bg-white text-[#1C1917] rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#F1DEC9] shadow-xs">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatarUrl}
            alt={user.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#F1DEC9] shadow-xs shrink-0"
          />
          <div>
            <span className="text-[11px] font-bold text-[#D12B79] uppercase tracking-wider">
              Thổ địa đồng hành
            </span>
            <h3 className="text-[20px] font-black text-[#1C1917]">{user.fullName}</h3>
            <p className="text-[13px] text-[#6E6259] mt-0.5">
              📅 Ngày {formatDate(date)} • ⏰ Khung {startTime} – {endTime} ({hours} giờ)
            </p>
          </div>
        </div>
        <div className="sm:text-right bg-[#FEEDDC] px-4 py-2.5 rounded-2xl border border-[#F1DEC9]">
          <span className="text-[11px] text-[#78716C] block">Đơn giá niêm yết</span>
          <span className="text-[18px] font-black text-[#D12B79] tabular-nums">
            {profile.hourlyRate.toLocaleString('vi-VN')} ₫ / giờ
          </span>
        </div>
      </div>

      {/* Form quy trình gửi yêu cầu theo Mục [9] */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số giờ thuê trong ca *"
            type="number"
            min={1}
            max={10}
            value={hours}
            onChange={(e) => setHours(Math.max(1, Math.min(10, Number(e.target.value))))}
            hint={`Khung giờ gốc: ${startTime} – ${endTime}`}
          />

          <Input
            label="Số lượng khách tham gia * (1 – 20 người)"
            type="number"
            min={1}
            max={20}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            hint="Đơn giá tính theo giờ, không phụ thu theo đầu người"
          />
        </div>

        {/* Địa điểm hẹn bắt buộc + Chip gợi ý điểm đón Đà Nẵng */}
        <div className="space-y-2">
          <Input
            label="Địa điểm hẹn đón khách tại Đà Nẵng * (Bắt buộc - FR 4.1)"
            placeholder="Nhập địa chỉ khách sạn hoặc điểm hẹn tại Đà Nẵng..."
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
          />
          <div>
            <span className="text-[12px] font-semibold text-[#78716C] block mb-1.5">
              📍 Gợi ý điểm hẹn phổ biến tại Đà Nẵng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DANANG_MEETING_SPOTS.map((spot) => (
                <button
                  key={spot}
                  type="button"
                  onClick={() => setMeetingLocation(spot)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
                    meetingLocation === spot
                      ? 'bg-[#D12B79] text-white border-[#D12B79]'
                      : 'bg-white text-[#1C1917] border-[#F1DEC9] hover:border-[#D12B79]'
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
          placeholder="Ví dụ: Cả đoàn muốn đi Chùa Linh Ứng Sơn Trà, ăn hải sản Bé Mặn và nhờ Thổ địa chụp ảnh gia đình..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          hint="Thông tin này giúp Thổ địa chuẩn bị lộ trình tốt nhất cho bạn"
        />

        {/* Tóm tắt thanh toán minh bạch (Mode tourist: Tuyệt đối ẩn phí sàn) */}
        <PaymentSummary
          hourlyRate={profile.hourlyRate}
          hours={hours}
          total={totalAmount}
          deposit={depositAmount}
          remaining={remainingAmount}
          mode="tourist"
        />

        {/* Hộp thông tin cam kết giữ lịch */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[13px] text-amber-950 space-y-1">
          <p className="font-bold">
            ℹ️ Cam kết an tâm từ LocalBuddy (BR-03, BR-04, BR-05):
          </p>
          <p>
            1. Khi gửi yêu cầu, đơn ở trạng thái <strong>Chờ Thổ địa phản hồi (PENDING)</strong>. <strong>Bạn hoàn toàn chưa bị tính phí.</strong>
          </p>
          <p>
            2. Thổ địa <strong>{user.fullName}</strong> có 24 giờ để chấp nhận. Khi chấp nhận, khung giờ được khóa giữ chỗ (HOLD) trong 15 phút để bạn tiến hành đặt cọc 30%.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-[13px] font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#E7E5E4] gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/guides/${user.id}`)}
          >
            ← Quay lại hồ sơ Thổ địa
          </Button>

          {/* Nút hành động chính theo Mục [9]: "Gửi yêu cầu đặt lịch (chưa tính phí cho đến khi Guide chấp nhận)" */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold text-[14px] shadow-md transition-colors cursor-pointer text-center"
          >
            Gửi yêu cầu đặt lịch (chưa tính phí cho đến khi Guide chấp nhận) →
          </button>
        </div>
      </form>
    </div>
  );
};
