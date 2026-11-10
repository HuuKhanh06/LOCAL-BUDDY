// ============================================================
// CONTEXT & DATA ACCESS LAYER – LOCALBUDDY ĐÀ NẴNG
// Lưu trữ bền vững trong localStorage + Thực thi chính xác 29 Use Cases & BR-01 → BR-13
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Booking,
  TimeSlotData,
  Review,
  User,
  UserRole,
  GuideProfile,
  WithdrawalRequest,
  KycRecord,
  KycDocument,
  Notification,
  Wallet,
  WalletTransaction,
  DisputeRecord,
  DisputeFaultDecision,
  CancellationRecord,
  ChatMessage,
  Payment,
  PaymentStatus,
  FeeConfigHistoryItem,
} from '../types';
import {
  initialUsers,
  initialGuides,
  initialSlots,
  initialBookings,
  initialDisputes,
  initialCancellations,
  initialReviews,
  initialKycRecords,
  initialWallets,
  initialWalletTransactions,
  initialWithdrawals,
  initialMessages,
  initialNotifications,
  initialPayments,
  initialAppConfig,
} from '../data/mockData';
import { calcPenaltySplit } from '../features/payment/calc';
import { calcDeltaHours } from '../utils/time';
import { formatMoney } from '../utils/money';
import {
  isSupabaseConfigured,
  uploadFileToSupabase,
  subscribeToLocalBuddyRealtime,
  fetchCloudSyncState,
  broadcastCloudSync,
  persistCloudSyncKey,
  StorageBucketName,
} from '../lib/supabase';

const STORAGE_KEY = 'localbuddy_danang_clean_v1';

export interface ActionResult {
  ok: boolean;
  message: string;
  bookingId?: string;
}

export interface BookingContextType {
  // Cloud & Storage status
  isCloudConnected: boolean;
  uploadFile: (
    bucket: StorageBucketName,
    file: File
  ) => Promise<{ ok: boolean; url: string; message: string }>;

  // Entities
  bookings: Booking[];
  slots: TimeSlotData[];
  reviews: Review[];
  verifiedGuides: { user: User; profile: GuideProfile }[];
  allGuides: { user: User; profile: GuideProfile }[];
  allUsers: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  switchRoleQuickly: (role: UserRole, specificUserId?: string) => User;

  // Auth & Profile (UC.01, UC.02, UC.03, UC.04, UC.10)
  login: (emailOrPhone: string, password?: string, requiredRole?: UserRole) => ActionResult;
  registerAccount: (params: {
    role: 'tourist' | 'guide';
    fullName: string;
    email: string;
    phone: string;
    nationality?: string;
    hourlyRate?: number;
    areas?: string[];
    languages?: string[];
  }) => ActionResult;
  logout: () => void;
  updateUserProfile: (params: {
    userId: string;
    fullName: string;
    phone: string;
    nationality?: string;
    preferredLanguage?: string;
    avatarUrl?: string;
  }) => ActionResult;

  // Config & Fee (UC.29)
  feeRate: number;
  feeHistory: FeeConfigHistoryItem[];
  updateFeeRate: (newRate: number, note?: string) => ActionResult;

  // KYC, Wallet, Disputes, Messages, Notifications
  kycRecords: KycRecord[];
  wallets: Wallet[];
  walletBalance: number; // Số dư khả dụng của Guide hiện tại
  walletTransactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  disputes: DisputeRecord[];
  cancellations: CancellationRecord[];
  messages: ChatMessage[];
  payments: Payment[];
  notifications: Notification[];

  // Helpers
  getBookingById: (id: string) => Booking | undefined;
  getGuideById: (guideId: string) => { user: User; profile: GuideProfile } | undefined;
  getUserById: (userId: string) => User | undefined;
  getWalletByGuideId: (guideId: string) => Wallet;
  getDisputeByBookingId: (bookingId: string) => DisputeRecord | undefined;
  getReviewByBookingId: (bookingId: string) => Review | undefined;

  // Notifications & Chat (UC.05, UC.15, UC.16)
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userId?: string) => void;
  sendMessage: (receiverId: string, content: string, bookingId?: string) => ActionResult;

  // Tourist Actions (UC.12, UC.14, UC.18, UC.19, UC.20, UC.24, UC.26)
  createBooking: (params: {
    guideId: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    guestCount: number;
    meetingLocation: string;
    specialRequests: string;
    slotIds?: string[];
  }) => Booking;
  payDeposit: (
    bookingId: string,
    isSuccess: boolean,
    gateway?: 'VNPAY' | 'MOMO' | 'BANK_CARD',
    cancelImmediatelyOnFail?: boolean
  ) => ActionResult;
  expireDeposit: (bookingId: string) => void;
  expirePendingBooking: (bookingId: string) => void;
  autoConfirmCompletionTimeout: (bookingId: string) => void;
  cancelBooking: (bookingId: string, reason?: string, customDeltaHours?: number) => ActionResult;
  confirmCompletion: (bookingId: string) => ActionResult;
  payFinal: (
    bookingId: string,
    method: 'ONLINE' | 'CASH',
    isSuccess: boolean,
    gateway?: 'VNPAY' | 'MOMO' | 'BANK_CARD' | 'CASH_DIRECT'
  ) => ActionResult;
  submitDispute: (
    bookingId: string,
    reasonCategory: string,
    description?: string,
    evidenceUrls?: string[]
  ) => ActionResult;
  submitReview: (bookingId: string, stars: number, comment: string) => ActionResult;
  replyToReview: (
    bookingId: string,
    touristRating: number,
    replyComment: string
  ) => ActionResult;

  // Guide Actions (UC.09, UC.10, UC.11, UC.13, UC.17, UC.21, UC.22, UC.25)
  acceptBooking: (bookingId: string) => ActionResult;
  rejectBooking: (bookingId: string, reason?: string) => ActionResult;
  requestCompletion: (bookingId: string) => ActionResult;
  confirmCashPayment: (bookingId: string) => ActionResult;
  guideCancelBooking: (bookingId: string, reason?: string) => ActionResult;
  toggleSlotAvailability: (slotId: string) => ActionResult;
  addAvailabilitySlot: (params: {
    guideId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => ActionResult;
  updateAvailabilitySlot: (params: {
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => ActionResult;
  removeAvailabilitySlot: (slotId: string) => ActionResult;
  updateGuidePrice: (
    guideId: string,
    newRate: number,
    newBio?: string,
    extra?: {
      tagline?: string;
      areas?: string[];
      languages?: string[];
      skills?: string[];
      yearsExperience?: number;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountHolder?: string;
    }
  ) => ActionResult;
  submitKycApplication: (params: {
    guideId: string;
    idNumber: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    documents: KycDocument[];
  }) => ActionResult;
  requestWithdrawal: (
    amount: number,
    bankInfo?: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }
  ) => ActionResult;

  // Admin Actions (UC.06, UC.10, UC.23, UC.27, UC.28, UC.29)
  toggleUserLock: (userId: string) => void;
  revokeGuideVerification: (userId: string) => void;
  addVerifiedGuide: (userId: string) => void;
  approveKyc: (guideId: string, note?: string) => void;
  rejectKyc: (guideId: string, note?: string) => void;
  approveWithdrawal: (id: string, transactionRef?: string, adminNote?: string) => void;
  rejectWithdrawal: (id: string, adminNote?: string) => void;
  resolveDispute: (
    bookingId: string,
    adminNote: string,
    decision?: DisputeFaultDecision
  ) => ActionResult;
  adminReconcilePayment: (bookingId: string, adminNote?: string) => ActionResult;

  // Demo & Reset Utilities
  resetAllDataToDefault: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface StoredState {
  users: User[];
  guideProfiles: GuideProfile[];
  slots: TimeSlotData[];
  bookings: Booking[];
  disputes: DisputeRecord[];
  cancellations: CancellationRecord[];
  reviews: Review[];
  kycRecords: KycRecord[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  messages: ChatMessage[];
  notifications: Notification[];
  payments: Payment[];
  feeRate: number;
  feeHistory: FeeConfigHistoryItem[];
  currentUserId: string | null;
}

function getDefaultState(): StoredState {
  return {
    users: initialUsers,
    guideProfiles: initialGuides,
    slots: initialSlots,
    bookings: initialBookings,
    disputes: initialDisputes,
    cancellations: initialCancellations,
    reviews: initialReviews,
    kycRecords: initialKycRecords,
    wallets: initialWallets,
    walletTransactions: initialWalletTransactions,
    withdrawals: initialWithdrawals,
    messages: initialMessages,
    notifications: initialNotifications,
    payments: initialPayments,
    feeRate: initialAppConfig.feeRate,
    feeHistory: initialAppConfig.history,
    currentUserId: null,
  };
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!parsed.users || !parsed.bookings || !parsed.guideProfiles) {
      return getDefaultState();
    }
    return {
      ...getDefaultState(),
      ...parsed,
    };
  } catch {
    return getDefaultState();
  }
}

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StoredState>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const mergeCloudData = (prev: StoredState, incoming: Partial<StoredState>): StoredState => {
    const next = { ...prev };

    if (incoming.bookings && incoming.bookings.length > 0) {
      const existingMap = new Map(next.bookings.map((b) => [b.id, b]));
      for (const b of incoming.bookings) {
        existingMap.set(b.id, b);
      }
      next.bookings = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (incoming.notifications && incoming.notifications.length > 0) {
      const existingMap = new Map(next.notifications.map((n) => [n.id, n]));
      for (const n of incoming.notifications) {
        existingMap.set(n.id, n);
      }
      next.notifications = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (incoming.slots && incoming.slots.length > 0) {
      const existingMap = new Map(next.slots.map((s) => [s.id, s]));
      for (const s of incoming.slots) {
        existingMap.set(s.id, s);
      }
      next.slots = Array.from(existingMap.values());
    }

    if (incoming.wallets && incoming.wallets.length > 0) {
      const existingMap = new Map(next.wallets.map((w) => [w.guideId, w]));
      for (const w of incoming.wallets) {
        existingMap.set(w.guideId, w);
      }
      next.wallets = Array.from(existingMap.values());
    }

    if (incoming.walletTransactions && incoming.walletTransactions.length > 0) {
      const existingMap = new Map(next.walletTransactions.map((tx) => [tx.id, tx]));
      for (const tx of incoming.walletTransactions) {
        existingMap.set(tx.id, tx);
      }
      next.walletTransactions = Array.from(existingMap.values());
    }

    if (incoming.kycRecords && incoming.kycRecords.length > 0) {
      const existingMap = new Map(next.kycRecords.map((k) => [k.id, k]));
      for (const k of incoming.kycRecords) {
        existingMap.set(k.id, k);
      }
      next.kycRecords = Array.from(existingMap.values());
    }

    if (incoming.disputes && incoming.disputes.length > 0) {
      const existingMap = new Map(next.disputes.map((d) => [d.id, d]));
      for (const d of incoming.disputes) {
        existingMap.set(d.id, d);
      }
      next.disputes = Array.from(existingMap.values());
    }

    if (incoming.users && incoming.users.length > 0) {
      const existingMap = new Map(next.users.map((u) => [u.id, u]));
      for (const u of incoming.users) {
        existingMap.set(u.id, u);
      }
      next.users = Array.from(existingMap.values());
    }

    if (incoming.guideProfiles && incoming.guideProfiles.length > 0) {
      const existingMap = new Map(next.guideProfiles.map((gp) => [gp.userId, gp]));
      for (const gp of incoming.guideProfiles) {
        existingMap.set(gp.userId, gp);
      }
      next.guideProfiles = Array.from(existingMap.values());
    }

    return next;
  };

  const syncToCloud = (partial: Partial<StoredState>) => {
    void broadcastCloudSync(partial);
    for (const [key, val] of Object.entries(partial)) {
      if (val !== undefined) {
        void persistCloudSyncKey(key, val);
      }
    }
  };

  // 1. Tải trạng thái đồng bộ từ Supabase Cloud khi mở trang web
  useEffect(() => {
    let isMounted = true;
    const loadCloudData = async () => {
      if (!isSupabaseConfigured) return;
      const cloudData = await fetchCloudSyncState();
      if (!cloudData || !isMounted) return;
      setState((prev) => mergeCloudData(prev, cloudData));
    };
    void loadCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Đăng ký kênh Supabase Realtime (Cả Broadcast và Postgres Changes)
  useEffect(() => {
    const handleRemoteChange = (incoming: any) => {
      if (!incoming) return;
      setState((prev) => mergeCloudData(prev, incoming));
    };

    const unsubscribe = subscribeToLocalBuddyRealtime(
      async (tablePayload) => {
        // Khi có thay đổi bảng cloud_shared_sync hoặc booking/notification
        const cloudData = await fetchCloudSyncState();
        if (cloudData) {
          handleRemoteChange(cloudData);
        }
      },
      (broadcastPayload) => {
        // Nhận trực tiếp qua Realtime Broadcast (<100ms) từ thiết bị khác
        handleRemoteChange(broadcastPayload);
      }
    );
    return unsubscribe;
  }, []);

  const currentUser =
    state.users.find((u) => u.id === state.currentUserId) || null;

  const setCurrentUser = (u: User | null) => {
    setState((prev) => ({ ...prev, currentUserId: u ? u.id : null }));
  };

  const switchRoleQuickly = (role: UserRole, specificUserId?: string): User => {
    const target =
      (specificUserId && state.users.find((u) => u.id === specificUserId)) ||
      state.users.find((u) => u.role === role) ||
      state.users[0];
    setCurrentUser(target);
    return target;
  };

  // Ghép User + GuideProfile
  const allGuides = state.guideProfiles
    .map((profile) => {
      const user = state.users.find((u) => u.id === profile.userId);
      if (!user) return null;
      return { user, profile };
    })
    .filter((item): item is { user: User; profile: GuideProfile } => item !== null);

  // Chỉ các HDV đã xác minh KYC (APPROVED) và không bị khóa tài khoản mới hiển thị cho Du khách (BR-01)
  const verifiedGuides = allGuides.filter(
    (g) => g.profile.isVerified && g.profile.kycStatus === 'APPROVED' && !g.user.isLocked
  );

  const getBookingById = (id: string) => state.bookings.find((b) => b.id === id);
  const toSlug = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getGuideById = (idOrSlug: string) =>
    allGuides.find(
      (g) =>
        g.user.id === idOrSlug ||
        toSlug(g.user.fullName) === idOrSlug ||
        g.user.fullName.toLowerCase() === idOrSlug.toLowerCase()
    );
  const getUserById = (userId: string) => state.users.find((u) => u.id === userId);
  const getDisputeByBookingId = (bookingId: string) =>
    state.disputes.find((d) => d.bookingId === bookingId);
  const getReviewByBookingId = (bookingId: string) =>
    state.reviews.find((r) => r.bookingId === bookingId);

  const getWalletByGuideId = (guideId: string): Wallet => {
    return (
      state.wallets.find((w) => w.guideId === guideId) || {
        guideId,
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0,
      }
    );
  };

  const activeGuideId =
    currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const walletBalance = getWalletByGuideId(activeGuideId).availableBalance;

  // Helper tạo thông báo (UC.05)
  const pushNotification = (
    prevNotifications: Notification[],
    notif: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ): Notification[] => [
    {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    ...prevNotifications,
  ];

  const pushNotifications = (
    prevNotifications: Notification[],
    notifs: Omit<Notification, 'id' | 'isRead' | 'createdAt'>[]
  ): Notification[] => [
    ...notifs.map((notif, idx) => ({
      ...notif,
      id: `notif-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    })),
    ...prevNotifications,
  ];

  // ── 1. AUTH & USER PROFILE (UC.01, UC.02, UC.03, UC.04) ──────
  const login = (
    emailOrPhone: string,
    _password?: string,
    requiredRole?: UserRole
  ): ActionResult => {
    const clean = emailOrPhone.trim().toLowerCase();
    const found = state.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.phone.replace(/\s+/g, '') === clean
    );
    if (!found) {
      return {
        ok: false,
        message: 'Không tìm thấy tài khoản với Email hoặc Số điện thoại này.',
      };
    }
    if (found.isLocked) {
      return {
        ok: false,
        message:
          'Tài khoản này đã bị khóa do vi phạm chính sách nền tảng. Vui lòng liên hệ Quản trị viên.',
      };
    }
    if (requiredRole && found.role !== requiredRole) {
      return {
        ok: false,
        message: `Tài khoản này không có quyền truy cập cổng ${
          requiredRole === 'admin' ? 'Quản trị viên' : requiredRole === 'guide' ? 'Hướng dẫn viên' : 'Du khách'
        }.`,
      };
    }
    setCurrentUser(found);
    return { ok: true, message: `Chào mừng ${found.fullName} quay trở lại!` };
  };

  const registerAccount = (params: {
    role: 'tourist' | 'guide';
    fullName: string;
    email: string;
    phone: string;
    nationality?: string;
    hourlyRate?: number;
    areas?: string[];
    languages?: string[];
  }): ActionResult => {
    const cleanEmail = params.email.trim().toLowerCase();
    const exists = state.users.some(
      (u) => u.email.toLowerCase() === cleanEmail || u.phone === params.phone.trim()
    );
    if (exists) {
      return {
        ok: false,
        message: 'Email hoặc Số điện thoại này đã được đăng ký trên hệ thống.',
      };
    }

    const newUserId = `u-${params.role}-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: newUserId,
      role: params.role,
      fullName: params.fullName.trim(),
      email: cleanEmail,
      phone: params.phone.trim(),
      avatarUrl:
        params.role === 'guide'
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      isLocked: false,
      violationCount: 0,
      nationality: params.nationality || 'Việt Nam',
      preferredLanguage: 'Tiếng Việt',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const nextUsers = [...prev.users, newUser];
      let nextProfiles = prev.guideProfiles;
      let nextWallets = prev.wallets;
      let nextNotifs = prev.notifications;

      if (params.role === 'guide') {
        const rate = Math.min(500000, Math.max(80000, params.hourlyRate || 200000));
        const newProfile: GuideProfile = {
          userId: newUserId,
          tagline: 'Hướng dẫn viên bản địa tại Đà Nẵng (Chờ xác thực hồ sơ KYC)',
          bio: `Xin chào, mình là ${newUser.fullName} – Hướng dẫn viên bản địa tại Đà Nẵng.`,
          hourlyRate: rate,
          yearsExperience: 1,
          kycStatus: 'NOT_SUBMITTED',
          isVerified: false,
          avgRating: 0,
          totalReviews: 0,
          completedTours: 0,
          responseTimeText: 'Mới tham gia',
          responseRate: 100,
          areas: params.areas?.length ? params.areas : ['Cầu Rồng & Sông Hàn', 'Bãi biển Mỹ Khê'],
          languages: params.languages?.length ? params.languages : ['Tiếng Việt', 'Tiếng Anh'],
          skills: ['Ẩm thực bản địa', 'Nhiếp ảnh & Check-in'],
          avatarUrl: newUser.avatarUrl,
          coverUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&auto=format&fit=crop&q=80',
          galleryUrls: [],
          highlights: ['Đồng hành khám phá Đà Nẵng theo giờ linh hoạt'],
          faqs: [],
        };
        nextProfiles = [...prev.guideProfiles, newProfile];
        nextWallets = [
          ...prev.wallets,
          { guideId: newUserId, availableBalance: 0, pendingBalance: 0, totalWithdrawn: 0 },
        ];
        nextNotifs = pushNotification(nextNotifs, {
          userId: newUserId,
          title: 'Chào mừng HDV mới! Vui lòng nộp hồ sơ KYC (BR-01)',
          content:
            'Để hồ sơ của bạn hiển thị trên danh sách tìm kiếm và mở lịch nhận khách tại Đà Nẵng, vui lòng hoàn tất nộp hồ sơ xác thực KYC.',
          type: 'KYC',
          actionUrl: '/guide/kyc',
        });
      } else {
        nextNotifs = pushNotification(nextNotifs, {
          userId: newUserId,
          title: 'Chào mừng bạn đến với LocalBuddy Đà Nẵng!',
          content:
            'Khám phá ngay các Hướng dẫn viên bản địa đã xác minh KYC tại Đà Nẵng và đặt lịch theo giờ linh hoạt.',
          type: 'SYSTEM',
          actionUrl: '/guides',
        });
      }

      syncToCloud({
        users: nextUsers,
        guideProfiles: nextProfiles,
        wallets: nextWallets,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        users: nextUsers,
        guideProfiles: nextProfiles,
        wallets: nextWallets,
        notifications: nextNotifs,
        currentUserId: newUserId,
      };
    });

    return {
      ok: true,
      message:
        params.role === 'guide'
          ? 'Đăng ký tài khoản Hướng dẫn viên thành công! Vui lòng nộp hồ sơ KYC để bắt đầu nhận khách.'
          : 'Đăng ký tài khoản Du khách thành công!',
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserProfile = (params: {
    userId: string;
    fullName: string;
    phone: string;
    nationality?: string;
    preferredLanguage?: string;
    avatarUrl?: string;
  }): ActionResult => {
    if (!params.fullName.trim() || !params.phone.trim()) {
      return { ok: false, message: 'Họ tên và số điện thoại không được để trống.' };
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === params.userId
          ? {
              ...u,
              fullName: params.fullName.trim(),
              phone: params.phone.trim(),
              nationality: params.nationality ?? u.nationality,
              preferredLanguage: params.preferredLanguage ?? u.preferredLanguage,
              avatarUrl: params.avatarUrl || u.avatarUrl,
            }
          : u
      ),
    }));
    return { ok: true, message: 'Đã cập nhật thông tin cá nhân thành công!' };
  };

  // ── 2. CẤU HÌNH PHÍ SÀN (UC.29, BR-13) ──────────────────────
  const updateFeeRate = (newRate: number, note?: string): ActionResult => {
    const rounded = Math.round(newRate * 1000) / 1000;
    if (rounded < 0.10 || rounded > 0.15) {
      return {
        ok: false,
        message: 'Theo quy tắc BR-13, tỷ lệ phí sàn phải nằm trong khoảng từ 10% đến 15%.',
      };
    }
    const item: FeeConfigHistoryItem = {
      id: `fee-${Date.now()}`,
      feeRate: rounded,
      effectiveNote:
        note?.trim() ||
        `Cập nhật mức phí hoa hồng nền tảng sang ${(rounded * 100).toFixed(0)}% (chỉ áp dụng cho đơn đặt lịch mới)`,
      updatedByAdminId: currentUser?.id || 'u-admin-1',
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      feeRate: rounded,
      feeHistory: [item, ...prev.feeHistory],
    }));
    return {
      ok: true,
      message: `Đã lưu cấu hình phí sàn ${(rounded * 100).toFixed(0)}%. Các đơn đặt lịch cũ vẫn giữ nguyên tỷ lệ phí lúc tạo đơn.`,
    };
  };

  // ── 3. THÔNG BÁO & TIN NHẮN (UC.05, UC.15, UC.16) ───────────
  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  };

  const markAllNotificationsAsRead = (userId?: string) => {
    const targetUser = userId || currentUser?.id;
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        !targetUser || n.userId === targetUser ? { ...n, isRead: true } : n
      ),
    }));
  };

  const sendMessage = (
    receiverId: string,
    content: string,
    bookingId?: string
  ): ActionResult => {
    if (!content.trim()) {
      return { ok: false, message: 'Vui lòng nhập nội dung tin nhắn.' };
    }
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng ký hoặc đăng nhập tài khoản để gửi tin nhắn.' };
    }
    const senderId = currentUser.id;
    const senderName = currentUser.fullName;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId,
      receiverId,
      content: content.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
      notifications: pushNotification(prev.notifications, {
        userId: receiverId,
        title: `Tin nhắn mới từ ${senderName}`,
        content: content.trim().slice(0, 90),
        type: 'BOOKING',
        bookingId,
        actionUrl:
          prev.users.find((u) => u.id === receiverId)?.role === 'guide'
            ? '/guide/tin-nhan'
            : '/tin-nhan',
      }),
    }));
    return { ok: true, message: 'Đã gửi tin nhắn.' };
  };

  // ── 4. ĐẶT LỊCH & KHÓA NGUYÊN TỬ HOLD (UC.12, UC.13, UC.14, BR-03, BR-04, BR-05) ──
  /**
   * UC.12 & BR-04:
   * Khi Du khách tạo yêu cầu đặt lịch (PENDING), khung giờ trên lịch của HDV VẪN GIỮ LÀ AVAILABLE.
   * Chỉ khi HDV bấm "Chấp nhận" (UC.13) thì mới khóa nguyên tử sang HOLD trong 15 phút!
   */
  const createBooking = (params: {
    guideId: string;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    guestCount: number;
    meetingLocation: string;
    specialRequests: string;
    slotIds?: string[];
  }): Booking => {
    const guideItem = getGuideById(params.guideId);
    const hourlyRate = guideItem?.profile.hourlyRate || 250000;
    const total = Math.round(hourlyRate * params.hours);
    const deposit = Math.round(total * 0.3);
    const remaining = total - deposit;
    const currentFeeRate = state.feeRate; // Snapshot tỷ lệ phí sàn tại thời điểm tạo đơn (BR-13)

    const nextIdNumber = 1000 + state.bookings.length + 1;
    const newId = `BK-${nextIdNumber}`;
    const touristId = currentUser ? currentUser.id : `guest-${Date.now()}`;
    const touristName = currentUser?.fullName || 'Du khách';

    // Tìm các slot tương ứng nhưng KHÔNG đổi sang HOLD ở bước PENDING (theo đúng BR-04)
    const matchedSlots = state.slots.filter(
      (s) =>
        s.guideId === params.guideId &&
        s.date === params.date &&
        s.startTime === params.startTime
    );

    const newBooking: Booking = {
      id: newId,
      touristId,
      guideId: params.guideId,
      slotIds: params.slotIds?.length
        ? params.slotIds
        : matchedSlots.map((s) => s.id),
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      hours: params.hours,
      guestCount: params.guestCount,
      meetingLocation: params.meetingLocation.trim(),
      specialRequests: params.specialRequests.trim(),
      bookingStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      hourlyRateSnapshot: hourlyRate,
      feeRate: currentFeeRate,
      totalAmount: total,
      depositAmount: deposit,
      remainingAmount: remaining,
      createdAt: new Date().toISOString(),
      pendingExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Hạn 24h HDV phản hồi (BR-03)
    };

    const adminUser = state.users.find((u) => u.role === 'admin') || { id: 'u-admin-1' };
    const guideUser = state.users.find((u) => u.id === params.guideId);
    const guideName = guideUser?.fullName || 'Thổ địa';

    const newNotifs: Omit<Notification, 'id' | 'isRead' | 'createdAt'>[] = [
      // 1. Cho Hướng dẫn viên (HDV)
      {
        userId: params.guideId,
        title: `Yêu cầu đặt lịch mới ${newId} từ ${touristName}`,
        content: `Khung giờ ${params.date} (${params.startTime} – ${params.endTime}) • ${params.guestCount} khách • Điểm hẹn: ${params.meetingLocation}. Vui lòng phản hồi trong 24 giờ (BR-03).`,
        type: 'BOOKING',
        bookingId: newId,
        actionUrl: '/guide/don-den',
      },
      // 2. Cho Quản trị viên (Admin)
      {
        userId: adminUser.id,
        title: `Đơn đặt lịch mới ${newId} cần giám sát`,
        content: `Du khách ${touristName} vừa gửi yêu cầu đặt Thổ địa ${guideName} (${params.date}, ${params.startTime}–${params.endTime}) • ${params.guestCount} khách. Chờ HDV phản hồi 24h.`,
        type: 'BOOKING',
        bookingId: newId,
        actionUrl: '/admin/bao-cao?tab=monitoring',
      },
      // 3. Cho Du khách (Tourist)
      {
        userId: touristId,
        title: `Đã gửi yêu cầu đặt lịch ${newId}`,
        content: `Yêu cầu đặt Thổ địa ${guideName} (${params.date}, ${params.startTime}–${params.endTime}) đã gửi thành công. Thổ địa có 24 giờ để phản hồi.`,
        type: 'BOOKING',
        bookingId: newId,
        actionUrl: `/don/${newId}`,
      },
    ];

    setState((prev) => {
      const nextBookings = [newBooking, ...prev.bookings];
      const nextNotifs = pushNotifications(prev.notifications, newNotifs);
      syncToCloud({ bookings: nextBookings, notifications: nextNotifs });
      return {
        ...prev,
        bookings: nextBookings,
        notifications: nextNotifs,
      };
    });

    return newBooking;
  };

  /**
   * UC.13 & BR-04:
   * HDV bấm "Chấp nhận" đơn PENDING -> Kiểm tra nguyên tử (Atomic Check):
   * Nếu khung giờ đã bị HOLD hoặc BUSY bởi đơn khác thì chặn và báo lỗi.
   * Nếu đang AVAILABLE -> Chuyển slot sang HOLD (15 phút), BookingStatus = WAITING_PAYMENT, PaymentStatus = WAITING_DEPOSIT.
   */
  const acceptBooking = (bookingId: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) {
      return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };
    }
    if (target.bookingStatus !== 'PENDING') {
      return { ok: false, message: 'Đơn đặt lịch không còn ở trạng thái chờ phản hồi.' };
    }

    // Kiểm tra xung đột lịch nguyên tử (Atomic Lock Check - NB-01, BR-04)
    const conflictingSlot = state.slots.find(
      (s) =>
        s.guideId === target.guideId &&
        s.date === target.date &&
        s.startTime === target.startTime &&
        s.status !== 'AVAILABLE' &&
        s.bookingId !== bookingId
    );

    if (conflictingSlot) {
      return {
        ok: false,
        message: `Khung giờ ${target.startTime} – ${target.endTime} ngày ${target.date} hiện đang bị khóa (${conflictingSlot.status}) bởi đơn ${conflictingSlot.bookingId || 'khác'}. Không thể chấp nhận trùng lịch!`,
      };
    }

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const guideName =
      state.users.find((u) => u.id === target.guideId)?.fullName || 'Hướng dẫn viên';

    setState((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'WAITING_PAYMENT' as const,
              paymentStatus: 'WAITING_DEPOSIT' as const,
              acceptedAt: new Date().toISOString(),
              holdExpiresAt,
            }
          : b
      );
      const nextSlots = prev.slots.map((s) =>
        s.guideId === target.guideId &&
        s.date === target.date &&
        s.startTime === target.startTime
          ? { ...s, status: 'HOLD' as const, bookingId, holdExpiresAt }
          : s
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `HDV ${guideName} đã chấp nhận đơn ${bookingId}!`,
          content: `Khung giờ đang được giữ nguyên tử (HOLD) trong 15 phút. Vui lòng đặt cọc 30% (${formatMoney(
            target.depositAmount
          )}) để xác nhận lịch.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}/dat-coc`,
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} đã được HDV ${guideName} chấp nhận`,
          content: `Khung giờ đang HOLD 15 phút chờ du khách đặt cọc 30% (${formatMoney(target.depositAmount)}).`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({ bookings: nextBookings, slots: nextSlots, notifications: nextNotifs });

      return {
        ...prev,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Đã chấp nhận đơn ${bookingId}! Hệ thống đang khóa giữ chỗ (HOLD) 15 phút chờ khách đặt cọc 30%.`,
    };
  };

  /**
   * UC.13: HDV từ chối đơn PENDING -> CANCELLED + UNPAID, slot giữ nguyên AVAILABLE
   */
  const rejectBooking = (bookingId: string, reason?: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn.' };

    const rejectReason =
      reason?.trim() || 'Hướng dẫn viên bận lịch đột xuất trong khung giờ này.';
    const cancelRecord: CancellationRecord = {
      id: `CAN-${Date.now()}`,
      bookingId,
      cancelledByUserId: target.guideId,
      cancellationType: 'GUIDE_REJECT',
      reason: rejectReason,
      cancelledAt: new Date().toISOString(),
      deltaHours: calcDeltaHours(target.date, target.startTime),
      penaltyRate: 0,
      refundToTourist: 0,
      platformFeeRetained: 0,
      paidToGuide: 0,
    };

    setState((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'CANCELLED' as const,
              paymentStatus: 'UNPAID' as const,
              cancelledAt: new Date().toISOString(),
              cancelReason: rejectReason,
              cancellationType: 'GUIDE_REJECT' as const,
            }
          : b
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `Đơn đặt lịch ${bookingId} đã bị từ chối`,
          content: `Lý do từ HDV: "${rejectReason}". Bạn chưa bị trừ bất kỳ khoản phí nào.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `HDV đã từ chối đơn ${bookingId}`,
          content: `Lý do: "${rejectReason}". Đơn đã chuyển sang trạng thái CANCELLED.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({ bookings: nextBookings, notifications: nextNotifs });

      return {
        ...prev,
        bookings: nextBookings,
        cancellations: [cancelRecord, ...prev.cancellations],
        notifications: nextNotifs,
      };
    });

    return { ok: true, message: `Đã từ chối đơn ${bookingId}.` };
  };

  /**
   * UC.14 & FR 4.3–4.5:
   * Thanh toán cọc 30%:
   * - Thành công: BookingStatus = CONFIRMED, PaymentStatus = DEPOSITED, Slot HOLD -> BUSY.
   * - Thất bại (Ngoại lệ 1 của UC.14): Nếu cancelImmediatelyOnFail = true -> CANCELLED + UNPAID, Slot HOLD -> AVAILABLE.
   *   Nếu là lỗi mạng tạm thời (cancelImmediatelyOnFail = false) -> Cho phép thử lại trong thời gian HOLD 15 phút còn lại.
   */
  const payDeposit = (
    bookingId: string,
    isSuccess: boolean,
    gateway: 'VNPAY' | 'MOMO' | 'BANK_CARD' = 'VNPAY',
    cancelImmediatelyOnFail = false
  ): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };

    const paymentRecord: Payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      type: 'deposit',
      method: 'ONLINE',
      gateway,
      amount: target.depositAmount,
      result: isSuccess ? 'success' : 'fail',
      referenceCode: `${gateway}-DN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    if (!isSuccess) {
      if (cancelImmediatelyOnFail) {
        const cancelRec: CancellationRecord = {
          id: `CAN-${Date.now()}`,
          bookingId,
          cancelledByUserId: target.touristId,
          cancellationType: 'SYSTEM_TIMEOUT',
          reason: 'Giao dịch thanh toán tiền cọc 30% bị từ chối/thất bại trên cổng thanh toán (UC.14 Ngoại lệ 1).',
          cancelledAt: new Date().toISOString(),
          deltaHours: calcDeltaHours(target.date, target.startTime),
          penaltyRate: 0,
          refundToTourist: 0,
          platformFeeRetained: 0,
          paidToGuide: 0,
        };

        setState((prev) => ({
          ...prev,
          payments: [paymentRecord, ...prev.payments],
          cancellations: [cancelRec, ...prev.cancellations],
          bookings: prev.bookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  bookingStatus: 'CANCELLED',
                  paymentStatus: 'UNPAID',
                  cancelledAt: new Date().toISOString(),
                  cancelReason: cancelRec.reason,
                  cancellationType: 'SYSTEM_TIMEOUT',
                }
              : b
          ),
          slots: prev.slots.map((s) =>
            (s.bookingId === bookingId ||
              (s.guideId === target.guideId &&
                s.date === target.date &&
                s.startTime === target.startTime))
              ? { ...s, status: 'AVAILABLE', bookingId: undefined, holdExpiresAt: undefined }
              : s
          ),
          notifications: pushNotification(prev.notifications, {
            userId: target.touristId,
            title: `Giao dịch đặt cọc đơn ${bookingId} thất bại — Đơn đã hủy`,
            content:
              'Theo quy định UC.14, giao dịch bị từ chối nên hệ thống đã hủy đơn và giải phóng khung giờ về trạng thái Trống (AVAILABLE).',
            type: 'PAYMENT',
            bookingId,
            actionUrl: `/don/${bookingId}`,
          }),
        }));

        return {
          ok: false,
          message:
            'Giao dịch thanh toán cọc bị từ chối! Đơn đặt lịch đã chuyển sang Đã hủy (CANCELLED) và nhả khung giờ về AVAILABLE theo đúng UC.14.',
        };
      }

      setState((prev) => ({
        ...prev,
        payments: [paymentRecord, ...prev.payments],
      }));
      return {
        ok: false,
        message:
          'Kết nối cổng thanh toán gián đoạn tạm thời. Khung giờ vẫn đang được giữ (HOLD) — bạn có thể bấm thử thanh toán lại!',
      };
    }

    // Giao dịch đặt cọc 30% thành công
    setState((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'CONFIRMED' as const,
              paymentStatus: 'DEPOSITED' as const,
              confirmedAt: new Date().toISOString(),
              holdExpiresAt: undefined,
            }
          : b
      );
      const nextSlots = prev.slots.map((s) =>
        s.bookingId === bookingId ||
        (s.guideId === target.guideId &&
          s.date === target.date &&
          s.startTime === target.startTime)
          ? { ...s, status: 'BUSY' as const, bookingId, holdExpiresAt: undefined }
          : s
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.guideId,
          title: `Du khách đã đặt cọc 30% cho đơn ${bookingId}!`,
          content: `Đơn ${bookingId} (${target.date} • ${target.startTime} – ${target.endTime}) đã chính thức xác nhận (CONFIRMED). Lịch của bạn đã chuyển sang BUSY.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: '/guide/don-va-ca',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đã nhận tiền cọc 30% cho đơn ${bookingId}`,
          content: `Du khách vừa thanh toán cọc ${formatMoney(target.depositAmount)} qua ${gateway}. Đơn chuyển sang CONFIRMED.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
        {
          userId: target.touristId,
          title: `Đặt cọc thành công cho đơn ${bookingId}!`,
          content: `Bạn đã đặt cọc 30% (${formatMoney(target.depositAmount)}) thành công qua ${gateway}. Lịch trình đã được xác nhận chính thức.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
      ]);

      syncToCloud({ bookings: nextBookings, slots: nextSlots, notifications: nextNotifs });

      return {
        ...prev,
        payments: [paymentRecord, ...prev.payments],
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Thanh toán đặt cọc 30% (${formatMoney(
        target.depositAmount
      )}) thành công! Lịch trình đã được xác nhận chính thức.`,
    };
  };

  /**
   * Automation 2 (BR-05, UC.14 Ngoại lệ 2):
   * Quá hạn 15 phút giữ chỗ (HOLD) mà khách chưa đặt cọc -> Tự động hủy đơn, trả slot về AVAILABLE
   */
  const expireDeposit = (bookingId: string) => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target || target.bookingStatus !== 'WAITING_PAYMENT') return;

    const reason =
      'Quá thời hạn 15 phút giữ chỗ (HOLD) nhưng Du khách chưa hoàn tất thanh toán đặt cọc 30% (Tự động hủy theo BR-05).';
    const cancelRec: CancellationRecord = {
      id: `CAN-${Date.now()}`,
      bookingId,
      cancelledByUserId: 'SYSTEM',
      cancellationType: 'SYSTEM_TIMEOUT',
      reason,
      cancelledAt: new Date().toISOString(),
      deltaHours: calcDeltaHours(target.date, target.startTime),
      penaltyRate: 0,
      refundToTourist: 0,
      platformFeeRetained: 0,
      paidToGuide: 0,
    };

    setState((prev) => ({
      ...prev,
      cancellations: [cancelRec, ...prev.cancellations],
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'CANCELLED',
              paymentStatus: 'UNPAID',
              cancelledAt: new Date().toISOString(),
              cancelReason: reason,
              cancellationType: 'SYSTEM_TIMEOUT',
            }
          : b
      ),
      slots: prev.slots.map((s) =>
        s.bookingId === bookingId ||
        (s.guideId === target.guideId &&
          s.date === target.date &&
          s.startTime === target.startTime)
          ? { ...s, status: 'AVAILABLE', bookingId: undefined, holdExpiresAt: undefined }
          : s
      ),
      notifications: pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `Đơn ${bookingId} đã tự động hủy do hết 15 phút giữ chỗ`,
          content: reason,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: target.guideId,
          title: `Đơn ${bookingId} đã tự động hủy (khách không cọc 15p)`,
          content: `Khung giờ ${target.date} (${target.startTime} – ${target.endTime}) đã tự động giải phóng về trạng thái Trống (AVAILABLE).`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/lich-ranh',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} tự động hủy (hết hạn giữ chỗ 15p)`,
          content: reason,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]),
    }));
  };

  /**
   * Automation 1 (BR-03): Quá 24 giờ HDV không phản hồi đơn PENDING -> Tự động chuyển CANCELLED
   */
  const expirePendingBooking = (bookingId: string) => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target || target.bookingStatus !== 'PENDING') return;

    const reason =
      'Quá thời hạn 24 giờ nhưng Hướng dẫn viên không phản hồi yêu cầu đặt lịch (Tự động hủy theo BR-03).';
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'CANCELLED',
              paymentStatus: 'UNPAID',
              cancelledAt: new Date().toISOString(),
              cancelReason: reason,
              cancellationType: 'SYSTEM_TIMEOUT',
            }
          : b
      ),
      notifications: pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `Đơn ${bookingId} đã hết hạn chờ phản hồi 24 giờ`,
          content: reason,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: target.guideId,
          title: `Đơn ${bookingId} tự động hủy do quá 24h không phản hồi`,
          content: `Bạn chưa phản hồi đơn ${bookingId} trong thời hạn 24 giờ quy định (BR-03). Đơn đã tự động hủy.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/don-den',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} tự động hủy (HDV không phản hồi 24h)`,
          content: reason,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]),
    }));
  };

  // ── 5. HỦY ĐƠN THEO ΔT (UC.24, UC.25, BR-06, BR-07) ─────────
  /**
   * UC.24: Du khách hủy đơn:
   * - Nếu PENDING hoặc WAITING_PAYMENT (chưa đóng cọc): Hủy miễn phí, nhả slot AVAILABLE.
   * - Nếu CONFIRMED + DEPOSITED: Tính ΔT = Start_Time - Cancel_Time:
   *   + ΔT > 48h: phạt 0% cọc (hoàn 100% cọc)
   *   + 24h <= ΔT <= 48h: phạt 50% cọc (hoàn 50% cọc)
   *   + ΔT < 24h: phạt 100% cọc (không hoàn cọc)
   *   Phần tiền phạt cọc trừ phí sàn (Penalty * Fee_Rate), phần còn lại cộng vào ví HDV (BR-07).
   */
  const cancelBooking = (
    bookingId: string,
    reason?: string,
    customDeltaHours?: number
  ): ActionResult => {
    const b = state.bookings.find((item) => item.id === bookingId);
    if (!b) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };

    const finalReason =
      reason?.trim() || 'Du khách thay đổi lịch trình cá nhân tại Đà Nẵng.';
    const delta =
      customDeltaHours !== undefined
        ? customDeltaHours
        : b.deltaHours ?? Math.max(0, calcDeltaHours(b.date, b.startTime));

    const isDeposited = b.paymentStatus === 'DEPOSITED';
    const split = isDeposited
      ? calcPenaltySplit(b.depositAmount, delta, b.feeRate)
      : {
          penaltyRate: 0,
          penaltyAmount: 0,
          refundToTourist: 0,
          platformFeeOnPenalty: 0,
          guideCompensation: 0,
        };

    const nextPaymentStatus: PaymentStatus = isDeposited
      ? split.refundToTourist > 0
        ? 'REFUNDED'
        : 'DEPOSITED'
      : 'UNPAID';

    const cancelRec: CancellationRecord = {
      id: `CAN-${Date.now()}`,
      bookingId,
      cancelledByUserId: b.touristId,
      cancellationType: 'TOURIST_CANCEL',
      reason: finalReason,
      cancelledAt: new Date().toISOString(),
      deltaHours: delta,
      penaltyRate: split.penaltyRate,
      refundToTourist: split.refundToTourist,
      platformFeeRetained: split.platformFeeOnPenalty,
      paidToGuide: split.guideCompensation,
    };

    setState((prev) => {
      let nextWallets = prev.wallets;
      let nextWalletTxs = prev.walletTransactions;

      // Nếu có tiền bồi thường cho HDV (khi khách hủy muộn <= 48h), cộng vào ví khả dụng của HDV (BR-07)
      if (split.guideCompensation > 0) {
        const currentWallet =
          prev.wallets.find((w) => w.guideId === b.guideId) || {
            guideId: b.guideId,
            availableBalance: 0,
            pendingBalance: 0,
            totalWithdrawn: 0,
          };
        const updatedBalance =
          currentWallet.availableBalance + split.guideCompensation;

        nextWallets = prev.wallets.map((w) =>
          w.guideId === b.guideId ? { ...w, availableBalance: updatedBalance } : w
        );

        const newTx: WalletTransaction = {
          id: `wtx-${Date.now()}`,
          guideId: b.guideId,
          bookingId,
          type: 'CANCEL_COMPENSATION',
          amount: split.guideCompensation,
          balanceAfter: updatedBalance,
          description: `Bồi thường khách hủy đơn ${bookingId} (ΔT = ${delta}h, phạt ${(
            split.penaltyRate * 100
          ).toFixed(0)}% cọc)`,
          formulaNote: `Tiền phạt cọc (${formatMoney(
            split.penaltyAmount
          )}) − Phí sàn ${(b.feeRate * 100).toFixed(0)}% (${formatMoney(
            split.platformFeeOnPenalty
          )}) = +${formatMoney(split.guideCompensation)}`,
          createdAt: new Date().toISOString(),
        };
        nextWalletTxs = [newTx, ...prev.walletTransactions];
      }

      const nextBookings = prev.bookings.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              bookingStatus: 'CANCELLED' as const,
              paymentStatus: nextPaymentStatus,
              cancelledAt: new Date().toISOString(),
              cancelReason: finalReason,
              cancellationType: 'TOURIST_CANCEL' as const,
              deltaHours: delta,
              penalty: split.penaltyAmount,
              refund: split.refundToTourist,
              guideCompensation: split.guideCompensation,
            }
          : item
      );
      const nextSlots = prev.slots.map((s) =>
        s.bookingId === bookingId ||
        (s.guideId === b.guideId && s.date === b.date && s.startTime === b.startTime)
          ? { ...s, status: 'AVAILABLE' as const, bookingId: undefined, holdExpiresAt: undefined }
          : s
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: b.guideId,
          title: `Du khách đã hủy đơn ${bookingId}`,
          content: isDeposited
            ? `Đơn ${bookingId} bị hủy trước giờ hẹn ${delta}h. Bạn nhận được ${formatMoney(
                split.guideCompensation
              )} tiền bồi thường vào ví.`
            : `Đơn ${bookingId} đã bị hủy trước khi đặt cọc.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/don-va-ca',
        },
        {
          userId: b.touristId,
          title: `Bạn đã hủy đơn ${bookingId}`,
          content: isDeposited
            ? `Hủy đơn trước ${delta}h. Tiền hoàn: ${formatMoney(split.refundToTourist)}.`
            : `Đã hủy yêu cầu đặt lịch ${bookingId}.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Du khách đã hủy đơn ${bookingId} (ΔT = ${delta}h)`,
          content: `Khách hủy đơn. Hoàn khách: ${formatMoney(split.refundToTourist)}, bồi thường HDV: ${formatMoney(split.guideCompensation)}.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
      });

      return {
        ...prev,
        cancellations: [cancelRec, ...prev.cancellations],
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: isDeposited
        ? `Đã hủy đơn ${bookingId} (ΔT = ${delta}h). Hoàn lại khách: ${formatMoney(
            split.refundToTourist
          )}, bồi thường HDV: ${formatMoney(split.guideCompensation)}.`
        : `Đã hủy yêu cầu đặt lịch ${bookingId} thành công.`,
    };
  };

  /**
   * UC.25 & BR-06:
   * HDV hủy đơn đã CONFIRMED:
   * - Hoàn 100% tiền cọc cho Du khách (Refund = Deposit, Penalty = 0)
   * - HDV nhận 0đ và bị cộng +1 vào soLanViPham (Violation Count)
   * - Nhả slot về AVAILABLE
   */
  const guideCancelBooking = (bookingId: string, reason?: string): ActionResult => {
    const b = state.bookings.find((item) => item.id === bookingId);
    if (!b) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };

    const finalReason =
      reason?.trim() || 'Hướng dẫn viên gặp sự cố sức khỏe đột xuất không thể dẫn đoàn.';
    const delta = calcDeltaHours(b.date, b.startTime);

    const cancelRec: CancellationRecord = {
      id: `CAN-${Date.now()}`,
      bookingId,
      cancelledByUserId: b.guideId,
      cancellationType: 'GUIDE_CANCEL',
      reason: finalReason,
      cancelledAt: new Date().toISOString(),
      deltaHours: delta,
      penaltyRate: 0,
      refundToTourist: b.depositAmount,
      platformFeeRetained: 0,
      paidToGuide: 0,
    };

    setState((prev) => {
      const nextUsers = prev.users.map((u) =>
        u.id === b.guideId ? { ...u, violationCount: u.violationCount + 1 } : u
      );
      const nextBookings = prev.bookings.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              bookingStatus: 'CANCELLED' as const,
              paymentStatus: 'REFUNDED' as const,
              cancelledAt: new Date().toISOString(),
              cancelReason: finalReason,
              cancellationType: 'GUIDE_CANCEL' as const,
              deltaHours: delta,
              penalty: 0,
              refund: item.depositAmount,
              guideCompensation: 0,
            }
          : item
      );
      const nextSlots = prev.slots.map((s) =>
        s.bookingId === bookingId ||
        (s.guideId === b.guideId && s.date === b.date && s.startTime === b.startTime)
          ? { ...s, status: 'AVAILABLE' as const, bookingId: undefined, holdExpiresAt: undefined }
          : s
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: b.touristId,
          title: `HDV đã hủy đơn ${bookingId} — Hoàn 100% tiền cọc`,
          content: `Lý do: "${finalReason}". Hệ thống đã hoàn trả 100% tiền cọc (${formatMoney(
            b.depositAmount
          )}) cho bạn và ghi nhận vi phạm đối với HDV.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: b.guideId,
          title: `Đã xác nhận bạn hủy đơn ${bookingId}`,
          content: `Bạn đã hủy đơn ${bookingId}. Khách được hoàn 100% cọc và hồ sơ ghi nhận +1 vi phạm.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/don-va-ca',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `HDV đã hủy đơn ${bookingId} (Vi phạm BR-06)`,
          content: `HDV hủy đơn đã CONFIRMED. Hoàn 100% cọc cho khách. HDV bị tính +1 vi phạm.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({
        users: nextUsers,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        cancellations: [cancelRec, ...prev.cancellations],
        users: nextUsers,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Đã hủy đơn ${bookingId}. Khách được hoàn 100% cọc (${formatMoney(
        b.depositAmount
      )}) và hệ thống đã ghi nhận +1 lần vi phạm vào hồ sơ HDV (BR-06).`,
    };
  };

  // ── 6. HOÀN THÀNH DỊCH VỤ & CỬA SỔ 24 GIỜ (UC.17, UC.18, BR-08) ──
  /**
   * UC.17 & BR-08 (Chốt Câu hỏi 1):
   * Khi HDV bấm "Yêu cầu xác nhận hoàn thành", đơn VẪN GIỮ bookingStatus = 'CONFIRMED',
   * đặt guideRequestedCompletion = true và mở đồng hồ đếm ngược 24 giờ (completionAutoConfirmAt).
   * Trong 24 giờ này, Du khách có thể bấm "Xác nhận hoàn thành" (UC.18) HOẶC một trong hai bên gửi "Khiếu nại" (UC.19).
   */
  const requestCompletion = (bookingId: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn.' };

    const nowIso = new Date().toISOString();
    const autoConfirmIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    setState((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              guideRequestedCompletion: true,
              completionRequestedAt: nowIso,
              completionAutoConfirmAt: autoConfirmIso,
            }
          : b
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `HDV yêu cầu xác nhận hoàn thành tour ${bookingId}`,
          content:
            'Bạn có 24 giờ để bấm "Xác nhận hoàn thành" (UC.18) hoặc "Gửi khiếu nại" (UC.19) nếu có sự cố. Sau 24 giờ không có khiếu nại, hệ thống sẽ tự động hoàn tất.',
          type: 'BOOKING',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} mở cửa sổ hoàn thành 24h`,
          content: `HDV đã gửi yêu cầu xác nhận hoàn tất đơn ${bookingId}. Đang đếm ngược 24h phản hồi từ du khách.`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({ bookings: nextBookings, notifications: nextNotifs });

      return {
        ...prev,
        bookings: nextBookings,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message:
        'Đã gửi yêu cầu xác nhận hoàn thành! Hệ thống đã mở cửa sổ 24 giờ để Du khách xác nhận (UC.18) hoặc phản hồi khiếu nại (UC.19).',
    };
  };

  /**
   * UC.18: Du khách bấm "Xác nhận hoàn thành" -> BookingStatus = COMPLETED, PaymentStatus = WAITING_FINAL.
   * Từ thời điểm này, quyền Khiếu nại bị khóa (BR-12).
   */
  const confirmCompletion = (bookingId: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn.' };

    setState((prev) => {
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'COMPLETED' as const,
              paymentStatus: 'WAITING_FINAL' as const,
              completedAt: new Date().toISOString(),
              guideRequestedCompletion: true,
              touristConfirmedCompletion: true,
            }
          : b
      );
      const nextProfiles = prev.guideProfiles.map((gp) =>
        gp.userId === target.guideId
          ? { ...gp, completedTours: gp.completedTours + 1 }
          : gp
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `Tour ${bookingId} đã hoàn thành — Vui lòng tất toán 70% còn lại`,
          content: `Cảm ơn bạn đã xác nhận hoàn thành tour! Vui lòng thanh toán 70% còn lại (${formatMoney(
            target.remainingAmount
          )}) bằng Online hoặc Tiền mặt.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: `/don/${bookingId}/thanh-toan-70`,
        },
        {
          userId: target.guideId,
          title: `Du khách đã xác nhận hoàn thành tour ${bookingId}!`,
          content: `Khách đã bấm xác nhận hoàn thành tour ${bookingId}. Chờ khách thanh toán 70% còn lại (${formatMoney(
            target.remainingAmount
          )}).`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/don-va-ca',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Tour ${bookingId} đã hoàn tất, chờ tất toán 70%`,
          content: `Đơn ${bookingId} đã chuyển sang COMPLETED (WAITING_FINAL).`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({
        bookings: nextBookings,
        guideProfiles: nextProfiles,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        bookings: nextBookings,
        guideProfiles: nextProfiles,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message:
        'Đã xác nhận hoàn thành tour! Vui lòng chọn phương thức tất toán 70% còn lại.',
    };
  };

  /**
   * Automation 3 (BR-08): Quá 24 giờ kể từ lúc HDV yêu cầu hoàn thành mà không có khiếu nại -> Tự động COMPLETED + WAITING_FINAL
   */
  const autoConfirmCompletionTimeout = (bookingId: string) => {
    confirmCompletion(bookingId);
  };

  // ── 7. TẤT TOÁN 70% & ĐỐI SOÁT TIỀN MẶT (UC.20, UC.21, BR-13) ──
  /**
   * UC.20 & BR-13:
   * - Nếu khách chọn ONLINE và thành công:
   *   PaymentStatus = PAID.
   *   Ví HDV được cộng: +(G - F), trong đó F = G * Fee_Rate.
   * - Nếu khách chọn CASH (Tiền mặt trực tiếp cho HDV):
   *   PaymentStatus = WAITING_RECONCILE (tương đương RECONCILIATION_PENDING).
   *   Chờ HDV bấm "Xác nhận đã thu đủ 70% tiền mặt" (UC.21).
   */
  const payFinal = (
    bookingId: string,
    method: 'ONLINE' | 'CASH',
    isSuccess: boolean,
    gateway: 'VNPAY' | 'MOMO' | 'BANK_CARD' | 'CASH_DIRECT' = 'VNPAY'
  ): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };

    if (!isSuccess) {
      const failPayment: Payment = {
        id: `pay-${Date.now()}`,
        bookingId,
        type: 'final',
        method,
        gateway,
        amount: target.remainingAmount,
        result: 'fail',
        referenceCode: `${gateway}-FAIL-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        payments: [failPayment, ...prev.payments],
      }));
      return {
        ok: false,
        message:
          'Giao dịch thanh toán 70% không thành công. Đơn vẫn ở trạng thái Chờ tất toán 70% — bạn có thể thử lại hoặc chuyển sang trả Tiền mặt trực tiếp cho HDV.',
      };
    }

    if (method === 'CASH') {
      const deltaCredit =
        target.depositAmount - Math.round(target.totalAmount * target.feeRate);
      setState((prev) => {
        const nextBookings = prev.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                paymentMethod: 'CASH' as const,
                paymentStatus: 'WAITING_RECONCILE' as const,
              }
            : b
        );
        const nextWallets = prev.wallets.map((w) =>
          w.guideId === target.guideId
            ? { ...w, pendingBalance: w.pendingBalance + deltaCredit }
            : w
        );
        const nextNotifs = pushNotifications(prev.notifications, [
          {
            userId: target.guideId,
            title: `Khách chọn trả Tiền mặt 70% cho đơn ${bookingId}`,
            content: `Du khách sẽ trao trực tiếp ${formatMoney(
              target.remainingAmount
            )} tiền mặt cho bạn. Sau khi nhận đủ tiền, vui lòng bấm "Xác nhận đã thu đủ 70% tiền mặt" để hệ thống đối soát ví.`,
            type: 'WALLET',
            bookingId,
            actionUrl: '/guide/don-va-ca',
          },
          {
            userId: target.touristId,
            title: `Đã chọn thanh toán Tiền mặt 70% cho đơn ${bookingId}`,
            content: `Vui lòng trao trực tiếp ${formatMoney(
              target.remainingAmount
            )} cho Thổ địa khi kết thúc chuyến đi.`,
            type: 'PAYMENT',
            bookingId,
            actionUrl: `/don/${bookingId}`,
          },
          {
            userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
            title: `Đơn ${bookingId} chọn trả 70% tiền mặt (Chờ đối soát)`,
            content: `Khách chọn trả ${formatMoney(target.remainingAmount)} tiền mặt trực tiếp cho HDV. Trạng thái WAITING_RECONCILE.`,
            type: 'PAYMENT',
            bookingId,
            actionUrl: '/admin/bao-cao?tab=reconcile',
          },
        ]);

        syncToCloud({ bookings: nextBookings, wallets: nextWallets, notifications: nextNotifs });

        return {
          ...prev,
          bookings: nextBookings,
          wallets: nextWallets,
          notifications: nextNotifs,
        };
      });

      return {
        ok: true,
        message: `Đã ghi nhận phương thức trả Tiền mặt 70% (${formatMoney(
          target.remainingAmount
        )}). Trạng thái thanh toán chuyển sang Chờ HDV xác nhận tiền mặt (WAITING_RECONCILE).`,
      };
    }

    // Nhánh ONLINE 70% thành công
    const fee = Math.round(target.totalAmount * target.feeRate);
    const guideReceives = target.totalAmount - fee;

    const okPayment: Payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      type: 'final',
      method: 'ONLINE',
      gateway,
      amount: target.remainingAmount,
      result: 'success',
      referenceCode: `${gateway}-DN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const currentWallet =
        prev.wallets.find((w) => w.guideId === target.guideId) || {
          guideId: target.guideId,
          availableBalance: 0,
          pendingBalance: 0,
          totalWithdrawn: 0,
        };
      const updatedBalance = currentWallet.availableBalance + guideReceives;

      const newTx: WalletTransaction = {
        id: `wtx-${Date.now()}`,
        guideId: target.guideId,
        bookingId,
        type: 'SETTLEMENT_ONLINE',
        amount: guideReceives,
        balanceAfter: updatedBalance,
        description: `Quyết toán đơn ${bookingId} (Khách thanh toán 70% Online)`,
        formulaNote: `Tổng G (${formatMoney(
          target.totalAmount
        )}) − Phí sàn ${(target.feeRate * 100).toFixed(0)}% (${formatMoney(
          fee
        )}) = +${formatMoney(guideReceives)}`,
        createdAt: new Date().toISOString(),
      };

      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, paymentMethod: 'ONLINE' as const, paymentStatus: 'PAID' as const }
          : b
      );
      const nextWallets = prev.wallets.map((w) =>
        w.guideId === target.guideId
          ? { ...w, availableBalance: updatedBalance }
          : w
      );
      const nextWalletTxs = [newTx, ...prev.walletTransactions];
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.guideId,
          title: `Đơn ${bookingId} đã tất toán Online 100% — Cộng ví +${formatMoney(
            guideReceives
          )}`,
          content: `Khách đã thanh toán 70% cuối qua cổng Online. Sau khi khấu trừ phí sàn ${(
            target.feeRate * 100
          ).toFixed(0)}% (${formatMoney(fee)}), ví khả dụng của bạn được cộng +${formatMoney(
            guideReceives
          )}.`,
          type: 'WALLET',
          bookingId,
          actionUrl: '/guide/vi',
        },
        {
          userId: target.touristId,
          title: `Tất toán thành công 70% cho đơn ${bookingId}`,
          content: `Bạn đã thanh toán ${formatMoney(target.remainingAmount)} thành công. Đơn hàng đã hoàn tất 100% (PAID). Hãy để lại đánh giá nhé!`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} đã tất toán Online 100%`,
          content: `Khách đã thanh toán 70% Online (${formatMoney(target.remainingAmount)}). Sàn thu phí ${formatMoney(fee)}.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=monitoring',
        },
      ]);

      syncToCloud({
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        payments: [okPayment, ...prev.payments],
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Tất toán 70% (${formatMoney(
        target.remainingAmount
      )}) thành công! Bạn đã có thể gửi đánh giá cho Hướng dẫn viên.`,
    };
  };

  /**
   * UC.21 & BR-13:
   * HDV bấm "Xác nhận đã thu đủ 70% tiền mặt" khi đơn đang ở COMPLETED + WAITING_RECONCILE:
   * - PaymentStatus -> PAID
   * - Ví khả dụng của HDV được cộng thêm phần chênh lệch: +(D - F) = +(30%G - Fee_Rate*G)
   */
  const confirmCashPayment = (bookingId: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn.' };

    const platformFee = Math.round(target.totalAmount * target.feeRate);
    const addition = target.depositAmount - platformFee; // D - F (BR-13)

    const cashPayment: Payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      type: 'final',
      method: 'CASH',
      gateway: 'CASH_DIRECT',
      amount: target.remainingAmount,
      result: 'success',
      referenceCode: `CASH-DN-${bookingId}`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const currentWallet =
        prev.wallets.find((w) => w.guideId === target.guideId) || {
          guideId: target.guideId,
          availableBalance: 0,
          pendingBalance: 0,
          totalWithdrawn: 0,
        };
      const updatedBalance = currentWallet.availableBalance + addition;
      const updatedPending = Math.max(0, currentWallet.pendingBalance - addition);

      const newTx: WalletTransaction = {
        id: `wtx-${Date.now()}`,
        guideId: target.guideId,
        bookingId,
        type: 'SETTLEMENT_CASH',
        amount: addition,
        balanceAfter: updatedBalance,
        description: `Quyết toán đối soát đơn ${bookingId} (Đã thu 70% Tiền mặt trực tiếp)`,
        formulaNote: `Cọc 30% sàn giữ (${formatMoney(
          target.depositAmount
        )}) − Phí sàn ${(target.feeRate * 100).toFixed(0)}% trên tổng G (${formatMoney(
          platformFee
        )}) = +${formatMoney(addition)}`,
        createdAt: new Date().toISOString(),
      };

      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, paymentStatus: 'PAID' as const, paymentMethod: 'CASH' as const }
          : b
      );
      const nextWallets = prev.wallets.map((w) =>
        w.guideId === target.guideId
          ? {
              ...w,
              availableBalance: updatedBalance,
              pendingBalance: updatedPending,
            }
          : w
      );
      const nextWalletTxs = [newTx, ...prev.walletTransactions];
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `HDV đã xác nhận thu đủ 70% tiền mặt đơn ${bookingId}`,
          content:
            'Đơn đặt lịch của bạn đã hoàn tất thanh toán 100% (PAID). Hãy để lại đánh giá cho chuyến đi nhé!',
          type: 'PAYMENT',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: target.guideId,
          title: `Xác nhận thu 70% tiền mặt đơn ${bookingId} thành công`,
          content: `Đã đối soát đối ứng cọc và phí sàn. Ví khả dụng được cộng +${formatMoney(addition)}.`,
          type: 'WALLET',
          bookingId,
          actionUrl: '/guide/vi',
        },
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Đơn ${bookingId} hoàn tất đối soát tiền mặt`,
          content: `HDV đã xác nhận thu đủ tiền mặt. Đơn chuyển PAID, ví cộng +${formatMoney(addition)}.`,
          type: 'PAYMENT',
          bookingId,
          actionUrl: '/admin/bao-cao?tab=reconcile',
        },
      ]);

      syncToCloud({
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        payments: [cashPayment, ...prev.payments],
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Đã xác nhận thu 70% tiền mặt! Sau khi cấn trừ phí sàn ${formatMoney(
        platformFee
      )} vào khoản cọc 30% (${formatMoney(
        target.depositAmount
      )}), ví khả dụng của bạn được cộng thêm +${formatMoney(addition)} (BR-13).`,
    };
  };

  // ── 8. KHIẾU NẠI & PHÁN QUYẾT TRANH CHẤP (UC.19, UC.27, BR-12) ──
  /**
   * UC.19 & BR-12:
   * Chỉ mở quyền khiếu nại sau khi HDV đã bấm Yêu cầu hoàn thành (guideRequestedCompletion = true)
   * và TRƯỚC KHI BookingStatus chuyển sang COMPLETED.
   */
  const submitDispute = (
    bookingId: string,
    reasonCategory: string,
    description?: string,
    evidenceUrls?: string[]
  ): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };

    if (target.bookingStatus === 'COMPLETED') {
      return {
        ok: false,
        message:
          'Theo quy tắc BR-12, đơn đã xác nhận hoàn thành (COMPLETED) không thể gửi khiếu nại mới.',
      };
    }

    const reporterId = currentUser?.id || target.touristId;
    const reporterRole: 'tourist' | 'guide' =
      currentUser?.role === 'guide' ? 'guide' : 'tourist';

    const newDispute: DisputeRecord = {
      id: `DSP-${Date.now().toString().slice(-4)}`,
      bookingId,
      reporterId,
      reporterRole,
      reasonCategory: reasonCategory.trim(),
      description: (description || reasonCategory).trim(),
      evidenceUrls: evidenceUrls?.length
        ? evidenceUrls
        : [
            'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=80',
          ],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const nextDisputes = [newDispute, ...prev.disputes];
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, bookingStatus: 'DISPUTED' as const } : b
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: prev.users.find((u) => u.role === 'admin')?.id || 'u-admin-1',
          title: `Khiếu nại mới ${newDispute.id} cho đơn ${bookingId}`,
          content: `Lý do: ${reasonCategory}. Vui lòng kiểm tra bằng chứng và đưa ra phán quyết (UC.27).`,
          type: 'DISPUTE',
          bookingId,
          actionUrl: '/admin/tranh-chap',
        },
        {
          userId: reporterId === target.touristId ? target.guideId : target.touristId,
          title: `Đơn ${bookingId} có khiếu nại phát sinh (${newDispute.id})`,
          content: `Đối phương đã gửi khiếu nại: "${reasonCategory}". Quản trị viên đang thụ lý theo quy trình UC.27.`,
          type: 'DISPUTE',
          bookingId,
          actionUrl: reporterId === target.touristId ? '/guide/don-va-ca' : `/don/${bookingId}`,
        },
      ]);

      syncToCloud({
        disputes: nextDisputes,
        bookings: nextBookings,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        disputes: nextDisputes,
        bookings: nextBookings,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: `Đã gửi hồ sơ khiếu nại ${newDispute.id}. Đơn ${bookingId} đã chuyển sang trạng thái Đang khiếu nại (DISPUTED) để Admin thẩm định.`,
    };
  };

  /**
   * UC.27 & BR-12 (Chốt Câu hỏi 5):
   * Admin phán quyết tranh chấp với 2 nhánh rõ ràng:
   * 1. GUIDE_FAULT (Lỗi thuộc về HDV):
   *    - Hoàn 100% tiền cọc (30%) cho Du khách (PaymentStatus = REFUNDED)
   *    - Sàn không thu phí hoa hồng (0 ₫)
   *    - Tăng soLanViPham của HDV +1
   * 2. TOURIST_FAULT (Lỗi thuộc về Du khách):
   *    - Tịch thu tiền cọc 30% của khách
   *    - Khấu trừ phí nền tảng: Platform_Fee = Deposit * Fee_Rate
   *    - Cộng phần còn lại (Deposit - Platform_Fee) vào ví khả dụng của HDV
   *    - Tăng soLanViPham của Du khách +1
   * Cả 2 nhánh đều kết thúc ở BookingStatus = CANCELLED (lý do tranh chấp) và không thu tiếp 70% còn lại.
   */
  const resolveDispute = (
    bookingId: string,
    adminNote: string,
    decision: DisputeFaultDecision = 'GUIDE_FAULT'
  ): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn tranh chấp.' };

    const isGuideFault = decision === 'GUIDE_FAULT';
    const refundAmount = isGuideFault ? target.depositAmount : 0;
    const platformFeeAmount = isGuideFault
      ? 0
      : Math.round(target.depositAmount * target.feeRate);
    const guidePayoutAmount = isGuideFault
      ? 0
      : target.depositAmount - platformFeeAmount;

    setState((prev) => {
      let nextWallets = prev.wallets;
      let nextWalletTxs = prev.walletTransactions;

      if (!isGuideFault && guidePayoutAmount > 0) {
        const currentWallet =
          prev.wallets.find((w) => w.guideId === target.guideId) || {
            guideId: target.guideId,
            availableBalance: 0,
            pendingBalance: 0,
            totalWithdrawn: 0,
          };
        const updatedBalance = currentWallet.availableBalance + guidePayoutAmount;
        nextWallets = prev.wallets.map((w) =>
          w.guideId === target.guideId
            ? { ...w, availableBalance: updatedBalance }
            : w
        );

        const newTx: WalletTransaction = {
          id: `wtx-${Date.now()}`,
          guideId: target.guideId,
          bookingId,
          type: 'DISPUTE_SETTLEMENT',
          amount: guidePayoutAmount,
          balanceAfter: updatedBalance,
          description: `Phán quyết tranh chấp đơn ${bookingId} (Lỗi thuộc về Du khách)`,
          formulaNote: `Cọc tịch thu (${formatMoney(
            target.depositAmount
          )}) − Phí sàn ${(target.feeRate * 100).toFixed(0)}% (${formatMoney(
            platformFeeAmount
          )}) = +${formatMoney(guidePayoutAmount)}`,
          createdAt: new Date().toISOString(),
        };
        nextWalletTxs = [newTx, ...prev.walletTransactions];
      }

      const violatorId = isGuideFault ? target.guideId : target.touristId;
      const nextUsers = prev.users.map((u) =>
        u.id === violatorId ? { ...u, violationCount: u.violationCount + 1 } : u
      );
      const nextDisputes = prev.disputes.map((d) =>
        d.bookingId === bookingId
          ? {
              ...d,
              status: 'RESOLVED' as const,
              decision,
              resolutionNote: adminNote.trim(),
              refundAmount,
              guidePayoutAmount,
              platformFeeAmount,
              resolvedByAdminId: currentUser?.id || 'u-admin-1',
              resolvedAt: new Date().toISOString(),
            }
          : d
      );
      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'CANCELLED' as const,
              paymentStatus: isGuideFault ? ('REFUNDED' as const) : ('DEPOSITED' as const),
              cancelledAt: new Date().toISOString(),
              cancelReason: `[Phán quyết tranh chấp - ${
                isGuideFault ? 'Lỗi do HDV' : 'Lỗi do Du khách'
              }]: ${adminNote.trim()}`,
              cancellationType: 'DISPUTE_RESOLUTION' as const,
              refund: refundAmount,
              penalty: isGuideFault ? 0 : target.depositAmount,
              guideCompensation: guidePayoutAmount,
            }
          : b
      );
      const nextSlots = prev.slots.map((s) =>
        s.bookingId === bookingId
          ? { ...s, status: 'AVAILABLE' as const, bookingId: undefined }
          : s
      );
      const nextNotifs = pushNotifications(prev.notifications, [
        {
          userId: target.touristId,
          title: `Kết quả phán quyết tranh chấp đơn ${bookingId}`,
          content: isGuideFault
            ? `Admin xác định lỗi thuộc về HDV: Bạn được hoàn 100% tiền cọc (${formatMoney(
                refundAmount
              )}). Biên bản: "${adminNote.trim()}"`
            : `Admin xác định lỗi thuộc về Du khách: Tiền cọc được dùng để bồi thường cho HDV. Biên bản: "${adminNote.trim()}"`,
          type: 'DISPUTE',
          bookingId,
          actionUrl: `/don/${bookingId}`,
        },
        {
          userId: target.guideId,
          title: `Kết quả phán quyết tranh chấp đơn ${bookingId}`,
          content: isGuideFault
            ? `Admin xác định lỗi thuộc về HDV: Đơn bị hủy hoàn cọc cho khách và ghi nhận +1 vi phạm. Biên bản: "${adminNote.trim()}"`
            : `Admin xác định lỗi thuộc về Du khách: Ví của bạn được cộng +${formatMoney(
                guidePayoutAmount
              )} bồi thường. Biên bản: "${adminNote.trim()}"`,
          type: 'DISPUTE',
          bookingId,
          actionUrl: '/guide/don-va-ca',
        },
      ]);

      syncToCloud({
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        users: nextUsers,
        disputes: nextDisputes,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        users: nextUsers,
        disputes: nextDisputes,
        bookings: nextBookings,
        slots: nextSlots,
        notifications: nextNotifs,
      };
    });

    return {
      ok: true,
      message: isGuideFault
        ? `Đã chốt tranh chấp (Lỗi do HDV): Hoàn 100% cọc (${formatMoney(
            refundAmount
          )}) cho Du khách, không thu phí sàn và cộng +1 vi phạm cho HDV.`
        : `Đã chốt tranh chấp (Lỗi do Du khách): Khấu trừ phí sàn ${formatMoney(
            platformFeeAmount
          )}, cộng +${formatMoney(
            guidePayoutAmount
          )} vào ví HDV và cộng +1 vi phạm cho Du khách.`,
    };
  };

  // ── 9. ĐÁNH GIÁ HDV & TỰ ĐỘNG TÍNH LẠI ĐIỂM TRUNG BÌNH (UC.26, BR-09) ──
  const submitReview = (
    bookingId: string,
    stars: number,
    comment: string
  ): ActionResult => {
    const b = state.bookings.find((item) => item.id === bookingId);
    if (!b) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };
    if (b.bookingStatus !== 'COMPLETED' || b.paymentStatus !== 'PAID') {
      return {
        ok: false,
        message: 'Chỉ đơn đã hoàn thành (COMPLETED) và thanh toán đủ (PAID) mới được đánh giá (BR-09).',
      };
    }
    const alreadyReviewed = state.reviews.some((r) => r.bookingId === bookingId);
    if (alreadyReviewed) {
      return {
        ok: false,
        message: 'Mỗi đơn đặt lịch chỉ được gửi đánh giá tối đa 1 lần (BR-09).',
      };
    }

    const safeStars = Math.min(5, Math.max(1, Math.round(stars)));
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      bookingId,
      touristId: b.touristId,
      guideId: b.guideId,
      stars: safeStars,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const nextReviews = [newRev, ...prev.reviews];
      // Tính lại điểm trung bình của HDV
      const nextProfiles = prev.guideProfiles.map((gp) => {
        if (gp.userId !== b.guideId) return gp;
        const totalCount = gp.totalReviews + 1;
        const newAvg =
          Math.round(
            ((gp.avgRating * gp.totalReviews + safeStars) / totalCount) * 10
          ) / 10;
        return {
          ...gp,
          avgRating: newAvg,
          totalReviews: totalCount,
        };
      });

      return {
        ...prev,
        reviews: nextReviews,
        guideProfiles: nextProfiles,
        notifications: pushNotification(prev.notifications, {
          userId: b.guideId,
          title: `Bạn nhận được đánh giá ${safeStars} ★ từ đơn ${bookingId}`,
          content: `"${comment.trim().slice(0, 80)}"`,
          type: 'BOOKING',
          bookingId,
          actionUrl: '/guide/ho-so',
        }),
      };
    });

    return {
      ok: true,
      message: 'Cảm ơn bạn đã gửi đánh giá! Điểm uy tín của Hướng dẫn viên đã được cập nhật.',
    };
  };

  // Đánh giá hai chiều: Hướng dẫn viên phản hồi & chấm điểm Du khách (1–5 sao)
  const replyToReview = (
    bookingId: string,
    touristRating: number,
    replyComment: string
  ): ActionResult => {
    const b = state.bookings.find((item) => item.id === bookingId);
    if (!b) return { ok: false, message: 'Không tìm thấy đơn đặt lịch.' };
    if (b.bookingStatus !== 'COMPLETED' || b.paymentStatus !== 'PAID') {
      return {
        ok: false,
        message: 'Chỉ đơn đã hoàn thành và tất toán đủ mới có thể đánh giá hai chiều.',
      };
    }
    if (!replyComment.trim()) {
      return { ok: false, message: 'Vui lòng nhập nhận xét hoặc lời cảm ơn dành cho Du khách.' };
    }

    const safeRating = Math.min(5, Math.max(1, Math.round(touristRating)));
    const existing = state.reviews.find((r) => r.bookingId === bookingId);
    if (!existing) {
      return {
        ok: false,
        message: 'Vui lòng đợi Du khách gửi đánh giá chuyến đi trước để phản hồi hai chiều.',
      };
    }
    if (existing.guideReply) {
      return {
        ok: false,
        message: 'Bạn đã gửi phản hồi và đánh giá cho đơn đặt lịch này rồi.',
      };
    }

    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.bookingId === bookingId
          ? {
              ...r,
              guideReply: replyComment.trim(),
              touristRating: safeRating,
              repliedAt: nowIso,
            }
          : r
      ),
      notifications: pushNotification(prev.notifications, {
        userId: b.touristId,
        title: `Hướng dẫn viên đã phản hồi đánh giá đơn ${bookingId} (${safeRating} ★)`,
        content: `"${replyComment.trim().slice(0, 90)}"`,
        type: 'BOOKING',
        bookingId,
        actionUrl: `/don/${bookingId}`,
      }),
    }));

    return {
      ok: true,
      message: 'Đã gửi đánh giá hai chiều và lời cảm ơn tới Du khách thành công!',
    };
  };

  // ── 10. LỊCH RẢNH, HỒ SƠ & KYC CỦA HDV (UC.09, UC.10, UC.11, BR-01, BR-02) ──
  const toggleSlotAvailability = (slotId: string): ActionResult => {
    const target = state.slots.find((s) => s.id === slotId);
    if (!target) return { ok: false, message: 'Không tìm thấy khung giờ.' };
    if (target.status === 'HOLD' || (target.status === 'BUSY' && target.bookingId)) {
      return {
        ok: false,
        message: `Khung giờ này đang gắn với đơn ${target.bookingId} (${target.status}), không thể thay đổi trạng thái!`,
      };
    }

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId
          ? { ...s, status: s.status === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE' }
          : s
      ),
    }));
    return { ok: true, message: 'Đã cập nhật trạng thái khung giờ.' };
  };

  const addAvailabilitySlot = (params: {
    guideId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): ActionResult => {
    const guideProfile = state.guideProfiles.find(
      (gp) => gp.userId === params.guideId
    );
    if (!guideProfile?.isVerified || guideProfile.kycStatus !== 'APPROVED') {
      return {
        ok: false,
        message:
          'Theo quy tắc BR-01, tài khoản Hướng dẫn viên phải được Admin duyệt KYC (APPROVED) trước khi mở lịch nhận khách.',
      };
    }
    if (params.startTime >= params.endTime) {
      return {
        ok: false,
        message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.',
      };
    }
    const duplicate = state.slots.some(
      (s) =>
        s.guideId === params.guideId &&
        s.date === params.date &&
        s.startTime === params.startTime
    );
    if (duplicate) {
      return {
        ok: false,
        message: 'Khung giờ bắt đầu này đã tồn tại trong ngày đã chọn.',
      };
    }

    const newSlot: TimeSlotData = {
      id: `slot-${Date.now()}`,
      guideId: params.guideId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status: 'AVAILABLE',
    };

    setState((prev) => ({
      ...prev,
      slots: [...prev.slots, newSlot],
    }));
    return {
      ok: true,
      message: `Đã thêm khung giờ rảnh ${params.startTime} – ${params.endTime} ngày ${params.date}!`,
    };
  };

  const updateAvailabilitySlot = (params: {
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): ActionResult => {
    const target = state.slots.find((s) => s.id === params.slotId);
    if (!target) return { ok: false, message: 'Không tìm thấy khung giờ cần sửa.' };
    if (target.status !== 'AVAILABLE' || target.bookingId) {
      return {
        ok: false,
        message: `Khung giờ này đang ở trạng thái ${target.status}${
          target.bookingId ? ` (Đơn ${target.bookingId})` : ''
        } — không được phép chỉnh sửa khi đã có khách giữ chỗ hoặc đặt lịch!`,
      };
    }
    if (params.startTime >= params.endTime) {
      return { ok: false, message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.' };
    }
    const duplicate = state.slots.some(
      (s) =>
        s.id !== params.slotId &&
        s.guideId === target.guideId &&
        s.date === params.date &&
        s.startTime === params.startTime
    );
    if (duplicate) {
      return {
        ok: false,
        message: 'Khung giờ bắt đầu này đã bị trùng với một ca khác trong cùng ngày.',
      };
    }

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === params.slotId
          ? {
              ...s,
              date: params.date,
              startTime: params.startTime,
              endTime: params.endTime,
            }
          : s
      ),
    }));

    return {
      ok: true,
      message: `Đã cập nhật khung giờ thành ${params.startTime} – ${params.endTime} ngày ${params.date}.`,
    };
  };

  const removeAvailabilitySlot = (slotId: string): ActionResult => {
    const target = state.slots.find((s) => s.id === slotId);
    if (!target) return { ok: false, message: 'Không tìm thấy khung giờ.' };
    if (target.status !== 'AVAILABLE' || target.bookingId) {
      return {
        ok: false,
        message: 'Chỉ có thể xóa các khung giờ đang Trống (AVAILABLE) và chưa gắn với đơn đặt lịch.',
      };
    }
    setState((prev) => ({
      ...prev,
      slots: prev.slots.filter((s) => s.id !== slotId),
    }));
    return { ok: true, message: 'Đã xóa khung giờ rảnh.' };
  };

  const updateGuidePrice = (
    guideId: string,
    newRate: number,
    newBio?: string,
    extra?: {
      tagline?: string;
      areas?: string[];
      languages?: string[];
      skills?: string[];
      yearsExperience?: number;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountHolder?: string;
    }
  ): ActionResult => {
    if (newRate < 80000 || newRate > 500000) {
      return {
        ok: false,
        message:
          'Theo quy tắc BR-02, đơn giá thuê theo giờ của HDV phải nằm trong dải từ 80.000 ₫ đến 500.000 ₫ / giờ.',
      };
    }

    setState((prev) => ({
      ...prev,
      guideProfiles: prev.guideProfiles.map((gp) =>
        gp.userId === guideId
          ? {
              ...gp,
              hourlyRate: Math.round(newRate),
              bio: newBio !== undefined ? newBio.trim() : gp.bio,
              tagline: extra?.tagline !== undefined ? extra.tagline.trim() : gp.tagline,
              areas: extra?.areas !== undefined ? extra.areas : gp.areas,
              languages: extra?.languages !== undefined ? extra.languages : gp.languages,
              skills: extra?.skills !== undefined ? extra.skills : gp.skills,
              yearsExperience:
                extra?.yearsExperience !== undefined
                  ? extra.yearsExperience
                  : gp.yearsExperience,
              bankName: extra?.bankName !== undefined ? extra.bankName : gp.bankName,
              bankAccountNumber:
                extra?.bankAccountNumber !== undefined
                  ? extra.bankAccountNumber
                  : gp.bankAccountNumber,
              bankAccountHolder:
                extra?.bankAccountHolder !== undefined
                  ? extra.bankAccountHolder
                  : gp.bankAccountHolder,
            }
          : gp
      ),
    }));

    return {
      ok: true,
      message: 'Đã lưu cập nhật Hồ sơ chuyên môn & Đơn giá theo giờ thành công!',
    };
  };

  /**
   * UC.09: HDV nộp hồ sơ xác thực KYC
   */
  const submitKycApplication = (params: {
    guideId: string;
    idNumber: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    documents: KycDocument[];
  }): ActionResult => {
    if (!params.idNumber.trim() || !params.bankAccountNumber.trim()) {
      return {
        ok: false,
        message: 'Vui lòng nhập đầy đủ số CCCD và thông tin tài khoản ngân hàng nhận tiền.',
      };
    }

    const newRecord: KycRecord = {
      id: `kyc-${Date.now()}`,
      guideId: params.guideId,
      idNumber: params.idNumber.trim(),
      bankName: params.bankName.trim(),
      bankAccountNumber: params.bankAccountNumber.trim(),
      bankAccountHolder: params.bankAccountHolder.trim().toUpperCase(),
      documents: params.documents,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    setState((prev) => {
      const filtered = prev.kycRecords.filter((k) => k.guideId !== params.guideId);
      return {
        ...prev,
        kycRecords: [newRecord, ...filtered],
        guideProfiles: prev.guideProfiles.map((gp) =>
          gp.userId === params.guideId
            ? {
                ...gp,
                kycStatus: 'PENDING',
                bankName: params.bankName.trim(),
                bankAccountNumber: params.bankAccountNumber.trim(),
                bankAccountHolder: params.bankAccountHolder.trim().toUpperCase(),
              }
            : gp
        ),
        notifications: pushNotification(prev.notifications, {
          userId: 'u-admin-1',
          title: `Hồ sơ KYC mới từ HDV cần thẩm định`,
          content: `HDV đã gửi hồ sơ CCCD số ${params.idNumber}. Vui lòng kiểm tra và phê duyệt (UC.10).`,
          type: 'KYC',
          actionUrl: '/admin/kyc',
        }),
      };
    });

    return {
      ok: true,
      message:
        'Đã gửi hồ sơ KYC thành công! Quản trị viên sẽ thẩm định và phản hồi trong vòng 24 giờ.',
    };
  };

  // ── 11. VÍ HDV & RÚT TIỀN (UC.22, UC.23, BR-09) ───────────────
  const requestWithdrawal = (
    amount: number,
    bankInfo?: {
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
    }
  ): ActionResult => {
    const guideId =
      currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
    const currentWallet = getWalletByGuideId(guideId);
    const guideProfile = state.guideProfiles.find((gp) => gp.userId === guideId);

    if (amount < 200000) {
      return {
        ok: false,
        message: 'Theo quy tắc BR-09 (UC.22), số tiền rút tối thiểu là 200.000 ₫ / lần.',
      };
    }
    if (amount > currentWallet.availableBalance) {
      return {
        ok: false,
        message: 'Số tiền yêu cầu rút vượt quá số dư khả dụng trong ví.',
      };
    }

    const bankName = bankInfo?.bankName || guideProfile?.bankName || 'Vietcombank - CN Đà Nẵng';
    const bankAccountNumber =
      bankInfo?.bankAccountNumber || guideProfile?.bankAccountNumber || '0041000987654';
    const bankAccountHolder =
      bankInfo?.bankAccountHolder || guideProfile?.bankAccountHolder || 'NGUYEN HUU KHANH';

    const newReq: WithdrawalRequest = {
      id: `WD-${Date.now().toString().slice(-4)}`,
      guideId,
      amount: Math.round(amount),
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        w.guideId === guideId
          ? { ...w, availableBalance: w.availableBalance - Math.round(amount) }
          : w
      ),
      withdrawals: [newReq, ...prev.withdrawals],
      notifications: pushNotification(prev.notifications, {
        userId: 'u-admin-1',
        title: `Yêu cầu rút tiền mới ${newReq.id} (${formatMoney(amount)})`,
        content: `HDV yêu cầu rút ${formatMoney(amount)} về ${bankName} (${bankAccountNumber}).`,
        type: 'WALLET',
        actionUrl: '/admin/rut-tien',
      }),
    }));

    return {
      ok: true,
      message: `Đã tạo lệnh rút tiền ${newReq.id} (${formatMoney(
        amount
      )}). Số tiền đang được tạm giữ chờ Admin chuyển khoản.`,
    };
  };

  const approveWithdrawal = (
    id: string,
    transactionRef?: string,
    adminNote?: string
  ) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'PENDING') return;

    const refCode =
      transactionRef?.trim() || `FT-${Date.now().toString().slice(-8)}`;

    setState((prev) => {
      const currentWallet = getWalletByGuideId(target.guideId);
      const newTx: WalletTransaction = {
        id: `wtx-${Date.now()}`,
        guideId: target.guideId,
        withdrawalId: id,
        type: 'WITHDRAWAL_PAYOUT',
        amount: -target.amount,
        balanceAfter: currentWallet.availableBalance,
        description: `Rút tiền về ${target.bankName} (${target.bankAccountNumber}) • Mã GD: ${refCode}`,
        formulaNote: `Lệnh rút ${id} đã được Admin chuyển khoản thành công`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        withdrawals: prev.withdrawals.map((w) =>
          w.id === id
            ? {
                ...w,
                status: 'APPROVED',
                transactionRef: refCode,
                adminNote: adminNote || 'Đã chuyển khoản ngân hàng 24/7 thành công.',
                processedAt: new Date().toISOString(),
              }
            : w
        ),
        wallets: prev.wallets.map((w) =>
          w.guideId === target.guideId
            ? { ...w, totalWithdrawn: w.totalWithdrawn + target.amount }
            : w
        ),
        walletTransactions: [newTx, ...prev.walletTransactions],
        notifications: pushNotification(prev.notifications, {
          userId: target.guideId,
          title: `Lệnh rút tiền ${id} (${formatMoney(target.amount)}) đã chuyển khoản!`,
          content: `Admin đã chuyển khoản vào ${target.bankName} (${target.bankAccountNumber}). Mã tham chiếu: ${refCode}.`,
          type: 'WALLET',
          actionUrl: '/guide/vi',
        }),
      };
    });
  };

  const rejectWithdrawal = (id: string, adminNote?: string) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'PENDING') return;

    const note =
      adminNote?.trim() ||
      'Sai thông tin tên chủ tài khoản ngân hàng — đã hoàn trả số dư về ví khả dụng.';

    setState((prev) => ({
      ...prev,
      withdrawals: prev.withdrawals.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'REJECTED',
              adminNote: note,
              processedAt: new Date().toISOString(),
            }
          : w
      ),
      wallets: prev.wallets.map((w) =>
        w.guideId === target.guideId
          ? { ...w, availableBalance: w.availableBalance + target.amount }
          : w
      ),
      notifications: pushNotification(prev.notifications, {
        userId: target.guideId,
        title: `Lệnh rút tiền ${id} bị từ chối — Đã hoàn tiền về ví`,
        content: `Lý do: "${note}". Số tiền ${formatMoney(
          target.amount
        )} đã được cộng trả lại vào số dư khả dụng.`,
        type: 'WALLET',
        actionUrl: '/guide/vi',
      }),
    }));
  };

  // ── 12. QUẢN TRỊ ADMIN: TÀI KHOẢN & DUYỆT KYC (UC.06, UC.10) ──
  const toggleUserLock = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, isLocked: !u.isLocked } : u
      ),
    }));
  };

  const revokeGuideVerification = (userId: string) => {
    setState((prev) => ({
      ...prev,
      guideProfiles: prev.guideProfiles.map((gp) =>
        gp.userId === userId
          ? { ...gp, isVerified: false, kycStatus: 'REJECTED' }
          : gp
      ),
    }));
  };

  const addVerifiedGuide = (userId: string) => {
    approveKyc(userId, 'Được Admin kích hoạt xác minh trực tiếp.');
  };

  const approveKyc = (guideId: string, note?: string) => {
    setState((prev) => {
      const nextProfiles = prev.guideProfiles.map((gp) =>
        gp.userId === guideId
          ? { ...gp, isVerified: true, kycStatus: 'APPROVED' as const }
          : gp
      );
      const nextKyc = prev.kycRecords.map((k) =>
        k.guideId === guideId
          ? {
              ...k,
              status: 'APPROVED' as const,
              reviewedAt: new Date().toISOString(),
              reviewNote: note || 'Hồ sơ KYC hợp lệ, đủ điều kiện hoạt động tại Đà Nẵng.',
            }
          : k
      );
      const nextNotifs = pushNotification(prev.notifications, {
        userId: guideId,
        title: 'Chúc mừng! Hồ sơ KYC của bạn đã được phê duyệt (APPROVED)',
        content:
          'Tài khoản Hướng dẫn viên của bạn đã có huy hiệu Đã xác minh và hiển thị công khai cho Du khách. Bạn có thể mở lịch rảnh ngay!',
        type: 'KYC',
        actionUrl: '/guide/lich-ranh',
      });

      syncToCloud({ guideProfiles: nextProfiles, kycRecords: nextKyc, notifications: nextNotifs });

      return {
        ...prev,
        guideProfiles: nextProfiles,
        kycRecords: nextKyc,
        notifications: nextNotifs,
      };
    });
  };

  const rejectKyc = (guideId: string, note?: string) => {
    const rejectNote =
      note?.trim() || 'Ảnh chụp CCCD bị mờ hoặc thiếu mặt sau, vui lòng tải lại ảnh rõ nét.';
    setState((prev) => {
      const nextProfiles = prev.guideProfiles.map((gp) =>
        gp.userId === guideId
          ? { ...gp, isVerified: false, kycStatus: 'REJECTED' as const }
          : gp
      );
      const nextKyc = prev.kycRecords.map((k) =>
        k.guideId === guideId
          ? {
              ...k,
              status: 'REJECTED' as const,
              reviewedAt: new Date().toISOString(),
              reviewNote: rejectNote,
            }
          : k
      );
      const nextNotifs = pushNotification(prev.notifications, {
        userId: guideId,
        title: 'Hồ sơ KYC cần bổ sung thông tin',
        content: `Phản hồi từ Admin: "${rejectNote}". Vui lòng cập nhật lại hồ sơ KYC.`,
        type: 'KYC',
        actionUrl: '/guide/kyc',
      });

      syncToCloud({ guideProfiles: nextProfiles, kycRecords: nextKyc, notifications: nextNotifs });

      return {
        ...prev,
        guideProfiles: nextProfiles,
        kycRecords: nextKyc,
        notifications: nextNotifs,
      };
    });
  };

  const resetAllDataToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(getDefaultState());
  };

  /**
   * QĐ-09: Admin xác nhận đối soát thủ công đơn chưa thanh toán 70%
   */
  const adminReconcilePayment = (bookingId: string, adminNote?: string): ActionResult => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn đặt lịch này.' };
    if (target.paymentStatus === 'PAID') {
      return { ok: false, message: 'Đơn này đã được quyết toán 100% trước đó.' };
    }

    const platformFee = Math.round(target.totalAmount * target.feeRate);
    const addition = target.totalAmount - platformFee;

    const reconcilePayment: Payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      type: 'final',
      method: target.paymentMethod || 'ONLINE',
      gateway: 'BANK_CARD',
      amount: target.remainingAmount,
      result: 'success',
      referenceCode: `RECONCILE-ADMIN-${bookingId}`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const currentWallet =
        prev.wallets.find((w) => w.guideId === target.guideId) || {
          guideId: target.guideId,
          availableBalance: 0,
          pendingBalance: 0,
          totalWithdrawn: 0,
        };
      const updatedBalance = currentWallet.availableBalance + addition;

      const newTx: WalletTransaction = {
        id: `wtx-${Date.now()}`,
        guideId: target.guideId,
        bookingId,
        type: 'SETTLEMENT_ONLINE',
        amount: addition,
        balanceAfter: updatedBalance,
        description: `Admin đối soát thủ công đơn ${bookingId}: ${adminNote || 'Đã kiểm tra cổng thanh toán'}`,
        formulaNote: `Tổng G (${formatMoney(target.totalAmount)}) − Phí sàn (${formatMoney(platformFee)}) = +${formatMoney(addition)}`,
        createdAt: new Date().toISOString(),
      };

      const nextBookings = prev.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, bookingStatus: 'COMPLETED' as const, paymentStatus: 'PAID' as const }
          : b
      );
      const nextWallets = prev.wallets.map((w) =>
        w.guideId === target.guideId
          ? { ...w, availableBalance: updatedBalance }
          : w
      );
      const nextWalletTxs = [newTx, ...prev.walletTransactions];
      const nextNotifs = [
        {
          id: `notif-${Date.now()}-1`,
          userId: target.touristId,
          title: `Đơn ${bookingId} đã hoàn tất đối soát`,
          content: `Quản trị viên đã xác nhận giao dịch tất toán 70% thành công.`,
          type: 'BOOKING' as const,
          bookingId,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `notif-${Date.now()}-2`,
          userId: target.guideId,
          title: `Ví đã cộng tiền đơn ${bookingId}`,
          content: `Ví của bạn đã được cộng +${formatMoney(addition)} sau khi Admin hoàn tất đối soát.`,
          type: 'WALLET' as const,
          bookingId,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ];

      syncToCloud({
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      });

      return {
        ...prev,
        payments: [reconcilePayment, ...prev.payments],
        bookings: nextBookings,
        wallets: nextWallets,
        walletTransactions: nextWalletTxs,
        notifications: nextNotifs,
      };
    });

    return { ok: true, message: `Đã đối soát thủ công đơn ${bookingId} thành công!` };
  };

  return (
    <BookingContext.Provider
      value={{
        isCloudConnected: isSupabaseConfigured,
        uploadFile: uploadFileToSupabase,
        bookings: state.bookings,
        slots: state.slots,
        reviews: state.reviews,
        verifiedGuides,
        allGuides,
        allUsers: state.users,
        currentUser,
        setCurrentUser,
        switchRoleQuickly,
        login,
        registerAccount,
        logout,
        updateUserProfile,
        feeRate: state.feeRate,
        feeHistory: state.feeHistory,
        updateFeeRate,
        kycRecords: state.kycRecords,
        wallets: state.wallets,
        walletBalance,
        walletTransactions: state.walletTransactions,
        withdrawals: state.withdrawals,
        disputes: state.disputes,
        cancellations: state.cancellations,
        messages: state.messages,
        payments: state.payments,
        notifications: state.notifications,
        getBookingById,
        getGuideById,
        getUserById,
        getWalletByGuideId,
        getDisputeByBookingId,
        getReviewByBookingId,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendMessage,
        createBooking,
        payDeposit,
        expireDeposit,
        expirePendingBooking,
        autoConfirmCompletionTimeout,
        cancelBooking,
        confirmCompletion,
        payFinal,
        submitDispute,
        submitReview,
        replyToReview,
        acceptBooking,
        rejectBooking,
        requestCompletion,
        confirmCashPayment,
        guideCancelBooking,
        toggleSlotAvailability,
        addAvailabilitySlot,
        updateAvailabilitySlot,
        removeAvailabilitySlot,
        updateGuidePrice,
        submitKycApplication,
        requestWithdrawal,
        toggleUserLock,
        revokeGuideVerification,
        addVerifiedGuide,
        approveKyc,
        rejectKyc,
        approveWithdrawal,
        rejectWithdrawal,
        resolveDispute,
        adminReconcilePayment,
        resetAllDataToDefault,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookingContext must be used within BookingProvider');
  return context;
};
