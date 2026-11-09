// utils/statusLabels.ts – Nhãn tiếng Việt chuẩn hóa cho các trạng thái nghiệp vụ

import { BookingStatus, PaymentStatus, SlotStatus, KycStatus } from '../types';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Chờ HDV phản hồi',
  WAITING_PAYMENT: 'Chờ đặt cọc 30%',
  CONFIRMED: 'Đã xác nhận lịch',
  COMPLETED: 'Đã hoàn thành',
  DISPUTED: 'Đang khiếu nại',
  CANCELLED: 'Đã hủy',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  WAITING_DEPOSIT: 'Chờ đặt cọc 30%',
  DEPOSITED: 'Đã cọc 30%',
  WAITING_FINAL: 'Chờ tất toán 70%',
  PAID: 'Đã thanh toán 100%',
  WAITING_REFUND: 'Đang chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền cọc',
  WAITING_RECONCILE: 'Chờ HDV xác nhận tiền mặt',
};

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  AVAILABLE: 'Đang trống',
  HOLD: 'Tạm giữ 15 phút',
  BUSY: 'Đã kín lịch',
};

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  NOT_SUBMITTED: 'Chưa nộp hồ sơ',
  PENDING: 'Chờ Admin thẩm định',
  APPROVED: 'Đã xác minh KYC',
  REJECTED: 'Cần bổ sung hồ sơ',
};
