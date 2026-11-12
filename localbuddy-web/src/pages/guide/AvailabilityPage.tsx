// pages/guide/AvailabilityPage.tsx
// Kiểm tra BR-01: Nếu HDV chưa được duyệt KYC (APPROVED), khóa tính năng mở lịch và hiển thị banner dẫn tới trang nộp KYC (/guide/kyc).
// Cho phép mở/đóng slot AVAILABLE <-> BUSY và thêm khung giờ rảnh mới. Khóa chỉnh sửa với các slot đang HOLD hoặc BUSY có đơn.

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { TimeSlot } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/time';
import { TimeSlotData } from '../../types';

export const AvailabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    slots,
    currentUser,
    getGuideById,
    toggleSlotAvailability,
    addAvailabilitySlot,
    updateAvailabilitySlot,
    removeAvailabilitySlot,
  } = useBookingContext();
  const { showToast } = useToast();

  const activeGuideId =
    currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const guideItem = getGuideById(activeGuideId);

  const guideDates = useMemo(() => {
    const s = slots.filter((item) => item.guideId === activeGuideId);
    const dates = Array.from(new Set(s.map((i) => i.date))).sort();
    return dates.length > 0
      ? dates
      : ['2026-11-12', '2026-11-13', '2026-11-14'];
  }, [slots, activeGuideId]);

  const [selectedDate, setSelectedDate] = useState<string>(
    guideDates[0] || '2026-11-12'
  );
  const [newDate, setNewDate] = useState<string>('2026-11-12');
  const [newStart, setNewStart] = useState<string>('08:00');
  const [newEnd, setNewEnd] = useState<string>('12:00');

  // State cho Modal sửa khung giờ rảnh
  const [editingSlot, setEditingSlot] = useState<TimeSlotData | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');

  const handleOpenEdit = (slot: TimeSlotData) => {
    setEditingSlot(slot);
    setEditDate(slot.date);
    setEditStart(slot.startTime);
    setEditEnd(slot.endTime);
  };

  const handleConfirmEdit = () => {
    if (!editingSlot) return;
    const res = updateAvailabilitySlot({
      slotId: editingSlot.id,
      date: editDate,
      startTime: editStart,
      endTime: editEnd,
    });
    if (res.ok) {
      showToast(res.message, 'success');
      setSelectedDate(editDate);
      setEditingSlot(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const currentSlots = slots.filter(
    (s) => s.guideId === activeGuideId && s.date === selectedDate
  );

  const isKycApproved =
    guideItem?.profile.isVerified && guideItem?.profile.kycStatus === 'APPROVED';

  const handleToggleSlot = (slotId: string) => {
    const res = toggleSlotAvailability(slotId);
    if (res.ok) {
      showToast(res.message, 'info');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addAvailabilitySlot({
      guideId: activeGuideId,
      date: newDate,
      startTime: newStart,
      endTime: newEnd,
    });
    if (res.ok) {
      showToast(res.message, 'success');
      setSelectedDate(newDate);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            Lịch làm việc theo giờ & Cơ chế Atomic Lock 
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1">
            Quản lý Lịch rảnh nhận khách
          </h1>
          <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
            Thiết lập các khung giờ Đang trống (AVAILABLE) tại Đà Nẵng để Du khách đặt lịch
          </p>
        </div>
      </div>

      {/* Cảnh báo nếu HDV chưa duyệt KYC  */}
      {!isKycApproved && (
        <div className="p-5 rounded-[16px] bg-[#FEF1DC] border-2 border-[#F8CA84] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[16px] font-extrabold text-[#8C4A08]">
              ⚠️ Tài khoản của bạn chưa hoàn tất xác minh KYC 
            </h3>
            <p className="text-[13px] text-[#1C1C28]">
              Chỉ Hướng dẫn viên đã được Admin phê duyệt KYC (<strong>APPROVED</strong>) mới được mở lịch nhận khách và hiển thị trên trang tìm kiếm.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/guide/kyc')}>
            🪪 Hoàn tất hồ sơ KYC ngay →
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Xem & Đóng/Mở ca theo ngày */}
        <div className="lg:col-span-7 bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-6 shadow-xs">
          <div>
            <h2 className="text-[18px] font-extrabold text-[#1A0A0F] mb-3">
              1. Chọn ngày làm việc của bạn:
            </h2>
            <div className="flex flex-wrap gap-2">
              {guideDates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-4 py-2 rounded-[10px] text-[13px] font-bold border transition-all cursor-pointer ${
                    selectedDate === d
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#1C1C28] border-[#E4C3CC] hover:border-[#1EC1CB]'
                  }`}
                >
                  📅 {formatDate(d)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-[#1A0A0F] mb-3">
              Các khung giờ ngày {formatDate(selectedDate)}:
            </h3>

            {currentSlots.length === 0 ? (
              <div className="p-6 bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] text-center text-[14px] text-[#52526B]">
                Chưa có khung giờ nào trong ngày này. Hãy thêm khung giờ mới ở khung bên phải!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-[12px] border border-[#E4C3CC] bg-[#FBF4F6] space-y-2"
                  >
                    <TimeSlot
                      startTime={slot.startTime}
                      endTime={slot.endTime}
                      status={slot.status}
                      onClick={() => handleToggleSlot(slot.id)}
                      holdSecondsLeft={slot.status === 'HOLD' ? 840 : undefined}
                    />
                    <div className="flex items-center justify-between text-[12px] px-1">
                      {slot.bookingId || slot.status === 'HOLD' ? (
                        <span className="font-bold text-[#8C4A08]">
                          🔒 {slot.bookingId ? `Đơn ${slot.bookingId}` : 'Đang giữ chỗ 15p'} (Khóa sửa/xóa)
                        </span>
                      ) : (
                        <span className="text-[#52526B]">
                          {slot.status === 'AVAILABLE'
                            ? 'Khách có thể đặt'
                            : 'Đã khóa thủ công'}
                        </span>
                      )}

                      {!slot.bookingId && slot.status !== 'HOLD' && (
                        <div className="flex items-center gap-2.5">
                          {slot.status === 'AVAILABLE' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(slot)}
                              className="text-[#118B93] font-bold hover:underline cursor-pointer"
                            >
                              Sửa giờ
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(slot.id)}
                            className="text-[#1C1C28] font-bold hover:underline cursor-pointer"
                          >
                            {slot.status === 'AVAILABLE' ? 'Tạm đóng' : 'Mở lại'}
                          </button>
                          {slot.status === 'AVAILABLE' && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = removeAvailabilitySlot(slot.id);
                                showToast(res.message, res.ok ? 'info' : 'error');
                              }}
                              className="text-[#A61B2B] font-bold hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-[12px] bg-[#F6E6EA]/60 border border-[#E4C3CC] text-[13px] space-y-1.5">
            <strong className="text-[#1A0A0F] block">
              Quy tắc khóa lịch nguyên tử :
            </strong>
            <p>• <strong>AVAILABLE (Đang trống):</strong> Cho phép Du khách gửi yêu cầu đặt lịch (PENDING).</p>
            <p>• <strong>HOLD (Tạm giữ 15 phút):</strong> Tự động kích hoạt ngay khi bạn bấm Chấp nhận đơn . Khung giờ bị khóa với mọi đơn khác trong 15 phút chờ khách đặt cọc 30%.</p>
            <p>• <strong>BUSY (Đã kín lịch):</strong> Đơn đã đặt cọc 30% thành công (CONFIRMED).</p>
          </div>
        </div>

        {/* Cột phải: Thêm khung giờ rảnh mới */}
        <form
          onSubmit={handleAddSlot}
          className="lg:col-span-5 bg-white border border-[#E4C3CC] rounded-[16px] p-6 space-y-4 shadow-xs"
        >
          <h2 className="text-[18px] font-extrabold text-[#1A0A0F] border-b border-[#E4C3CC] pb-3">
            2. Mở thêm khung giờ rảnh mới
          </h2>

          <Input
            label="Ngày làm việc (YYYY-MM-DD) *"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giờ bắt đầu *"
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
            />
            <Input
              label="Giờ kết thúc *"
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isKycApproved}
            className="w-full"
          >
            + Thêm khung giờ vào lịch rảnh
          </Button>
        </form>
      </div>

      {/* Modal chỉnh sửa khung giờ rảnh (Chỉ áp dụng cho slot AVAILABLE chưa có đơn) */}
      <Modal
        isOpen={Boolean(editingSlot)}
        onClose={() => setEditingSlot(null)}
        title="Chỉnh sửa khung giờ rảnh"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingSlot(null)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmEdit}>
              Lưu thay đổi khung giờ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#52526B]">
            Chỉ các khung giờ đang Trống (AVAILABLE) và chưa có khách giữ chỗ mới được phép thay đổi thời gian.
          </p>
          <Input
            label="Ngày làm việc *"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Giờ bắt đầu *"
              type="time"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
            />
            <Input
              label="Giờ kết thúc *"
              type="time"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
