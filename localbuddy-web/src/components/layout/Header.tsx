// components/layout/Header.tsx
// Thiết kế tối giản 1 tông nền sáng (#FAF9F6 / #FFFFFF), rất ít chữ, thanh thoát.

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Search, Menu, X } from 'lucide-react';
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
    showToast(`Đã chuyển: ${switchedUser.fullName}`, 'info');
    if (targetRole === 'tourist') navigate('/');
    if (targetRole === 'guide') navigate('/guide/don-den');
    if (targetRole === 'admin') navigate('/admin/kyc');
  };

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất.', 'info');
    navigate('/dang-nhap');
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim();
    navigate(q ? `/guides?q=${encodeURIComponent(q)}` : '/guides');
    setQuickQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md text-[#1C1917] border-b border-[#E7E5E4]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo tối giản */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-black text-[14px]">
            LB
          </div>
          <span className="text-[18px] font-black tracking-tight text-[#1C1917]">
            LocalBuddy
          </span>
        </Link>

        {/* Ô tìm nhanh tối giản */}
        <form
          onSubmit={handleQuickSearchSubmit}
          className="hidden md:flex items-center bg-white border border-[#E7E5E4] focus-within:border-[#1C1917] rounded-full px-3.5 h-9 w-52 lg:w-64 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-[#78716C] shrink-0 mr-2" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Sơn Trà, Hội An..."
            aria-label="Tìm nhanh"
            className="bg-transparent text-[13px] text-[#1C1917] placeholder:text-[#A8A29E] w-full focus:outline-none"
          />
        </form>

        {/* Điều hướng chính ít chữ */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium">
          <Link
            to="/"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname === '/'
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F1EC]'
            )}
          >
            Khám phá
          </Link>
          <Link
            to="/guides"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/guides')
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F1EC]'
            )}
          >
            Hướng dẫn viên
          </Link>
          <Link
            to="/don-cua-toi"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/don')
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F1EC]'
            )}
          >
            Lịch đặt
          </Link>
          <Link
            to="/tin-nhan"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5',
              location.pathname === '/tin-nhan'
                ? 'bg-[#1C1917] text-white font-semibold'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F1EC]'
            )}
          >
            <span>Tin nhắn</span>
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 rounded-full text-[10px] font-bold bg-[#1C1917] text-white">
                {unreadMessagesCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Chuyển nhanh 2 tài khoản hệ thống (HDV / Admin) + Thông báo + Tài khoản */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-[#F3F1EC] p-0.5 rounded-full border border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('guide', 'u-guide-1')}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                activeRole === 'guide'
                  ? 'bg-white text-[#1C1917] shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              )}
            >
              HDV Khanh
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('admin', 'u-admin-1')}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                activeRole === 'admin'
                  ? 'bg-white text-[#1C1917] shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              )}
            >
              Admin Hoàng
            </button>
          </div>

          <Link
            to="/thong-bao"
            aria-label="Thông báo"
            className="relative p-2 rounded-full bg-white border border-[#E7E5E4] hover:border-[#1C1917] text-[#1C1917] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#1C1917] text-white text-[10px] font-bold flex items-center justify-center">
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
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white border border-[#E7E5E4] hover:border-[#1C1917] transition-colors"
              >
                <img
                  src={
                    currentUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={displayUserName}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="hidden xl:block text-[12px] font-semibold text-[#1C1917] max-w-[96px] truncate">
                  {displayUserName.split(' ').slice(-2).join(' ')}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-block px-2 py-1 text-[12px] text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                Thoát
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/dang-nhap"
                className="px-3 py-1.5 rounded-full text-[#1C1917] text-[12px] font-semibold hover:bg-[#F3F1EC] transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dang-ky"
                className="px-3.5 py-1.5 rounded-full bg-[#1C1917] text-white text-[12px] font-semibold hover:bg-[#292524] transition-colors shadow-2xs"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917] cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-t border-[#E7E5E4] px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                handleQuickRoleSwitch('guide', 'u-guide-1');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 rounded-full bg-white border border-[#E7E5E4] text-[12px] font-semibold"
            >
              HDV Khanh
            </button>
            <button
              type="button"
              onClick={() => {
                handleQuickRoleSwitch('admin', 'u-admin-1');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 rounded-full bg-white border border-[#E7E5E4] text-[12px] font-semibold"
            >
              Admin Hoàng
            </button>
          </div>
          {!currentUser && (
            <div className="flex items-center gap-2 pt-1 border-t border-[#E7E5E4]">
              <Link
                to="/dang-nhap"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-white border border-[#E7E5E4] text-[13px] font-semibold"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dang-ky"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-[#1C1917] text-white text-[13px] font-semibold"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

// ---------- BottomNav cho Mobile (1 tông nền sáng) ----------
export const TouristBottomNav: React.FC = () => {
  const location = useLocation();
  const { currentUser, messages } = useBookingContext();

  const unreadMsg = messages.filter(
    (m) => !m.isRead && currentUser && m.receiverId === currentUser.id
  ).length;

  const links = [
    { to: '/', label: 'Khám phá', icon: '🏠', match: (p: string) => p === '/' },
    { to: '/guides', label: 'HDV', icon: '🔍', match: (p: string) => p.startsWith('/guides') },
    {
      to: '/don-cua-toi',
      label: 'Lịch đặt',
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
      aria-label="Điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FAF9F6]/95 backdrop-blur-md text-[#1C1917] border-t border-[#E7E5E4] z-40 flex items-center justify-around h-15"
    >
      {links.map((l) => {
        const isActive = l.match(location.pathname);
        return (
          <Link
            key={l.to}
            to={l.to}
            className={clsx(
              'relative flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold gap-0.5 transition-colors',
              isActive ? 'text-[#1C1917] font-bold' : 'text-[#78716C]'
            )}
          >
            <span className="text-base leading-none">{l.icon}</span>
            <span>{l.label}</span>
            {l.badge !== undefined && l.badge > 0 && (
              <span className="absolute top-1.5 right-4 px-1.5 rounded-full bg-[#1C1917] text-white text-[9px] font-bold">
                {l.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

// ---------- Sidebar 240px nền sáng đồng nhất cho Guide & Admin ----------
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
    <div className="w-[240px] bg-white text-[#1C1917] h-full flex flex-col justify-between p-4 border-r border-[#E7E5E4] select-none">
      <div>
        <div className="flex items-center justify-between px-1 pb-4 border-b border-[#E7E5E4] mb-4">
          <Link
            to="/"
            onClick={onCloseDrawer}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-black text-[13px]">
              LB
            </div>
            <div>
              <span className="font-bold text-[15px] text-[#1C1917] block leading-tight">
                LocalBuddy
              </span>
              <span className="text-[10px] text-[#78716C] uppercase font-semibold">
                {portalTitle}
              </span>
            </div>
          </Link>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Đóng"
              className="lg:hidden p-1.5 rounded-full bg-[#F3F1EC] text-[#1C1917] cursor-pointer"
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
                    ? 'bg-[#1C1917] text-white font-semibold'
                    : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917] font-medium'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      isActive
                        ? 'bg-white text-[#1C1917]'
                        : 'bg-[#1C1917] text-white'
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#E7E5E4] pt-3 space-y-1 text-[12px]">
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            navigate('/');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#1C1917] hover:bg-[#F3F1EC] font-medium cursor-pointer"
        >
          ← Về Trang chủ
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            resetAllDataToDefault();
            showToast('Đã khôi phục dữ liệu gốc!', 'success');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#78716C] hover:bg-[#F3F1EC] cursor-pointer"
        >
          🔄 Đặt lại dữ liệu
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            logout();
            navigate('/dang-nhap');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[#B91C1C] hover:bg-[#FEF2F2] font-medium cursor-pointer"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
};

export const GuideBottomNav: React.FC = () => {
  const location = useLocation();
  const { walletBalance } = useBookingContext();

  const links = [
    { to: '/guide/don-den', label: 'Đơn đến', icon: '🔔' },
    { to: '/guide/don-va-ca', label: 'Đơn & Ca', icon: '📋' },
    { to: '/guide/lich-ranh', label: 'Lịch rảnh', icon: '📅' },
    { to: '/guide/vi', label: `${formatMoney(walletBalance)}`, icon: '💰' },
    { to: '/guide/ho-so', label: 'Hồ sơ', icon: '👤' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FAF9F6] text-[#1C1917] border-t border-[#E7E5E4] z-30 flex items-center justify-around h-15">
      {links.map((l) => {
        const isActive = location.pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold gap-0.5',
              isActive ? 'text-[#1C1917] font-bold' : 'text-[#78716C]'
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
