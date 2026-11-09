// components/layout/Header.tsx
// Hệ thống điều hướng chuẩn cho:
// 1. Layout Công khai & Tourist: Sticky Header (Logo, Tìm HDV nhanh, Ngôn ngữ Tiếng Việt, Chuông thông báo, Đăng nhập/Đăng ký hoặc Avatar) + TouristBottomNav trên mobile (Trang chủ, Tìm HDV, Đặt lịch của tôi, Tin nhắn, Tài khoản).
// 2. Layout Dashboard (Guide & Admin): Sidebar 240px màu Navy (#1C1C28) trên desktop, thu thành Drawer trên mobile; Topbar có tìm nhanh, chuông thông báo có số đếm, Avatar kèm badge vai trò.
// Tuân thủ nghiêm ngặt: Chữ trên nền Cyan (#1EC1CB) luôn là Navy (#1C1C28).

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Search, Menu, X, Globe } from 'lucide-react';
import { UserRole } from '../../types';
import { useBookingContext } from '../../context/BookingContext';
import { useToast } from '../ui/Toast';
import { formatMoney } from '../../utils/money';

export const Header: React.FC<{ role?: UserRole; userName?: string }> = ({ role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    currentUser,
    notifications,
    messages,
    logout,
    switchRoleQuickly,
  } = useBookingContext();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const activeRole: UserRole = currentUser?.role || propRole || 'tourist';
  const displayUserName = currentUser?.fullName;

  const unreadNotifsCount = notifications.filter(
    (n) => !n.isRead && (!currentUser || n.userId === currentUser.id)
  ).length;

  const unreadMessagesCount = messages.filter(
    (m) => !m.isRead && currentUser && m.receiverId === currentUser.id
  ).length;

  const handleQuickRoleSwitch = (targetRole: UserRole, userId?: string) => {
    const switchedUser = switchRoleQuickly(targetRole, userId);
    showToast(
      `Đã chuyển sang vai trò ${
        targetRole === 'tourist'
          ? 'Du khách'
          : targetRole === 'guide'
            ? 'Hướng dẫn viên'
            : 'Quản trị viên'
      }: ${switchedUser.fullName}`,
      'info'
    );
    if (targetRole === 'tourist') navigate('/');
    if (targetRole === 'guide') navigate('/guide/don-den');
    if (targetRole === 'admin') navigate('/admin/kyc');
  };

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi tài khoản.', 'info');
    navigate('/dang-nhap');
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim();
    navigate(q ? `/guides?q=${encodeURIComponent(q)}` : '/guides');
    setQuickQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1C1C28] text-white border-b border-white/10 shadow-md">
      {/* Thanh trên cùng: Cam kết thương hiệu & Chuyển đổi vai trò kiểm thử nhanh */}
      <div className="bg-[#1A0A0F] border-b border-white/10 text-[12px] text-[#F6E6EA]/90">
        <div className="max-w-[1280px] mx-auto px-4 py-1.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-3">
            <span>📍 Đà Nẵng, Việt Nam</span>
            <span>•</span>
            <span>🛡 Đặt cọc 30% giữ lịch nguyên tử 15 phút</span>
            <span>•</span>
            <span>✓ 100% HDV bản địa xác thực KYC</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-[#F6E6EA]/70 mr-1 hidden sm:inline">
              Chuyển vai trò nhanh:
            </span>
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('tourist', 'u-tourist-1')}
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer',
                activeRole === 'tourist'
                  ? 'bg-[#1EC1CB] text-[#1C1C28]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              🧳 Du khách
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('guide', 'u-guide-1')}
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer',
                activeRole === 'guide'
                  ? 'bg-[#1EC1CB] text-[#1C1C28]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              🧭 HDV Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('admin', 'u-admin-1')}
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer',
                activeRole === 'admin'
                  ? 'bg-[#1EC1CB] text-[#1C1C28]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              ⚖️ Admin Portal
            </button>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng chính (Sticky Header cho Public / Tourist) */}
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-[12px] bg-[#1EC1CB] text-[#1C1C28] flex items-center justify-center font-black text-[18px] shadow-sm">
            LB
          </div>
          <div>
            <span className="text-[19px] font-extrabold tracking-tight text-white block leading-none">
              LocalBuddy
            </span>
            <span className="text-[11px] font-semibold text-[#1EC1CB] tracking-wider uppercase">
              Đà Nẵng • Theo Giờ
            </span>
          </div>
        </Link>

        {/* Ô tìm nhanh HDV trên Header */}
        <form
          onSubmit={handleQuickSearchSubmit}
          className="hidden md:flex items-center bg-white/10 border border-white/15 focus-within:border-[#1EC1CB] rounded-[12px] px-3 h-10 w-56 xl:w-72 transition-all"
        >
          <Search className="w-4 h-4 text-[#1EC1CB] shrink-0 mr-2" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Tìm HDV Sơn Trà, Chợ Cồn..."
            aria-label="Tìm nhanh Hướng dẫn viên Đà Nẵng"
            className="bg-transparent text-[13px] text-white placeholder:text-white/60 w-full focus:outline-none"
          />
        </form>

        {/* Menu điều hướng Desktop */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold">
          <Link
            to="/"
            className={clsx(
              'px-3 py-2 rounded-[10px] transition-colors',
              location.pathname === '/'
                ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold'
                : 'text-white/90 hover:bg-white/10'
            )}
          >
            Trang chủ
          </Link>
          <Link
            to="/guides"
            className={clsx(
              'px-3 py-2 rounded-[10px] transition-colors',
              location.pathname.startsWith('/guides')
                ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold'
                : 'text-white/90 hover:bg-white/10'
            )}
          >
            Tìm HDV
          </Link>
          <Link
            to="/don-cua-toi"
            className={clsx(
              'px-3 py-2 rounded-[10px] transition-colors',
              location.pathname.startsWith('/don')
                ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold'
                : 'text-white/90 hover:bg-white/10'
            )}
          >
            Đặt lịch của tôi
          </Link>
          <Link
            to="/tin-nhan"
            className={clsx(
              'px-3 py-2 rounded-[10px] transition-colors flex items-center gap-1.5',
              location.pathname === '/tin-nhan'
                ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold'
                : 'text-white/90 hover:bg-white/10'
            )}
          >
            <span>Tin nhắn</span>
            {unreadMessagesCount > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-extrabold',
                  location.pathname === '/tin-nhan'
                    ? 'bg-[#1C1C28] text-[#1EC1CB]'
                    : 'bg-[#1EC1CB] text-[#1C1C28]'
                )}
              >
                {unreadMessagesCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Ngôn ngữ + Chuông thông báo + Tài khoản góc phải */}
        <div className="flex items-center gap-2">
          {/* Ngôn ngữ Tiếng Việt */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-white/10 text-[12px] font-bold text-[#F6E6EA]"
            title="Ngôn ngữ giao diện: Tiếng Việt (VNĐ)"
          >
            <Globe className="w-3.5 h-3.5 text-[#1EC1CB]" />
            <span>VI • VNĐ</span>
          </div>

          {/* Chuông thông báo kèm số đếm */}
          <Link
            to="/thong-bao"
            aria-label="Trung tâm thông báo"
            className="relative p-2 rounded-[10px] bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1EC1CB] text-[#1C1C28] text-[10px] font-black flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </Link>

          {displayUserName ? (
            <div className="flex items-center gap-1.5">
              <Link
                to={
                  activeRole === 'guide'
                    ? '/guide/don-den'
                    : activeRole === 'admin'
                      ? '/admin/kyc'
                      : '/ho-so-ca-nhan'
                }
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[12px] bg-white/10 hover:bg-white/15 transition-colors"
              >
                <img
                  src={
                    currentUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={displayUserName}
                  className="w-8 h-8 rounded-full object-cover border border-[#1EC1CB]"
                />
                <div className="hidden xl:block text-left">
                  <span className="block text-[13px] font-bold text-white leading-tight max-w-[120px] truncate">
                    {displayUserName}
                  </span>
                  <span className="block text-[10px] text-[#1EC1CB] font-semibold">
                    {activeRole === 'guide'
                      ? 'Local Guide'
                      : activeRole === 'admin'
                        ? 'Admin'
                        : 'Du khách'}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-block px-2.5 py-2 rounded-[10px] text-[12px] font-semibold text-[#F6E6EA] hover:bg-white/10 transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/dang-nhap"
                className="px-3 py-2 rounded-[12px] text-[13px] font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dang-ky"
                className="px-3.5 py-2 rounded-[12px] bg-[#1EC1CB] text-[#1C1C28] text-[13px] font-bold hover:bg-[#18A7B0] transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Nút mở menu phụ trên Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-[10px] bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu xổ xuống trên Mobile (Kèm ô tìm kiếm nhanh) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1C1C28] border-t border-white/10 px-4 py-3 space-y-2.5">
          <form
            onSubmit={(e) => {
              handleQuickSearchSubmit(e);
              setMobileMenuOpen(false);
            }}
            className="flex items-center bg-white/10 border border-white/20 rounded-[12px] px-3 h-10"
          >
            <Search className="w-4 h-4 text-[#1EC1CB] mr-2" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Tìm HDV Đà Nẵng theo khu vực, tên..."
              className="bg-transparent text-sm text-white placeholder:text-white/60 w-full focus:outline-none"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 text-[13px] font-semibold">
            <Link
              to="/design-system"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-[10px] bg-white/10 text-[#1EC1CB]"
            >
              🎨 Design System
            </Link>
            {displayUserName && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-2 rounded-[10px] bg-white/10 text-left text-[#F6E6EA] cursor-pointer"
              >
                🚪 Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// ---------- BottomNav cho Mobile (Public & Tourist: Trang chủ, Tìm HDV, Đặt lịch của tôi, Tin nhắn, Tài khoản) ----------
export const TouristBottomNav: React.FC = () => {
  const location = useLocation();
  const { currentUser, messages } = useBookingContext();

  const unreadMsg = messages.filter(
    (m) => !m.isRead && currentUser && m.receiverId === currentUser.id
  ).length;

  const links = [
    { to: '/', label: 'Trang chủ', icon: '🏠', match: (p: string) => p === '/' },
    { to: '/guides', label: 'Tìm HDV', icon: '🔍', match: (p: string) => p.startsWith('/guides') },
    {
      to: '/don-cua-toi',
      label: 'Đặt lịch của tôi',
      icon: '📋',
      match: (p: string) => p.startsWith('/don'),
    },
    {
      to: '/tin-nhan',
      label: 'Tin nhắn',
      icon: '💬',
      badge: unreadMsg,
      match: (p: string) => p === '/tin-nhan',
    },
    {
      to: currentUser ? '/ho-so-ca-nhan' : '/dang-nhap',
      label: 'Tài khoản',
      icon: '👤',
      match: (p: string) => p === '/ho-so-ca-nhan' || p === '/dang-nhap',
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động Du khách"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1C1C28] text-white border-t border-white/15 z-40 flex items-center justify-around h-16 shadow-xl"
    >
      {links.map((l) => {
        const isActive = l.match(location.pathname);
        return (
          <Link
            key={l.to}
            to={l.to}
            className={clsx(
              'relative flex flex-col items-center justify-center flex-1 h-full text-[10px] sm:text-[11px] font-bold gap-0.5 transition-colors',
              isActive ? 'text-[#1EC1CB]' : 'text-white/70 hover:text-white'
            )}
          >
            <span className="text-base leading-none">{l.icon}</span>
            <span className="truncate max-w-[72px]">{l.label}</span>
            {l.badge !== undefined && l.badge > 0 && (
              <span className="absolute top-1.5 right-3 px-1.5 rounded-full bg-[#1EC1CB] text-[#1C1C28] text-[9px] font-black">
                {l.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

// ---------- Sidebar 240px chuẩn màu Navy (#1C1C28) dùng chung cho cả Guide & Admin (Desktop + Drawer Mobile) ----------
export interface DashboardNavLink {
  to: string;
  label: string;
  icon: string;
  badge?: number;
  sub?: string;
}

export const DashboardSidebarContent: React.FC<{
  portalTitle: string;
  links: DashboardNavLink[];
  onCloseDrawer?: () => void;
}> = ({ portalTitle, links, onCloseDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetAllDataToDefault, switchRoleQuickly, logout } = useBookingContext();
  const { showToast } = useToast();

  return (
    <div className="w-[240px] bg-[#1C1C28] text-white h-full flex flex-col justify-between p-4 border-r border-white/10 select-none">
      <div>
        <div className="flex items-center justify-between px-1 pb-4 border-b border-white/15 mb-4">
          <Link
            to="/"
            onClick={onCloseDrawer}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-[12px] bg-[#1EC1CB] text-[#1C1C28] flex items-center justify-center font-black text-[16px]">
              LB
            </div>
            <div>
              <span className="font-extrabold text-[16px] text-white block leading-tight">
                LocalBuddy
              </span>
              <span className="text-[10px] text-[#1EC1CB] tracking-wider uppercase font-bold">
                {portalTitle}
              </span>
            </div>
          </Link>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Đóng thanh bên"
              className="lg:hidden p-1.5 rounded-[8px] bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onCloseDrawer}
                className={clsx(
                  'flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[13px] transition-all',
                  isActive
                    ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white font-medium'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {link.badge !== undefined && link.badge > 0 && (
                    <span
                      className={clsx(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                        isActive
                          ? 'bg-[#1C1C28] text-[#1EC1CB]'
                          : 'bg-[#1EC1CB] text-[#1C1C28]'
                      )}
                    >
                      {link.badge}
                    </span>
                  )}
                  {link.sub && (
                    <span className="text-[10px] opacity-70 font-mono">{link.sub}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/15 pt-3 space-y-1.5 text-[12px]">
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            switchRoleQuickly('tourist', 'u-tourist-1');
            navigate('/');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#1EC1CB] hover:bg-white/10 font-semibold cursor-pointer"
        >
          ← Giao diện Du khách
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            resetAllDataToDefault();
            showToast('Đã khôi phục dữ liệu mẫu Đà Nẵng về mặc định!', 'success');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#F6E6EA]/80 hover:bg-white/10 cursor-pointer"
        >
          🔄 Khôi phục dữ liệu gốc
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            logout();
            navigate('/dang-nhap');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#F5B2BA] hover:bg-white/10 font-semibold cursor-pointer"
        >
          🚪 Đăng xuất phiên
        </button>
      </div>
    </div>
  );
};

// Giữ export tương thích ngược
export const GuideBottomNav: React.FC = () => {
  const location = useLocation();
  const { walletBalance } = useBookingContext();

  const links = [
    { to: '/guide/don-den', label: 'Đơn đến', icon: '🔔' },
    { to: '/guide/don-va-ca', label: 'Đơn & Ca', icon: '📋' },
    { to: '/guide/lich-ranh', label: 'Lịch rảnh', icon: '📅' },
    { to: '/guide/vi', label: `Ví (${formatMoney(walletBalance)})`, icon: '💰' },
    { to: '/guide/ho-so', label: 'Hồ sơ', icon: '👤' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1C1C28] text-white border-t border-white/15 z-30 flex items-center justify-around h-16 shadow-xl">
      {links.map((l) => {
        const isActive = location.pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full text-[10px] font-bold gap-0.5 transition-colors',
              isActive ? 'text-[#1EC1CB]' : 'text-white/70 hover:text-white'
            )}
          >
            <span className="text-base">{l.icon}</span>
            <span className="truncate max-w-[68px]">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
