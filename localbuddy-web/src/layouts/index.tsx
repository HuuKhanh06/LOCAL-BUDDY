// layouts/index.tsx – Hệ thống Layout thương mại chuẩn:
// 1. PublicLayout & TouristLayout: Sticky Header + Burgundy Footer (#1A0A0F) + TouristBottomNav trên mobile (Trang chủ, Tìm HDV, Đặt lịch của tôi, Tin nhắn, Tài khoản).
// 2. GuideLayout & AdminLayout (Dashboard): Sidebar 240px màu Navy (#1C1C28) trên desktop, thu thành Drawer trượt trên mobile; Topbar có tìm nhanh, chuông thông báo có số đếm, Avatar kèm badge vai trò.

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
    <footer className="bg-[#1A0A0F] text-[#F6E6EA] border-t border-white/10 mt-16">
      <div className="max-w-[1280px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] flex items-center justify-center font-black text-[16px]">
              LB
            </div>
            <span className="text-[18px] font-extrabold text-white">
              LocalBuddy Đà Nẵng
            </span>
          </div>
          <p className="text-[13px] text-[#F6E6EA]/80 leading-relaxed">
            Nền tảng kết nối và đặt lịch Hướng dẫn viên du lịch bản địa THEO GIỜ tại Đà Nẵng. Trải nghiệm cá nhân hóa như đi cùng một người bạn địa phương thực thụ.
          </p>
          <div className="text-[12px] text-[#1EC1CB] font-semibold">
            📍 Hải Châu & Sơn Trà, TP. Đà Nẵng
          </div>
        </div>

        <div>
          <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-3">
            Điểm đến Đà Nẵng nổi bật
          </h4>
          <ul className="space-y-2 text-[13px] text-[#F6E6EA]/80">
            <li>
              <Link to="/guides?area=Cầu+Rồng+%26+Sông+Hàn" className="hover:text-[#1EC1CB]">
                • Cầu Rồng & Du thuyền Sông Hàn
              </Link>
            </li>
            <li>
              <Link to="/guides?area=Bán+đảo+Sơn+Trà" className="hover:text-[#1EC1CB]">
                • Bán đảo Sơn Trà & Chùa Linh Ứng
              </Link>
            </li>
            <li>
              <Link to="/guides?area=Ngũ+Hành+Sơn" className="hover:text-[#1EC1CB]">
                • Danh thắng Ngũ Hành Sơn
              </Link>
            </li>
            <li>
              <Link to="/guides?area=Bà+Nà+Hills" className="hover:text-[#1EC1CB]">
                • Bà Nà Hills & Cầu Vàng
              </Link>
            </li>
            <li>
              <Link to="/guides?area=Chợ+Cồn+%26+Chợ+Hàn" className="hover:text-[#1EC1CB]">
                • Food Tour Chợ Cồn & Chợ Hàn
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-3">
            Hệ thống & Phân khu
          </h4>
          <ul className="space-y-2 text-[13px] text-[#F6E6EA]/80">
            <li>
              <Link to="/guides" className="hover:text-[#1EC1CB]">
                Tìm kiếm HDV theo giờ
              </Link>
            </li>
            <li>
              <Link to="/don-cua-toi" className="hover:text-[#1EC1CB]">
                Quản lý đơn đặt lịch của tôi
              </Link>
            </li>
            <li>
              <Link to="/dang-ky" className="hover:text-[#1EC1CB]">
                Đăng ký trở thành Local Guide
              </Link>
            </li>
            <li>
              <Link to="/guide/don-den" className="hover:text-[#1EC1CB]">
                Bảng điều khiển Hướng dẫn viên
              </Link>
            </li>
            <li>
              <Link to="/admin/kyc" className="hover:text-[#1EC1CB]">
                Cổng Quản trị viên (Admin Portal)
              </Link>
            </li>
            <li>
              <Link to="/design-system" className="text-[#1EC1CB] font-semibold hover:underline">
                🎨 Thư viện Design System (`/design-system`)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-3">
            Chính sách bảo vệ & Minh bạch
          </h4>
          <ul className="space-y-2 text-[12px] text-[#F6E6EA]/80 leading-relaxed">
            <li>✓ Đặt cọc 30% giữ lịch nguyên tử 15 phút</li>
            <li>✓ Tất toán 70% còn lại sau khi hoàn thành chuyến đi</li>
            <li>✓ Hủy trước 48 giờ: Hoàn 100% tiền cọc</li>
            <li>✓ Hủy từ 24–48 giờ: Hoàn 50% tiền cọc</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              resetAllDataToDefault();
              showToast('Đã khôi phục toàn bộ dữ liệu mẫu về mặc định!', 'success');
            }}
            className="mt-4 px-3 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[12px] text-[#1EC1CB] font-semibold cursor-pointer"
          >
            🔄 Khôi phục dữ liệu mẫu gốc
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-[12px] text-[#F6E6EA]/60 px-4">
        © 2026 LocalBuddy Đà Nẵng — Nền tảng Đặt lịch Hướng dẫn viên Địa phương Theo giờ.
      </div>
    </footer>
  );
};

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4F6] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

export const TouristLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF4F6] pb-16 lg:pb-0">
      <Header role="tourist" />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <CommercialFooter />
      <TouristBottomNav />
    </div>
  );
};

// ---------- Dashboard Shell dùng chung cho Guide & Admin (Sidebar 240px Navy + Mobile Drawer + Topbar) ----------
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
    <div className="min-h-screen flex bg-[#FBF4F6]">
      {/* Sidebar cố định 240px màu Navy trên Desktop */}
      <aside className="hidden lg:block w-[240px] shrink-0 min-h-screen sticky top-0 h-screen">
        <DashboardSidebarContent portalTitle={portalTitle} links={links} />
      </aside>

      {/* Drawer trượt trên Mobile & Tablet (<1024px) */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-[#1C1C28]/65 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardSidebarContent
              portalTitle={portalTitle}
              links={links}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Khu vực Nội dung chính + Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#1A0A0F] text-white border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở thanh điều hướng Dashboard"
              className="lg:hidden p-2 rounded-[10px] bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-white truncate">
              {headerTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Ô tìm nhanh trên Topbar */}
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center bg-white/10 border border-white/15 focus-within:border-[#1EC1CB] rounded-[10px] px-3 h-9 w-48 md:w-64"
            >
              <Search className="w-3.5 h-3.5 text-[#1EC1CB] mr-2 shrink-0" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="bg-transparent text-xs text-white placeholder:text-white/60 w-full focus:outline-none"
              />
            </form>

            {/* Chuông thông báo có số đếm */}
            <button
              type="button"
              onClick={() => navigate(notifLink)}
              aria-label="Thông báo hệ thống"
              className="relative p-2 rounded-[10px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1EC1CB] text-[#1C1C28] text-[10px] font-black flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Avatar kèm Badge vai trò */}
            <div className="flex items-center gap-2.5 bg-white/10 px-2.5 py-1 rounded-[12px]">
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                }
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-[#1EC1CB]"
              />
              <div className="hidden md:block text-left">
                <span className="block text-[12px] font-bold text-white leading-tight max-w-[130px] truncate">
                  {displayName}
                </span>
                <span className="inline-block px-1.5 py-0.2 rounded bg-[#1EC1CB] text-[#1C1C28] text-[9px] font-black uppercase tracking-wider">
                  {roleBadgeText}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1280px] w-full mx-auto">
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
    {
      to: '/guide/don-den',
      label: 'Yêu cầu đặt lịch đến',
      icon: '🔔',
      badge: pendingCount,
    },
    {
      to: '/guide/don-va-ca',
      label: 'Lịch làm việc & Ca dẫn',
      icon: '📋',
    },
    {
      to: '/guide/lich-ranh',
      label: 'Quản lý Lịch rảnh',
      icon: '📅',
    },
    {
      to: '/guide/vi',
      label: 'Ví & Rút tiền',
      icon: '💰',
      sub: formatMoney(walletBalance),
    },
    {
      to: '/guide/ho-so',
      label: 'Hồ sơ & Đơn giá/giờ',
      icon: '👤',
    },
    {
      to: '/guide/kyc',
      label: 'Định danh KYC',
      icon: '🪪',
    },
    {
      to: '/guide/tin-nhan',
      label: 'Tin nhắn theo đơn',
      icon: '💬',
      badge: unreadChat,
    },
    {
      to: '/guide/thong-bao',
      label: 'Trung tâm Thông báo',
      icon: '📣',
    },
  ];

  return (
    <DashboardShell
      portalTitle="Guide Dashboard"
      headerTitle="Không gian làm việc Hướng dẫn viên Đà Nẵng"
      roleBadgeText="Local Guide"
      notifLink="/guide/thong-bao"
      searchPlaceholder="Tìm nhanh đơn đặt lịch..."
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
    {
      to: '/admin/kyc',
      label: 'Thẩm định KYC HDV',
      icon: '🪪',
      badge: pendingKycCount,
      sub: 'UC.10',
    },
    {
      to: '/admin/tranh-chap',
      label: 'Xử lý Tranh chấp',
      icon: '⚖️',
      badge: openDisputesCount,
      sub: 'UC.27',
    },
    {
      to: '/admin/rut-tien',
      label: 'Duyệt Rút tiền',
      icon: '💰',
      badge: pendingWithdrawalsCount,
      sub: 'UC.23',
    },
    {
      to: '/admin/tai-khoan',
      label: 'Quản lý Người dùng',
      icon: '👥',
      sub: 'UC.06',
    },
    {
      to: '/admin/bao-cao',
      label: 'Thống kê & Doanh thu',
      icon: '📊',
      sub: 'UC.28',
    },
    {
      to: '/admin/phi-san',
      label: 'Chính sách & Nhật ký',
      icon: '⚙️',
      sub: 'UC.29',
    },
  ];

  return (
    <DashboardShell
      portalTitle="Admin Portal"
      headerTitle="Hệ thống Quản trị & Vận hành LocalBuddy Đà Nẵng"
      roleBadgeText="Admin"
      notifLink="/thong-bao"
      searchPlaceholder="Tìm người dùng, mã đơn..."
      onSearchSubmit={(q) =>
        navigate(q.toUpperCase().startsWith('BK-') ? '/admin/tranh-chap' : '/admin/tai-khoan')
      }
      links={adminLinks}
      defaultUserName="Lê Văn Hoàng"
    />
  );
};
