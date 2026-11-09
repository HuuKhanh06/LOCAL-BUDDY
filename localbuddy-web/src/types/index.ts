// ============================================================
// TYPES – LOCALBUDDY ĐÀ NẴNG (CHUẨN HÓA THEO THIẾT KẾ CSDL & 29 USE CASES)
// ============================================================

export type UserRole = 'tourist' | 'guide' | 'admin';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  isLocked: boolean;
  violationCount: number; // TAIKHOAN.soLanViPham
  nationality?: string;   // DU_KHACH.quocTich
  preferredLanguage?: string; // DU_KHACH.ngonNguUuTien
  createdAt: string;
}

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  id: string;
  docType: 'CCCD_FRONT' | 'CCCD_BACK' | 'GUIDE_CARD' | 'LANGUAGE_CERT';
  name: string;
  url: string;
}

export interface KycRecord {
  id: string;
  guideId: string;
  idNumber: string; // soCCCD
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  documents: KycDocument[];
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface GuideProfile {
  userId: string;
  tagline: string;      // Câu giới thiệu ngắn kiểu Withlocals
  bio: string;          // HƯỚNG_DẪN_VIÊN.gioiThieu
  hourlyRate: number;   // VND: 80.000 – 500.000 ₫ / giờ (BR-02)
  yearsExperience: number; // soNamKinhNghiem
  kycStatus: KycStatus;
  isVerified: boolean;  // true khi kycStatus === 'APPROVED'
  avgRating: number;    // diemDanhGiaTB
  totalReviews: number; // tongSoDanhGia
  completedTours: number;
  responseTimeText: string; // e.g. 'Thường phản hồi trong 15 phút'
  responseRate: number;     // e.g. 98 (%)
  areas: string[];      // KHU_VUC tại Đà Nẵng (Cầu Rồng, Sơn Trà, Bà Nà Hills, Ngũ Hành Sơn, Hội An...)
  languages: string[];  // NGON_NGU (Tiếng Việt, Tiếng Anh, Tiếng Hàn, Tiếng Nhật...)
  skills: string[];     // KY_NANG (Ẩm thực bản địa, Nhiếp ảnh, Lịch sử & Văn hóa, Khám phá về đêm...)
  avatarUrl: string;
  coverUrl: string;
  galleryUrls: string[];
  highlights: string[]; // Điểm nổi bật khi đi cùng HDV này
  faqs: GuideFaqItem[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

// ---------- Lịch rảnh & Khóa nguyên tử (AVAILABILITY_CALENDAR) ----------
export type SlotStatus = 'AVAILABLE' | 'HOLD' | 'BUSY';

export interface TimeSlotData {
  id: string;
  guideId: string;
  date: string;       // 'YYYY-MM-DD'
  startTime: string;  // 'HH:mm'
  endTime: string;    // 'HH:mm'
  status: SlotStatus;
  bookingId?: string; // gắn khi HOLD hoặc BUSY
  holdExpiresAt?: string; // ISO datetime hạn giữ chỗ 15 phút (BR-05)
}

// ---------- Hai trạng thái độc lập của Đơn đặt lịch (BR-03, Phụ lục 2) ----------
export type BookingStatus =
  | 'PENDING'
  | 'WAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'             // tương đương NOT_PAID
  | 'WAITING_DEPOSIT'    // tương đương DEPOSIT_PENDING
  | 'DEPOSITED'          // tương đương DEPOSIT_PAID
  | 'WAITING_FINAL'      // tương đương BALANCE_PENDING
  | 'PAID'               // tương đương PAID
  | 'WAITING_REFUND'     // tương đương REFUND_PENDING
  | 'REFUNDED'           // tương đương REFUNDED
  | 'WAITING_RECONCILE'; // tương đương RECONCILIATION_PENDING

export type PaymentMethod = 'ONLINE' | 'CASH';

export type CancellationType =
  | 'TOURIST_CANCEL'
  | 'GUIDE_CANCEL'
  | 'GUIDE_REJECT'
  | 'SYSTEM_TIMEOUT'
  | 'DISPUTE_RESOLUTION';

export interface Booking {
  id: string; // 'BK-1001' ...
  touristId: string;
  guideId: string;
  slotIds: string[];  // Danh sách các ca lịch gắn với đơn
  date: string;       // 'YYYY-MM-DD'
  startTime: string;  // 'HH:mm'
  endTime: string;    // 'HH:mm'
  hours: number;
  guestCount: number;
  meetingLocation: string;   // diaDiemHen (Bắt buộc - FR 4.1, UC.12)
  specialRequests: string;   // ghiChuYeuCau / Booking Notes (Bắt buộc - FR 4.1, UC.12)
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  hourlyRateSnapshot: number; // donGiaGioSnapshot
  feeRate: number;            // tyLePhiSanSnapshot (0.10 – 0.15)
  totalAmount: number;        // G = hourlyRate * hours
  depositAmount: number;      // D = 30% G
  remainingAmount: number;    // B = 70% G
  createdAt: string;          // ISO datetime
  pendingExpiresAt?: string;  // Hạn 24 giờ HDV phản hồi (BR-03)
  acceptedAt?: string;
  holdExpiresAt?: string;     // Hạn 15 phút khách đặt cọc 30% (BR-05)
  confirmedAt?: string;
  completionRequestedAt?: string; // Thời điểm HDV bấm Yêu cầu hoàn thành (UC.17)
  completionAutoConfirmAt?: string; // Hạn 24 giờ khách xác nhận hoàn thành / khiếu nại (BR-08)
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancellationType?: CancellationType;
  deltaHours?: number;        // ΔT tại thời điểm hủy
  penalty?: number;           // Tiền phạt cọc
  refund?: number;            // Tiền hoàn cho khách
  guideCompensation?: number; // Tiền bồi thường thực cộng ví HDV sau trừ phí sàn
  paymentMethod?: PaymentMethod; // ONLINE hoặc CASH cho 70% cuối
  guideRequestedCompletion?: boolean;
  touristConfirmedCompletion?: boolean;
}

// ---------- Bản ghi Hủy đơn (CANCELLATION_RECORD) ----------
export interface CancellationRecord {
  id: string;
  bookingId: string;
  cancelledByUserId: string;
  cancellationType: CancellationType;
  reason: string;       // lyDo NOT NULL
  cancelledAt: string;
  deltaHours: number;   // deltaTGio
  penaltyRate: number;  // tyLePhat (0, 0.5, 1)
  refundToTourist: number; // soTienHoanKhach
  platformFeeRetained: number; // soTienSanGiu
  paidToGuide: number;  // soTienTraHDV
}

// ---------- Giao dịch Thanh toán (PAYMENT_TRANSACTION) ----------
export interface Payment {
  id: string;
  bookingId: string;
  type: 'deposit' | 'final' | 'refund';
  method: PaymentMethod;
  gateway: 'VNPAY' | 'MOMO' | 'BANK_CARD' | 'CASH_DIRECT';
  amount: number;
  result: 'success' | 'fail' | 'pending';
  referenceCode: string;
  createdAt: string;
}

// ---------- Khiếu nại & Tranh chấp (DISPUTE - UC.19, UC.27) ----------
export type DisputeFaultDecision = 'GUIDE_FAULT' | 'TOURIST_FAULT';

export interface DisputeRecord {
  id: string;
  bookingId: string;
  reporterId: string;
  reporterRole: 'tourist' | 'guide';
  reasonCategory: string;
  description: string; // noiDungKhieuNai
  evidenceUrls: string[]; // bangChungUrl
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  decision?: DisputeFaultDecision;
  resolutionNote?: string; // ketQuaXuLy
  refundAmount?: number;
  guidePayoutAmount?: number;
  platformFeeAmount?: number;
  resolvedByAdminId?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ---------- Đánh giá hai chiều (REVIEW - UC.26 & Giai đoạn 4) ----------
export interface Review {
  id: string;
  bookingId: string;
  touristId: string;
  guideId: string;
  stars: number;      // 1–5 (Du khách đánh giá HDV)
  comment: string;
  createdAt: string;
  guideReply?: string;    // Phản hồi từ HDV cho Du khách
  touristRating?: number; // 1–5 (HDV đánh giá ngược lại Du khách)
  repliedAt?: string;
}

// ---------- Ví HDV & Lịch sử Biến động Số dư (GUIDE_WALLET & WALLET_TRANSACTION) ----------
export interface Wallet {
  guideId: string;
  availableBalance: number; // soDuKhaDung (VND)
  pendingBalance: number;   // soDuChoDoiSoat (VND)
  totalWithdrawn: number;   // tongDaRut (VND)
}

export type WalletTxType =
  | 'SETTLEMENT_ONLINE'     // Quyết toán đơn Online 70%: +(G - F)
  | 'SETTLEMENT_CASH'       // Quyết toán đơn Cash 70%: +(D - F)
  | 'CANCEL_COMPENSATION'   // Bồi thường khách hủy muộn: +(Penalty - Fee)
  | 'DISPUTE_SETTLEMENT'    // Phán quyết tranh chấp lỗi do khách: +(Forfeited - Fee)
  | 'WITHDRAWAL_PAYOUT';    // Rút tiền về ngân hàng: -Amount

export interface WalletTransaction {
  id: string;
  guideId: string;
  bookingId?: string;
  withdrawalId?: string;
  type: WalletTxType;
  amount: number;        // Dương (+) hoặc Âm (-)
  balanceAfter: number;
  description: string;
  formulaNote?: string;  // Minh họa công thức BR-13 (VD: "G (900.000 ₫) - Phí sàn 12% (108.000 ₫)")
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  guideId: string;
  amount: number; // Tối thiểu 200.000 ₫ (BR-09, UC.22)
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  transactionRef?: string;
  createdAt: string;
  processedAt?: string;
}

// ---------- Tin nhắn trao đổi (MESSAGE - UC.15, UC.16) ----------
export interface ChatMessage {
  id: string;
  bookingId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ---------- Thông báo hệ thống (NOTIFICATION - UC.05) ----------
export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'WALLET' | 'KYC' | 'SYSTEM';
  bookingId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ---------- Cấu hình Phí sàn (PLATFORM_FEE_CONFIG - UC.29) ----------
export interface FeeConfigHistoryItem {
  id: string;
  feeRate: number;
  effectiveNote: string;
  updatedByAdminId: string;
  updatedAt: string;
}

export interface AppConfig {
  feeRate: number; // 0.10 đến 0.15 (BR-13)
  history: FeeConfigHistoryItem[];
}
