// pages/public/DesignSystemPage.tsx
// Trang trưng bày toàn bộ Design System của LocalBuddy Đà Nẵng (/design-system):
// - Tokens: Bảng màu Burgundy (#1A0A0F), Blush (#F6E6EA), Navy (#1C1C28), Cyan (#1EC1CB - chữ luôn là Navy #1C1C28), 3 màu ngữ nghĩa, tương phản WCAG AA, bo góc 12px, font Inter.
// - Đầy đủ các component ở mọi trạng thái: Button, Input, Select, DatePicker, TimeSlotPicker, Card, Badge trạng thái, Avatar, Rating, Modal, BottomSheet, Toast, Skeleton, EmptyState, ErrorState, Tabs, Stepper, Table.

import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  DatePicker,
  TimeSlotPicker,
  Card,
  Avatar,
  Rating,
  Modal,
  BottomSheet,
  Skeleton,
  Tabs,
  Stepper,
  Table,
  useToast,
} from '../../components/ui';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { EmptyState, ErrorState } from '../../components/common/GuideCard';
import { BookingStatus, PaymentStatus } from '../../types';
import { formatHourlyRate } from '../../utils/money';

const COLOR_TOKENS = [
  {
    name: 'Burgundy (Tiêu đề, Footer)',
    varName: '--color-burgundy',
    hex: '#1A0A0F',
    textHex: '#F6E6EA',
    contrast: '15.8:1 (WCAG AAA)',
  },
  {
    name: 'Blush (Nền sáng, Vùng nhấn nhẹ)',
    varName: '--color-blush',
    hex: '#F6E6EA',
    textHex: '#1A0A0F',
    contrast: '15.8:1 (WCAG AAA)',
  },
  {
    name: 'Navy (Hero, Sidebar 240px, Chữ chính)',
    varName: '--color-navy',
    hex: '#1C1C28',
    textHex: '#FFFFFF',
    contrast: '16.2:1 (WCAG AAA)',
  },
  {
    name: 'Cyan (CTA, Focus, Active — Chữ Navy!)',
    varName: '--color-cyan',
    hex: '#1EC1CB',
    textHex: '#1C1C28',
    contrast: '7.4:1 (WCAG AAA)',
  },
  {
    name: 'Success (Thành công / Hoàn tất)',
    varName: '--color-success',
    hex: '#E3F7EF',
    textHex: '#0F6E4B',
    contrast: '5.9:1 (WCAG AA)',
  },
  {
    name: 'Warning (Chờ duyệt / Giữ chỗ 15p)',
    varName: '--color-warning',
    hex: '#FEF1DC',
    textHex: '#8C4A08',
    contrast: '6.1:1 (WCAG AA)',
  },
  {
    name: 'Error (Lỗi / Hủy / Tranh chấp)',
    varName: '--color-error',
    hex: '#FCE8EB',
    textHex: '#A61B2B',
    contrast: '6.4:1 (WCAG AA)',
  },
];

const BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'WAITING_PAYMENT',
  'CONFIRMED',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'UNPAID',
  'WAITING_DEPOSIT',
  'DEPOSITED',
  'WAITING_FINAL',
  'PAID',
  'WAITING_RECONCILE',
  'REFUNDED',
];

export const DesignSystemPage: React.FC = () => {
  const { showToast } = useToast();

  const [sampleDate, setSampleDate] = useState('2026-11-15');
  const [selectedArea, setSelectedArea] = useState('Cầu Rồng & Sông Hàn');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-demo-1');
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const demoSlots = [
    { id: 'slot-demo-1', startTime: '08:00', endTime: '11:00', status: 'AVAILABLE' as const },
    { id: 'slot-demo-2', startTime: '14:00', endTime: '17:00', status: 'AVAILABLE' as const },
    {
      id: 'slot-demo-3',
      startTime: '18:00',
      endTime: '21:00',
      status: 'HOLD' as const,
      holdSecondsLeft: 840,
    },
    { id: 'slot-demo-4', startTime: '21:00', endTime: '23:00', status: 'BUSY' as const },
  ];

  const demoTableData = [
    {
      id: 'BK-1001',
      guide: 'Nguyễn Hữu Khanh',
      area: 'Bán đảo Sơn Trà',
      rate: 250000,
      status: 'CONFIRMED' as BookingStatus,
    },
    {
      id: 'BK-1002',
      guide: 'Trần Thị Mỹ Linh',
      area: 'Chợ Cồn & Chợ Hàn',
      rate: 200000,
      status: 'WAITING_PAYMENT' as BookingStatus,
    },
    {
      id: 'BK-1003',
      guide: 'Lê Hoàng Nam',
      area: 'Bà Nà Hills',
      rate: 300000,
      status: 'COMPLETED' as BookingStatus,
    },
  ];

  return (
    <div className="space-y-10 py-4">
      {/* Banner đầu trang */}
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 border border-[#E4C3CC]/20">
        <span className="inline-block px-3 py-1 rounded-full bg-[#1EC1CB] text-[#1C1C28] text-xs font-extrabold uppercase tracking-wider">
          LocalBuddy Design System • WCAG AA+
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
          Hệ thống Thiết kế & Thư viện Thành phần Giao diện (`/design-system`)
        </h1>
        <p className="text-sm text-[#F6E6EA]/85 mt-1 max-w-3xl">
          Kiểm tra trực quan toàn bộ Design Tokens (bảng màu Burgundy, Blush, Navy, Cyan chữ Navy, bo góc 12px, font Inter) và 19 component dùng chung ở mọi trạng thái tương tác.
        </p>
      </div>

      {/* 1. DESIGN TOKENS & BẢNG MÀU */}
      <Card
        title="1. Design Tokens — Bảng màu & Độ tương phản WCAG AA/AAA"
        subtitle="Quy tắc bất biến: Chữ trên nền Cyan (#1EC1CB) luôn sử dụng màu Navy (#1C1C28), tuyệt đối không dùng chữ trắng."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLOR_TOKENS.map((t) => (
            <div
              key={t.varName}
              className="rounded-[12px] border border-[#E4C3CC] overflow-hidden shadow-xs"
            >
              <div
                className="h-24 p-4 flex flex-col justify-between font-bold"
                style={{ backgroundColor: t.hex, color: t.textHex }}
              >
                <span className="text-xs opacity-90">{t.varName}</span>
                <span className="text-base font-extrabold">{t.hex}</span>
              </div>
              <div className="p-3.5 bg-white space-y-1 text-xs">
                <div className="font-bold text-[#1A0A0F]">{t.name}</div>
                <div className="text-[#52526B]">Tương phản: {t.contrast}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. BUTTONS Ở MỌI TRẠNG THÁI */}
      <Card
        title="2. Button — Các biến thể, kích thước & trạng thái"
        subtitle="Primary (Cyan chữ Navy) / Secondary (Blush) / Outline / Ghost / Danger / Dark / Loading / Disabled"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Cyan (Chữ Navy)</Button>
            <Button variant="secondary">Secondary Blush</Button>
            <Button variant="outline">Outline Viền Nhẹ</Button>
            <Button variant="ghost">Ghost Trong Suốt</Button>
            <Button variant="danger">Danger Hủy / Xóa</Button>
            <Button variant="dark">Dark Navy</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E4C3CC]">
            <Button size="sm" variant="primary">
              Kích thước Nhỏ (sm)
            </Button>
            <Button size="md" variant="primary">
              Kích thước Chuẩn (md - 44px)
            </Button>
            <Button size="lg" variant="primary">
              Kích thước Lớn (lg - 50px)
            </Button>
            <Button variant="primary" isLoading>
              Đang xử lý...
            </Button>
            <Button variant="primary" disabled>
              Đã vô hiệu hóa (Disabled)
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. FORM CONTROLS: INPUT, SELECT, DATEPICKER, TEXTAREA */}
      <Card
        title="3. Form Controls — Input, Select, DatePicker & Validation Tiếng Việt"
        subtitle="Tất cả ô nhập liệu đạt chiều cao tối thiểu 44px chuẩn chạm di động, bo góc 12px, vòng focus Cyan."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Input
            label="Ô nhập chuẩn (Mặc định)"
            placeholder="Nhập điểm đón tại Đà Nẵng..."
            defaultValue="Đầu Cầu Rồng (bờ Đông, Sơn Trà)"
            hint="Gợi ý: Nhập địa chỉ khách sạn hoặc điểm hẹn"
          />
          <Input
            label="Ô nhập có lỗi Validation"
            defaultValue="abc"
            error="Số điện thoại không hợp lệ. Vui lòng nhập đủ 10 chữ số."
          />
          <Input
            label="Ô nhập vô hiệu hóa (Disabled)"
            defaultValue="048096001284 (Đã duyệt KYC)"
            disabled
          />
          <Select
            label="Chọn khu vực Đà Nẵng (Select)"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            options={[
              { value: 'Cầu Rồng & Sông Hàn', label: 'Cầu Rồng & Sông Hàn' },
              { value: 'Bán đảo Sơn Trà', label: 'Bán đảo Sơn Trà' },
              { value: 'Ngũ Hành Sơn', label: 'Danh thắng Ngũ Hành Sơn' },
              { value: 'Bà Nà Hills', label: 'Bà Nà Hills & Cầu Vàng' },
            ]}
          />
          <DatePicker
            label="Chọn ngày khởi hành (DatePicker)"
            value={sampleDate}
            onChange={setSampleDate}
            hint="Lọc trực tiếp các ca trống trong ngày"
          />
          <Textarea
            label="Ghi chú lịch trình (Textarea)"
            defaultValue="Nhóm 3 người muốn thưởng thức mì Quảng ếch và dạo phố cổ Hội An buổi tối."
            rows={2}
          />
        </div>
      </Card>

      {/* 4. TIMESLOTPICKER & STEPPER */}
      <Card
        title="4. TimeSlotPicker & Stepper — Khung giờ theo trạng thái & Tiến trình đặt lịch"
        subtitle="4 trạng thái khung giờ: Đang trống (AVAILABLE), Đang chọn (SELECTED), Tạm giữ 15p (HOLD), Đã kín (BUSY)"
      >
        <div className="space-y-6">
          <TimeSlotPicker
            label="Chọn khung giờ rảnh của Hướng dẫn viên:"
            slots={demoSlots}
            selectedSlotId={selectedSlotId}
            onSelect={(slot) => setSelectedSlotId(slot.id)}
          />

          <div className="pt-4 border-t border-[#E4C3CC]">
            <h4 className="text-sm font-extrabold text-[#1A0A0F] mb-3">
              Tiến trình đặt lịch đầu-cuối (Stepper):
            </h4>
            <Stepper
              steps={[
                { title: 'Chọn ca & Gửi yêu cầu', subtitle: 'Khung giờ mở', status: 'done' },
                { title: 'HDV chấp nhận & Giữ 15p', subtitle: 'Atomic Lock HOLD', status: 'current' },
                { title: 'Đặt cọc 30% & Khởi hành', subtitle: 'Ký hợp đồng điện tử', status: 'upcoming' },
                { title: 'Tất toán 70% & Đánh giá', subtitle: 'Tiền vào ví HDV', status: 'upcoming' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 5. BADGES, AVATAR, RATING & TABS */}
      <Card
        title="5. StatusBadge, PaymentBadge, Avatar, Rating & Tabs"
        subtitle="Hệ thống huy hiệu song song (BookingStatus + PaymentStatus), Avatar xác thực KYC và Đánh giá sao"
      >
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase text-[#52526B] mb-2">
              Huy hiệu Trạng thái Đơn đặt lịch (BookingStatus):
            </div>
            <div className="flex flex-wrap gap-2">
              {BOOKING_STATUSES.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase text-[#52526B] mb-2">
              Huy hiệu Trạng thái Thanh toán (PaymentStatus):
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((pst) => (
                <PaymentBadge key={pst} status={pst} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E4C3CC]">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-[#52526B]">
                Avatar kèm Huy hiệu KYC & Vai trò:
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Avatar
                  name="Nguyễn Hữu Khanh"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                  size="lg"
                  verified
                  roleBadge="Local Guide"
                />
                <Avatar name="Lê Văn Hoàng" size="md" roleBadge="Admin Đà Nẵng" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-[#52526B]">
                Rating (Chấm sao tương tác & Hiển thị trung bình):
              </div>
              <div className="space-y-2">
                <Rating value={ratingVal} onChange={setRatingVal} reviewCount={48} size="md" />
                <div>
                  <Rating value={4.9} reviewCount={126} size="sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4C3CC]">
            <Tabs
              activeId={activeTab}
              onChange={setActiveTab}
              items={[
                { id: 'all', label: 'Tất cả đơn đặt lịch', badge: 12 },
                { id: 'pending', label: 'Chờ xác nhận', badge: 3 },
                { id: 'confirmed', label: 'Sắp khởi hành', badge: 4 },
                { id: 'completed', label: 'Đã hoàn thành', badge: 5 },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 6. TABLE, MODAL, BOTTOMSHEET & TOAST */}
      <Card
        title="6. Table, Modal, BottomSheet & Toast thông báo"
        subtitle="Bảng dữ liệu chuẩn thương mại và các hộp thoại xác nhận thao tác quan trọng"
      >
        <div className="space-y-5">
          <Table
            data={demoTableData}
            rowKey={(r) => r.id}
            columns={[
              {
                key: 'id',
                header: 'Mã đặt chỗ',
                render: (r) => <span className="font-mono font-bold text-[#1A0A0F]">{r.id}</span>,
              },
              {
                key: 'guide',
                header: 'Hướng dẫn viên Đà Nẵng',
                render: (r) => <span className="font-bold">{r.guide}</span>,
              },
              {
                key: 'area',
                header: 'Khu vực',
                render: (r) => <span>📍 {r.area}</span>,
              },
              {
                key: 'rate',
                header: 'Đơn giá theo giờ',
                align: 'right',
                render: (r) => (
                  <span className="font-extrabold text-[#1A0A0F] tabular-nums">
                    {formatHourlyRate(r.rate)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Trạng thái',
                align: 'center',
                render: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Mở Modal xác nhận (Desktop/Tablet)
            </Button>
            <Button variant="secondary" onClick={() => setIsSheetOpen(true)}>
              Mở BottomSheet (Trượt đáy trên Mobile)
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                showToast('Đã lưu thay đổi thành công trên hệ thống Đà Nẵng!', 'success')
              }
            >
              Bắn Toast Thành công
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                showToast('Cảnh báo: Khung giờ này vừa được du khách khác giữ chỗ 15 phút!', 'error')
              }
            >
              Bắn Toast Lỗi / Xung đột
            </Button>
          </div>
        </div>
      </Card>

      {/* 7. SKELETON, EMPTY STATE & ERROR STATE */}
      <Card
        title="7. Bốn trạng thái màn hình: Skeleton (Đang tải), EmptyState (Rỗng) & ErrorState (Lỗi)"
        subtitle="Sử dụng Skeleton thay cho vòng xoay đơn điệu, thông báo tiếng Việt thân thiện kèm hành động tiếp theo."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-[12px] border border-[#E4C3CC] space-y-3">
            <div className="text-xs font-bold uppercase text-[#52526B]">
              Trạng thái Đang tải (Skeleton):
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          <EmptyState
            title="Không tìm thấy HDV phù hợp"
            description="Chưa có Hướng dẫn viên nào rảnh vào khung giờ bạn chọn. Hãy thử nới khoảng giá hoặc chọn ngày lân cận."
            actionText="Xóa bộ lọc tìm kiếm"
            onAction={() => showToast('Đã đặt lại bộ lọc tìm kiếm!', 'info')}
          />

          <ErrorState
            message="Không thể kết nối tới máy chủ thanh toán. Đơn giữ chỗ 15 phút của bạn vẫn được bảo toàn."
            onRetry={() => showToast('Đang thử kết nối lại...', 'info')}
          />
        </div>
      </Card>

      {/* Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Xác nhận thao tác quan trọng"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                showToast('Đã xác nhận thao tác trong Modal!', 'success');
              }}
            >
              Xác nhận thực hiện
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#1C1C28] leading-relaxed">
          Hộp thoại Modal hỗ trợ đóng bằng phím <strong>ESC</strong>, nhấn ra vùng mờ bên ngoài và tự động chuyển thành <strong>BottomSheet</strong> trên màn hình di động 390px–430px.
        </p>
      </Modal>

      {/* BottomSheet Demo */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Tóm tắt chi phí thuê theo giờ (BottomSheet)"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              setIsSheetOpen(false);
              showToast('Đã chọn khung giờ từ BottomSheet!', 'info');
            }}
          >
            Tiếp tục đặt lịch (250.000 ₫ / giờ)
          </Button>
        }
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Đơn giá thuê HDV bản địa:</span>
            <strong>250.000 ₫ / giờ</strong>
          </div>
          <div className="flex justify-between">
            <span>Thời lượng đã chọn:</span>
            <strong>4 giờ (1.000.000 ₫)</strong>
          </div>
          <div className="flex justify-between text-[#0F6E4B] font-bold pt-2 border-t border-[#E4C3CC]">
            <span>Đặt cọc 30% giữ chỗ:</span>
            <span>300.000 ₫</span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
