import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PublicLayout, TouristLayout, GuideLayout, AdminLayout } from '../layouts';
import { useBookingContext } from '../context/BookingContext';
import { UserRole } from '../types';
import { LoadingState } from '../components/common/GuideCard';

// Lazy-loaded Public Pages
const HomePage = lazy(() =>
  import('../pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const ForbiddenPage = lazy(() =>
  import('../pages/public/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage }))
);
const NotFoundPage = lazy(() =>
  import('../pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const RegisterPage = lazy(() =>
  import('../pages/tourist/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const LoginPage = lazy(() =>
  import('../pages/tourist/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/tourist/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const GuideSearchPage = lazy(() =>
  import('../pages/tourist/GuideSearchPage').then((m) => ({ default: m.GuideSearchPage }))
);
const GuideProfilePage = lazy(() =>
  import('../pages/tourist/GuideProfilePage').then((m) => ({ default: m.GuideProfilePage }))
);
const BookingFormPage = lazy(() =>
  import('../pages/tourist/BookingFormPage').then((m) => ({ default: m.BookingFormPage }))
);
const DepositPaymentPage = lazy(() =>
  import('../pages/tourist/DepositPaymentPage').then((m) => ({ default: m.DepositPaymentPage }))
);
const MyBookingsPage = lazy(() =>
  import('../pages/tourist/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage }))
);
const BookingDetailPage = lazy(() =>
  import('../pages/tourist/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage }))
);
const BalancePaymentPage = lazy(() =>
  import('../pages/tourist/BalancePaymentPage').then((m) => ({ default: m.BalancePaymentPage }))
);
const NotificationsPage = lazy(() =>
  import('../pages/tourist/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const ProfileSettingsPage = lazy(() =>
  import('../pages/tourist/ProfileSettingsPage').then((m) => ({
    default: m.ProfileSettingsPage,
  }))
);

// Static Public Pages
const HowItWorksPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.HowItWorksPage }))
);
const BecomeGuidePage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.BecomeGuidePage }))
);
const CancellationPolicyPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.CancellationPolicyPage }))
);
const SafetyPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.SafetyPage }))
);
const FaqPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.FaqPage }))
);
const TermsPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.PrivacyPage }))
);
const ContactPage = lazy(() =>
  import('../pages/public/StaticPages').then((m) => ({ default: m.ContactPage }))
);

// Lazy-loaded Guide Pages
const IncomingRequestsPage = lazy(() =>
  import('../pages/guide/IncomingRequestsPage').then((m) => ({
    default: m.IncomingRequestsPage,
  }))
);
const AvailabilityPage = lazy(() =>
  import('../pages/guide/AvailabilityPage').then((m) => ({ default: m.AvailabilityPage }))
);
const MyBookingsAndShiftsPage = lazy(() =>
  import('../pages/guide/MyBookingsAndShiftsPage').then((m) => ({
    default: m.MyBookingsAndShiftsPage,
  }))
);
const ProfileAndPricePage = lazy(() =>
  import('../pages/guide/ProfileAndPricePage').then((m) => ({ default: m.ProfileAndPricePage }))
);
const WalletPage = lazy(() =>
  import('../pages/guide/WalletPage').then((m) => ({ default: m.WalletPage }))
);
const KycSubmissionPage = lazy(() =>
  import('../pages/guide/KycSubmissionPage').then((m) => ({ default: m.KycSubmissionPage }))
);

// Lazy-loaded Admin Pages
const AdminLoginPage = lazy(() =>
  import('../pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const KycReviewPage = lazy(() =>
  import('../pages/admin/KycReviewPage').then((m) => ({ default: m.KycReviewPage }))
);
const DisputesPage = lazy(() =>
  import('../pages/admin/DisputesPage').then((m) => ({ default: m.DisputesPage }))
);
const AccountsPage = lazy(() =>
  import('../pages/admin/AccountsPage').then((m) => ({ default: m.AccountsPage }))
);
const PayoutsPage = lazy(() =>
  import('../pages/admin/PayoutsPage').then((m) => ({ default: m.PayoutsPage }))
);
const ReportsPage = lazy(() =>
  import('../pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const FeeConfigPage = lazy(() =>
  import('../pages/admin/FeeConfigPage').then((m) => ({ default: m.FeeConfigPage }))
);

const RouteSkeletonFallback: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <LoadingState message="Đang tải màn hình..." rows={3} />
  </div>
);

/**
 * Bộ bảo vệ phân quyền RBAC & Chặn tài khoản bị khóa (UC.06, RLS & Auth Guard)
 */
const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser } = useBookingContext();
  const location = useLocation();

  if (!currentUser) {
    const loginPath = allowedRoles.includes('admin')
      ? '/admin/dang-nhap'
      : `/dang-nhap?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={loginPath} replace />;
  }

  if (currentUser.isLocked) {
    return (
      <div className="min-h-screen bg-[var(--lb-bg)] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[20px] p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--lb-surface-2)] text-[var(--lb-error)] flex items-center justify-center text-3xl mx-auto font-black">
            🔒
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--lb-surface-2)] text-[var(--lb-error)] text-xs font-bold uppercase tracking-wider">
            Tài khoản bị tạm khóa (UC.06)
          </span>
          <h1 className="text-xl font-bold text-[var(--lb-text)]">
            Tài khoản {currentUser.fullName} đang bị tạm khóa
          </h1>
          <p className="text-xs text-[var(--lb-muted)] leading-relaxed">
            Tài khoản của bạn ({currentUser.email}) đã bị Quản trị viên tạm khóa do có hành vi vi phạm quy tắc cộng đồng hoặc hủy đơn quá số lần quy định ({currentUser.violationCount} lần vi phạm).
          </p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(currentUser.role)) {
    const targetRole = allowedRoles[0];
    return <Navigate to={`/403?required=${targetRole}`} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteSkeletonFallback />}>
      <Routes>
        {/* Admin Login Standalone (UC.04) */}
        <Route path="/admin/dang-nhap" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<Navigate to="/admin/dang-nhap" replace />} />

        {/* Public Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/register" element={<Navigate to="/dang-ky" replace />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password" element={<Navigate to="/quen-mat-khau" replace />} />
          <Route path="/verify-email" element={<Navigate to="/dang-nhap?verified=1" replace />} />
          <Route path="/xac-minh-email" element={<Navigate to="/dang-nhap?verified=1" replace />} />
          <Route path="/guides" element={<GuideSearchPage />} />
          <Route path="/guides/:id" element={<GuideProfilePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/become-a-guide" element={<BecomeGuidePage />} />
          <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
        </Route>

        {/* Tourist Layout (Protected by RBAC RoleGuard) */}
        <Route
          element={
            <RoleGuard allowedRoles={['tourist', 'admin']}>
              <TouristLayout />
            </RoleGuard>
          }
        >
          <Route path="/dat-lich/:guideId" element={<BookingFormPage />} />
          <Route path="/don-cua-toi" element={<MyBookingsPage />} />
          <Route path="/don/:id" element={<BookingDetailPage />} />
          <Route path="/don/:id/dat-coc" element={<DepositPaymentPage />} />
          <Route path="/don/:id/thanh-toan-70" element={<BalancePaymentPage />} />
          <Route path="/thong-bao" element={<NotificationsPage />} />
          <Route path="/ho-so-ca-nhan" element={<ProfileSettingsPage />} />
        </Route>

        {/* Guide Layout (Protected by RBAC RoleGuard) */}
        <Route
          element={
            <RoleGuard allowedRoles={['guide', 'admin']}>
              <GuideLayout />
            </RoleGuard>
          }
        >
          <Route path="/guide" element={<Navigate to="/guide/don-den" replace />} />
          <Route path="/guide/don-den" element={<IncomingRequestsPage />} />
          <Route path="/guide/don-va-ca" element={<MyBookingsAndShiftsPage />} />
          <Route path="/guide/lich-ranh" element={<AvailabilityPage />} />
          <Route path="/guide/vi" element={<WalletPage />} />
          <Route path="/guide/ho-so" element={<ProfileAndPricePage />} />
          <Route path="/guide/kyc" element={<KycSubmissionPage />} />
          <Route path="/guide/thong-bao" element={<NotificationsPage />} />
        </Route>

        {/* Admin Layout (Protected by RBAC RoleGuard) */}
        <Route
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/kyc" replace />} />
          <Route path="/admin/kyc" element={<KycReviewPage />} />
          <Route path="/admin/duyet-kyc" element={<KycReviewPage />} />
          <Route path="/admin/tranh-chap" element={<DisputesPage />} />
          <Route path="/admin/tai-khoan" element={<AccountsPage />} />
          <Route path="/admin/rut-tien" element={<PayoutsPage />} />
          <Route path="/admin/bao-cao" element={<ReportsPage />} />
          <Route path="/admin/doi-soat" element={<Navigate to="/admin/bao-cao?tab=reconcile" replace />} />
          <Route path="/admin/giam-sat" element={<Navigate to="/admin/bao-cao?tab=monitoring" replace />} />
          <Route path="/admin/phi-san" element={<FeeConfigPage />} />
        </Route>

        {/* 404 Not Found Page */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
