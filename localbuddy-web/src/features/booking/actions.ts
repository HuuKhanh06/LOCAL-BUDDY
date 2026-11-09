// features/booking/actions.ts
// Trả về danh sách các nút hành động hợp lệ theo đúng Ma trận Trạng thái (BR-03, BR-06, BR-08, BR-12, BR-13 & UC.12–UC.27)

import { BookingStatus, PaymentStatus, UserRole } from '../../types';

export interface BookingAction {
  key: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export interface ActionsParams {
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  role: UserRole;
  guideRequestedCompletion?: boolean; // HDV đã bấm Yêu cầu xác nhận hoàn thành (UC.17)
  canReview?: boolean;                // COMPLETED + PAID + chưa gửi đánh giá (UC.26)
  isCashBranch?: boolean;             // Khách chọn trả tiền mặt 70%, chờ HDV xác nhận (UC.21)
  deltaHours?: number;                // ΔT giờ còn lại đến lúc bắt đầu ca
}

export function getBookingActions(p: ActionsParams): BookingAction[] {
  const actions: BookingAction[] = [];
  const { bookingStatus: bs, paymentStatus: ps, role, guideRequestedCompletion } = p;

  // ── 1. VAI TRÒ DU KHÁCH (TOURIST) ─────────────────────────
  if (role === 'tourist') {
    // PENDING: Khách được hủy yêu cầu miễn phí trước khi HDV duyệt (UC.24)
    if (bs === 'PENDING') {
      actions.push({ key: 'cancel', label: 'Hủy yêu cầu đặt lịch', variant: 'danger' });
    }

    // WAITING_PAYMENT + WAITING_DEPOSIT: Đặt cọc 30% trong 15 phút (UC.14) hoặc Hủy đơn
    if (bs === 'WAITING_PAYMENT' && ps === 'WAITING_DEPOSIT') {
      actions.push({ key: 'pay_deposit', label: 'Thanh toán cọc 30% ngay', variant: 'primary' });
      actions.push({ key: 'cancel', label: 'Hủy đơn', variant: 'ghost' });
    }

    // CONFIRMED + DEPOSITED:
    if (bs === 'CONFIRMED' && ps === 'DEPOSITED') {
      if (guideRequestedCompletion) {
        // Cửa sổ 24 giờ sau khi HDV bấm Yêu cầu hoàn thành (UC.17 → UC.18 / UC.19)
        actions.push({ key: 'confirm_complete', label: 'Xác nhận hoàn thành tour', variant: 'primary' });
        actions.push({ key: 'dispute', label: 'Gửi khiếu nại', variant: 'danger' });
      } else {
        // Trước khi kết thúc tour: Khách có thể hủy đơn theo chính sách ΔT (UC.24)
        actions.push({ key: 'cancel', label: 'Hủy đơn đặt lịch', variant: 'danger' });
      }
    }

    // COMPLETED: Đã hoàn thành tour (Khóa quyền khiếu nại theo BR-12)
    if (bs === 'COMPLETED') {
      if (ps === 'WAITING_FINAL') {
        actions.push({ key: 'pay_final', label: 'Tất toán 70% còn lại', variant: 'primary' });
      }
      if (ps === 'PAID' && p.canReview) {
        actions.push({ key: 'review', label: 'Viết đánh giá HDV', variant: 'primary' });
      }
    }
  }

  // ── 2. VAI TRÒ HƯỚNG DẪN VIÊN (GUIDE) ────────────────────
  if (role === 'guide') {
    // PENDING: Chấp nhận (khóa HOLD 15p) hoặc Từ chối (UC.13)
    if (bs === 'PENDING') {
      actions.push({ key: 'accept', label: 'Chấp nhận & Giữ lịch 15p', variant: 'primary' });
      actions.push({ key: 'reject', label: 'Từ chối yêu cầu', variant: 'danger' });
    }

    // CONFIRMED + DEPOSITED:
    if (bs === 'CONFIRMED' && ps === 'DEPOSITED') {
      if (!guideRequestedCompletion) {
        actions.push({ key: 'request_complete', label: 'Yêu cầu xác nhận hoàn thành', variant: 'primary' });
        actions.push({ key: 'cancel', label: 'Hủy nhận dẫn khách', variant: 'danger' });
      } else {
        // Khi đang trong cửa sổ 24h chờ khách xác nhận, HDV cũng có quyền gửi khiếu nại nếu khách vi phạm (UC.19)
        actions.push({ key: 'dispute', label: 'Gửi khiếu nại sự cố', variant: 'danger' });
      }
    }

    // COMPLETED + WAITING_RECONCILE: Khách chọn trả tiền mặt 70%, chờ HDV xác nhận đã thu đủ (UC.21)
    if (bs === 'COMPLETED' && (ps === 'WAITING_RECONCILE' || p.isCashBranch)) {
      actions.push({ key: 'confirm_cash', label: 'Xác nhận đã thu đủ 70% tiền mặt', variant: 'primary' });
    }
  }

  // ── 3. VAI TRÒ QUẢN TRỊ VIÊN (ADMIN) ─────────────────────
  if (role === 'admin') {
    if (bs === 'DISPUTED') {
      actions.push({ key: 'resolve_dispute', label: 'Phán quyết tranh chấp', variant: 'primary' });
    }
  }

  return actions;
}
