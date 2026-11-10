// ============================================================
// DATA LAYER – LOCALBUDDY ĐÀ NẴNG
// Dữ liệu sản xuất chuẩn hóa: Chỉ giữ đúng 2 tài khoản cốt lõi (1 HDV đã duyệt KYC, 1 Admin).
// Mọi Du khách / người dùng mới tự đăng ký tài khoản (UC.01).
// Toàn bộ lịch đặt, giao dịch, khiếu nại, tin nhắn giả lập đã được xóa sạch.
// ============================================================

import {
  User,
  GuideProfile,
  TimeSlotData,
  Booking,
  Review,
  KycRecord,
  Notification,
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
  DisputeRecord,
  CancellationRecord,
  ChatMessage,
  Payment,
  AppConfig,
} from '../types';

// ---------- Danh mục chuẩn tại Đà Nẵng ----------
export const DANANG_AREAS = [
  'Cầu Rồng & Sông Hàn',
  'Bán đảo Sơn Trà',
  'Bãi biển Mỹ Khê',
  'Ngũ Hành Sơn',
  'Bà Nà Hills',
  'Phố cổ Hội An',
  'Chợ Cồn & Chợ Hàn',
  'Đèo Hải Vân & Lăng Cô',
];

export const GUIDE_LANGUAGES = [
  'Tiếng Việt',
  'Tiếng Anh',
  'Tiếng Hàn',
  'Tiếng Nhật',
  'Tiếng Trung',
  'Tiếng Pháp',
];

export const GUIDE_SKILLS = [
  'Ẩm thực bản địa',
  'Nhiếp ảnh & Check-in',
  'Lịch sử & Văn hóa Chămpa',
  'Khám phá Đà Nẵng về đêm',
  'Lái xe máy an toàn',
  'Thiên nhiên & Trekking Sơn Trà',
  'Làng nghề truyền thống',
];

export const DANANG_MEETING_SPOTS = [
  'Đầu Cầu Rồng (bờ Đông, đường Trần Hưng Đạo, Sơn Trà)',
  'Cổng chính Chợ Hàn (119 Trần Phú, Hải Châu)',
  'Công viên Biển Đông – Bãi biển Mỹ Khê (Võ Nguyên Giáp)',
  'Sảnh ga đến Quốc nội – Sân bay Quốc tế Đà Nẵng',
  'Chùa Linh Ứng – Bán đảo Sơn Trà',
  'Cổng Khu danh thắng Ngũ Hành Sơn (81 Huyền Trân Công Chúa)',
];

// ---------- 1. USERS (TAIKHOAN) ----------
// Đúng 2 tài khoản cốt lõi: 1 HDV (đã KYC) & 1 Quản trị viên
export const initialUsers: User[] = [
  // Hướng dẫn viên bản địa (Đã duyệt KYC)
  {
    id: 'u-guide-1',
    role: 'guide',
    fullName: 'Dương Đăng Huân',
    email: 'duongdanghuan.guide@gmail.com',
    phone: '0905111222',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isLocked: false,
    violationCount: 0,
    createdAt: '2026-08-01T09:00:00Z',
  },
  // Quản trị viên hệ thống
  {
    id: 'u-admin-1',
    role: 'admin',
    fullName: 'Lê Văn Hoàng',
    email: 'le3245279@gmail.com',
    phone: '0905000111',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    isLocked: false,
    violationCount: 0,
    createdAt: '2026-07-01T00:00:00Z',
  },
];

// ---------- 2. GUIDE PROFILES (HUONG_DAN_VIEN) ----------
export const initialGuides: GuideProfile[] = [
  {
    userId: 'u-guide-1',
    tagline: 'Thổ địa Đà Nẵng — Nhiếp ảnh Cầu Rồng, ẩm thực Chợ Cồn & bán đảo Sơn Trà',
    bio: 'Xin chào! Mình là Dương Đăng Huân, sinh ra và lớn lên tại quận Sơn Trà, Đà Nẵng. Với hơn 5 năm đồng hành cùng du khách trong và ngoài nước, mình chuyên thiết kế các lịch trình linh hoạt theo giờ: từ săn bình minh trên đỉnh Bàn Cờ, khám phá các quán hải sản và bánh tráng cuốn thịt heo chính gốc người Đà Nẵng tại Chợ Cồn, đến chụp ảnh nghệ thuật dọc Cầu Rồng và Phố cổ Hội An.',
    hourlyRate: 250000,
    yearsExperience: 5,
    kycStatus: 'APPROVED',
    isVerified: true,
    avgRating: 5.0,
    totalReviews: 0,
    completedTours: 0,
    responseTimeText: 'Thường phản hồi trong 10 phút',
    responseRate: 100,
    areas: ['Cầu Rồng & Sông Hàn', 'Bán đảo Sơn Trà', 'Chợ Cồn & Chợ Hàn', 'Bãi biển Mỹ Khê'],
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    skills: ['Ẩm thực bản địa', 'Nhiếp ảnh & Check-in', 'Khám phá Đà Nẵng về đêm', 'Lái xe máy an toàn'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Da_Nang_City%2C_Vietnam_-_panoramio.jpg/1280px-Da_Nang_City%2C_Vietnam_-_panoramio.jpg',
    galleryUrls: [
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Hỗ trợ chụp ảnh máy ảnh Sony Alpha miễn phí suốt hành trình',
      'Dẫn đi các quán hẻm địa phương chuẩn vị Đà Nẵng không lo chặt chém',
      'Linh hoạt tùy biến lịch trình theo sở thích và thời tiết trong ngày',
    ],
    faqs: [
      {
        question: 'Giá 250.000 ₫ / giờ đã bao gồm những gì?',
        answer: 'Bao gồm hướng dẫn viên bản địa, đồng hành lịch trình cá nhân hóa và hỗ trợ chụp ảnh.',
      },
      {
        question: 'Có hỗ trợ đón tận nơi tại khách sạn không?',
        answer: 'Nhận đón tại khách sạn khu vực Mỹ Khê, Sơn Trà, Hải Châu hoặc hẹn tại Cầu Rồng.',
      },
    ],
    bankName: 'Vietcombank - CN Đà Nẵng',
    bankAccountNumber: '0041000889988',
    bankAccountHolder: 'DUONG DANG HUAN',
  },
];

// ---------- 3. TIME SLOTS (AVAILABILITY_CALENDAR - UC.11, BR-04) ----------
export const initialSlots: TimeSlotData[] = [
  // Lịch đón khách sẵn sàng của HDV Dương Đăng Huân
  // Ngày 2026-11-12
  {
    id: 'slot-101',
    guideId: 'u-guide-1',
    date: '2026-11-12',
    startTime: '08:00',
    endTime: '11:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-102',
    guideId: 'u-guide-1',
    date: '2026-11-12',
    startTime: '14:00',
    endTime: '17:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-103',
    guideId: 'u-guide-1',
    date: '2026-11-12',
    startTime: '18:00',
    endTime: '21:00',
    status: 'AVAILABLE',
  },
  // Ngày 2026-11-13
  {
    id: 'slot-104',
    guideId: 'u-guide-1',
    date: '2026-11-13',
    startTime: '08:00',
    endTime: '12:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-105',
    guideId: 'u-guide-1',
    date: '2026-11-13',
    startTime: '14:00',
    endTime: '18:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-106',
    guideId: 'u-guide-1',
    date: '2026-11-13',
    startTime: '18:30',
    endTime: '21:30',
    status: 'AVAILABLE',
  },
  // Ngày 2026-11-14
  {
    id: 'slot-107',
    guideId: 'u-guide-1',
    date: '2026-11-14',
    startTime: '07:30',
    endTime: '11:30',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-108',
    guideId: 'u-guide-1',
    date: '2026-11-14',
    startTime: '14:00',
    endTime: '18:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-109',
    guideId: 'u-guide-1',
    date: '2026-11-14',
    startTime: '18:30',
    endTime: '21:30',
    status: 'AVAILABLE',
  },
  // Ngày 2026-11-15
  {
    id: 'slot-110',
    guideId: 'u-guide-1',
    date: '2026-11-15',
    startTime: '08:00',
    endTime: '12:00',
    status: 'AVAILABLE',
  },
  {
    id: 'slot-111',
    guideId: 'u-guide-1',
    date: '2026-11-15',
    startTime: '14:00',
    endTime: '18:00',
    status: 'AVAILABLE',
  },
];

// ---------- 4. BOOKINGS (Trống để người dùng tự đặt lịch thực tế) ----------
export const initialBookings: Booking[] = [];

// ---------- 5. DISPUTE RECORDS (Trống) ----------
export const initialDisputes: DisputeRecord[] = [];

// ---------- 6. CANCELLATION RECORDS (Trống) ----------
export const initialCancellations: CancellationRecord[] = [];

// ---------- 7. REVIEWS (Trống) ----------
export const initialReviews: Review[] = [];

// ---------- 8. KYC RECORDS (Hồ sơ đã duyệt của HDV Dương Đăng Huân) ----------
export const initialKycRecords: KycRecord[] = [
  {
    id: 'kyc-100',
    guideId: 'u-guide-1',
    idNumber: '048095006789',
    bankName: 'Vietcombank - CN Đà Nẵng',
    bankAccountNumber: '0041000889988',
    bankAccountHolder: 'DUONG DANG HUAN',
    documents: [
      {
        id: 'doc-10',
        docType: 'CCCD_FRONT',
        name: 'CCCD gắn chip mặt trước (Dương Đăng Huân)',
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'doc-11',
        docType: 'GUIDE_CARD',
        name: 'Thẻ Hướng dẫn viên Du lịch Quốc tế – Sở Du lịch Đà Nẵng',
        url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80',
      },
    ],
    status: 'APPROVED',
    submittedAt: '2026-08-01T10:00:00Z',
    reviewedAt: '2026-08-02T09:00:00Z',
    reviewNote: 'Hồ sơ hợp lệ, xác thực thẻ HDV Sở Du lịch Đà Nẵng.',
  },
];

// ---------- 9. WALLETS & TRANSACTIONS ----------
export const initialWallets: Wallet[] = [
  {
    guideId: 'u-guide-1',
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
  },
];

export const initialWalletTransactions: WalletTransaction[] = [];

export const initialWithdrawals: WithdrawalRequest[] = [];

// ---------- 10. CHAT MESSAGES ----------
export const initialMessages: ChatMessage[] = [];

// ---------- 11. NOTIFICATIONS ----------
export const initialNotifications: Notification[] = [];

// ---------- 12. PAYMENTS ----------
export const initialPayments: Payment[] = [];

// ---------- 13. APP CONFIG (PLATFORM_FEE_CONFIG - UC.29, BR-13) ----------
export const initialAppConfig: AppConfig = {
  feeRate: 0.12, // 12% mặc định (trong dải 10% – 15%)
  history: [
    {
      id: 'fee-1',
      feeRate: 0.10,
      effectiveNote: 'Mức phí ưu đãi giai đoạn ra mắt tại Đà Nẵng (10%)',
      updatedByAdminId: 'u-admin-1',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'fee-2',
      feeRate: 0.12,
      effectiveNote: 'Điều chỉnh phí hoa hồng vận hành tiêu chuẩn mùa cao điểm (12%)',
      updatedByAdminId: 'u-admin-1',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ],
};
