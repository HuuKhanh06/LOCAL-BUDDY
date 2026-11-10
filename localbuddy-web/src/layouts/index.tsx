// layouts/index.tsx – Hệ thống Layout chuẩn 4 phân hệ (Public, Tourist, Guide, Admin)
// Bảng màu chuẩn: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import {
  Header,
  TouristBottomNav,
  DashboardSidebarContent,
  DashboardNavLink,
} from '../components/layout/Header';
import { useBookingContext } from '../context/BookingContext';
import { formatMoney } from '../utils/money';
import { Logo } from '../components/common/Logo';

const CommercialFooter: React.FC = () => {
  return (
    <footer className="bg-[#F5E5D5] text-[#6E6259] border-t border-[#EAD7C2] mt-16 py-10">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <span className="text-[14px] font-bold text-[#1C1917] block">
              LocalBuddy Đà Nẵng
            </span>
            <span className="text-[12px] text-[#78716C]">
              Đặt Thổ địa bản xứ theo giờ • Cọc 30% giữ chỗ nguyên tử • Hoàn 100% trước 48h
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[13px] font-semibold text-[#6E6259]">
          <Link to="/how-it-works" className="hover:text-[#D12B79] transition-colors">
            Giới thiệu
          </Link>
          <Link to="/become-a-guide" className="hover:text-[#D12B79] transition-colors">
            Trở thành Thổ địa
          </Link>
          <Link to="/cancellation-policy" className="hover:text-[#D12B79] transition-colors">
            Chính sách hủy đơn
          </Link>
          <Link to="/safety" className="hover:text-[#D12B79] transition-colors">
            An toàn & Tin cậy
          </Link>
          <Link to="/faq" className="hover:text-[#D12B79] transition-colors">
            Câu hỏi thường gặp
          </Link>
        </div>
      </div>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-6 pt-4 border-t border-[#EAD7C2] text-center text-[12px] text-[#78716C]">
        © 2026 LocalBuddy Đà Nẵng. Nền tảng kết nối Thổ địa bản xứ theo giờ hàng đầu tại Đà Nẵng.
      </div>
    </footer>
  );
};

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FEEDDC] text-[#1C1917] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 w-full mx-auto">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

export const TouristLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FEEDDC] text-[#1C1917] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

// ---------- Dashboard Shell ----------
const DashboardShell: React.FC<{
  portalTitle: string;
  headerTitle: string;
  roleBadgeText: string;
  notifLink: string;
  searchPlaceholder: string;
  onSearchSubmit: (q: string) => void;
  links: DashboardNavLink[];
  defaultUserName: string;
}> = ({
  portalTitle,
  headerTitle,
  roleBadgeText,
  notifLink,
  searchPlaceholder,
  onSearchSubmit,
  links,
  defaultUserName,
}) => {
  const navigate = useNavigate();
  const { currentUser, notifications } = useBookingContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const isMatchUser = (n: { userId?: string; type?: string }) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') {
      return n.userId === currentUser.id || n.userId === 'u-admin-1' || n.type === 'BOOKING';
    }
    return n.userId === currentUser.id;
  };

  const unreadNotifs = notifications.filter(
    (n) => !n.isRead && isMatchUser(n)
  ).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(quickSearch.trim());
    setQuickSearch('');
  };

  const displayName = currentUser?.fullName || defaultUserName;

  return (
    <div className="min-h-screen flex bg-[var(--lb-bg)] text-[var(--lb-text)]">
      <aside className="hidden lg:block w-[240px] shrink-0 min-h-screen sticky top-0 h-screen border-r border-[var(--lb-border)]">
        <DashboardSidebarContent portalTitle={portalTitle} links={links} />
      </aside>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="h-full shadow-xl bg-[var(--lb-surface)]" onClick={(e) => e.stopPropagation()}>
            <DashboardSidebarContent
              portalTitle={portalTitle}
              links={links}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[var(--lb-surface)]/95 backdrop-blur-md text-[var(--lb-text)] border-b border-[var(--lb-border)] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className="lg:hidden p-2 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[var(--lb-text)] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[var(--lb-text)] truncate">
              {headerTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center bg-[var(--lb-surface-2)] border border-[var(--lb-border)] rounded-full px-3.5 h-9 w-48 md:w-60"
            >
              <Search className="w-3.5 h-3.5 text-[var(--lb-muted)] mr-2 shrink-0" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="bg-transparent text-xs text-[var(--lb-text)] placeholder:text-[var(--lb-muted)] w-full focus:outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => navigate(notifLink)}
              aria-label="Thông báo"
              className="relative p-2 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[var(--lb-text)] cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 bg-[var(--lb-surface-2)] border border-[var(--lb-border)] pl-1 pr-3 py-1 rounded-full">
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                }
                alt={displayName}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="hidden md:block text-left">
                <span className="block text-[12px] font-bold text-[var(--lb-text)] leading-tight max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="block text-[10px] text-[var(--lb-muted)] font-medium">
                  {roleBadgeText}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1320px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const GuideLayout: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, bookings, walletBalance, notifications } = useBookingContext();

  const guideId = currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const pendingCount = bookings.filter(
    (b) => b.guideId === guideId && b.bookingStatus === 'PENDING'
  ).length;
  const unreadGuideNotifs = notifications.filter(
    (n) => !n.isRead && n.userId === guideId
  ).length;

  const guideLinks: DashboardNavLink[] = [
    { to: '/guide/don-den', label: 'Yêu cầu đến', icon: '🔔', badge: pendingCount },
    { to: '/guide/don-va-ca', label: 'Lịch & Ca dẫn', icon: '📋' },
    { to: '/guide/lich-ranh', label: 'Lịch rảnh', icon: '📅' },
    { to: '/guide/vi', label: 'Ví & Rút tiền', icon: '💰', sub: formatMoney(walletBalance) },
    { to: '/guide/ho-so', label: 'Hồ sơ & Giá', icon: '👤' },
    { to: '/guide/kyc', label: 'Định danh KYC', icon: '🪪' },
    { to: '/guide/thong-bao', label: 'Thông báo', icon: '📣', badge: unreadGuideNotifs },
  ];

  return (
    <DashboardShell
      portalTitle="Guide"
      headerTitle="Hướng dẫn viên Đà Nẵng"
      roleBadgeText="Local Guide"
      notifLink="/guide/thong-bao"
      searchPlaceholder="Tìm đơn..."
      onSearchSubmit={() => navigate('/guide/don-va-ca')}
      links={guideLinks}
      defaultUserName="Dương Đăng Huân"
    />
  );
};

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, kycRecords, disputes, withdrawals, bookings, notifications } = useBookingContext();

  const pendingKycCount = kycRecords.filter((k) => k.status === 'PENDING').length;
  const openDisputesCount = disputes.filter((d) => d.status === 'OPEN').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const pendingBookingsCount = bookings.filter((b) => b.bookingStatus === 'PENDING').length;

  const adminId = currentUser?.id || 'u-admin-1';
  const unreadAdminNotifs = notifications.filter(
    (n) => !n.isRead && (n.userId === adminId || n.userId === 'u-admin-1' || n.type === 'BOOKING')
  ).length;

  const adminLinks: DashboardNavLink[] = [
    { to: '/admin/thong-bao', label: 'Thông báo', icon: '🔔', badge: unreadAdminNotifs },
    { to: '/admin/giam-sat', label: 'Giám sát đơn', icon: '📋', badge: pendingBookingsCount },
    { to: '/admin/kyc', label: 'Duyệt KYC', icon: '🪪', badge: pendingKycCount },
    { to: '/admin/tranh-chap', label: 'Tranh chấp', icon: '⚖️', badge: openDisputesCount },
    { to: '/admin/rut-tien', label: 'Rút tiền', icon: '💰', badge: pendingWithdrawalsCount },
    { to: '/admin/tai-khoan', label: 'Tài khoản', icon: '👥' },
    { to: '/admin/bao-cao', label: 'Doanh thu', icon: '📊' },
    { to: '/admin/phi-san', label: 'Phí sàn', icon: '⚙️' },
  ];

  return (
    <DashboardShell
      portalTitle="Admin"
      headerTitle="Quản trị LocalBuddy"
      roleBadgeText="Admin"
      notifLink="/admin/thong-bao"
      searchPlaceholder="Tìm kiếm..."
      onSearchSubmit={(q) =>
        navigate(q.toUpperCase().startsWith('BK-') ? '/admin/tranh-chap' : '/admin/tai-khoan')
      }
      links={adminLinks}
      defaultUserName="Lê Văn Hoàng"
    />
  );
};
