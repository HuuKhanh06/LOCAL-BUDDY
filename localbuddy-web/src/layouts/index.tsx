// layouts/index.tsx – Hệ thống Layout tối giản 1 tông nền sáng (#FAF9F6 / #FFFFFF), rất ít chữ.

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
import { useToast } from '../components/ui/Toast';
import { formatMoney } from '../utils/money';

const CommercialFooter: React.FC = () => {
  const { resetAllDataToDefault } = useBookingContext();
  const { showToast } = useToast();

  return (
    <footer className="bg-[#FAF9F6] text-[#57534E] border-t border-[#E7E5E4] mt-16">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-black text-[13px]">
            LB
          </div>
          <div>
            <span className="text-[15px] font-bold text-[#1C1917] block">
              LocalBuddy Đà Nẵng
            </span>
            <span className="text-[12px] text-[#78716C]">
              Hướng dẫn viên bản địa theo giờ • Cọc 30% • Hoàn 100% trước 48h
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[13px] font-medium text-[#57534E]">
          <Link to="/guides?area=Bán+đảo+Sơn+Trà" className="hover:text-[#1C1917]">
            Sơn Trà
          </Link>
          <Link to="/guides?area=Ngũ+Hành+Sơn" className="hover:text-[#1C1917]">
            Ngũ Hành Sơn
          </Link>
          <Link to="/guides?area=Bà+Nà+Hills" className="hover:text-[#1C1917]">
            Bà Nà Hills
          </Link>
          <Link to="/guides?area=Phố+cổ+Hội+An" className="hover:text-[#1C1917]">
            Hội An
          </Link>
          <Link to="/guide/don-den" className="hover:text-[#1C1917]">
            HDV
          </Link>
          <Link to="/admin/kyc" className="hover:text-[#1C1917]">
            Admin
          </Link>
          <Link to="/design-system" className="hover:text-[#1C1917]">
            UI Kit
          </Link>
          <button
            type="button"
            onClick={() => {
              resetAllDataToDefault();
              showToast('Đã khôi phục dữ liệu mẫu!', 'success');
            }}
            className="px-3 py-1 rounded-full bg-[#F3F1EC] hover:bg-[#E7E5E4] text-[12px] text-[#1C1917] font-semibold cursor-pointer"
          >
            🔄 Đặt lại dữ liệu
          </button>
        </div>
      </div>
    </footer>
  );
};

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C1917] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

export const TouristLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C1917] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

// ---------- Dashboard Shell nền sáng đồng nhất ----------
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

  const unreadNotifs = notifications.filter(
    (n) => !n.isRead && (!currentUser || n.userId === currentUser.id)
  ).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(quickSearch.trim());
    setQuickSearch('');
  };

  const displayName = currentUser?.fullName || defaultUserName;

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] text-[#1C1917]">
      <aside className="hidden lg:block w-[240px] shrink-0 min-h-screen sticky top-0 h-screen">
        <DashboardSidebarContent portalTitle={portalTitle} links={links} />
      </aside>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-[#1C1917]/30 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <DashboardSidebarContent
              portalTitle={portalTitle}
              links={links}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#FAF9F6]/90 backdrop-blur-md text-[#1C1917] border-b border-[#E7E5E4] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className="lg:hidden p-2 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#1C1917] truncate">
              {headerTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center bg-white border border-[#E7E5E4] rounded-full px-3.5 h-9 w-48 md:w-60"
            >
              <Search className="w-3.5 h-3.5 text-[#78716C] mr-2 shrink-0" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="bg-transparent text-xs text-[#1C1917] placeholder:text-[#A8A29E] w-full focus:outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => navigate(notifLink)}
              aria-label="Thông báo"
              className="relative p-2 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#1C1917] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] pl-1 pr-3 py-1 rounded-full">
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                }
                alt={displayName}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="hidden md:block text-left">
                <span className="block text-[12px] font-bold text-[#1C1917] leading-tight max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="block text-[10px] text-[#78716C] font-medium">
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
  const { currentUser, bookings, messages, walletBalance } = useBookingContext();

  const guideId = currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const pendingCount = bookings.filter(
    (b) => b.guideId === guideId && b.bookingStatus === 'PENDING'
  ).length;
  const unreadChat = messages.filter(
    (m) => !m.isRead && m.receiverId === guideId
  ).length;

  const guideLinks: DashboardNavLink[] = [
    { to: '/guide/don-den', label: 'Yêu cầu đến', icon: '🔔', badge: pendingCount },
    { to: '/guide/don-va-ca', label: 'Lịch & Ca dẫn', icon: '📋' },
    { to: '/guide/lich-ranh', label: 'Lịch rảnh', icon: '📅' },
    { to: '/guide/vi', label: 'Ví & Rút tiền', icon: '💰', sub: formatMoney(walletBalance) },
    { to: '/guide/ho-so', label: 'Hồ sơ & Giá', icon: '👤' },
    { to: '/guide/kyc', label: 'Định danh KYC', icon: '🪪' },
    { to: '/guide/tin-nhan', label: 'Tin nhắn', icon: '💬', badge: unreadChat },
    { to: '/guide/thong-bao', label: 'Thông báo', icon: '📣' },
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
      defaultUserName="Nguyễn Hữu Khanh"
    />
  );
};

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { kycRecords, disputes, withdrawals } = useBookingContext();

  const pendingKycCount = kycRecords.filter((k) => k.status === 'PENDING').length;
  const openDisputesCount = disputes.filter((d) => d.status === 'OPEN').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  const adminLinks: DashboardNavLink[] = [
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
      notifLink="/thong-bao"
      searchPlaceholder="Tìm kiếm..."
      onSearchSubmit={(q) =>
        navigate(q.toUpperCase().startsWith('BK-') ? '/admin/tranh-chap' : '/admin/tai-khoan')
      }
      links={adminLinks}
      defaultUserName="Lê Văn Hoàng"
    />
  );
};
