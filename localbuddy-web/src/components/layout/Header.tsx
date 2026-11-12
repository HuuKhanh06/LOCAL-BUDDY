// components/layout/Header.tsx
// Header chuẩn hệ thống thiết kế mới: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Search, Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../types';
import { useBookingContext } from '../../context/BookingContext';
import { useToast } from '../ui/Toast';
import { Logo } from '../common/Logo';

export const Header: React.FC<{ role?: UserRole; userName?: string }> = ({ role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const {
    currentUser,
    notifications,
    logout,
  } = useBookingContext();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const activeRole: UserRole = currentUser?.role || propRole || 'tourist';
  const displayUserName = currentUser?.fullName;

  const isMatchUser = (n: { userId?: string; type?: string }) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') {
      return n.userId === currentUser.id || n.userId === 'u-admin-1' || n.type === 'BOOKING';
    }
    return n.userId === currentUser.id;
  };

  const unreadNotifsCount = notifications.filter(
    (n) => !n.isRead && isMatchUser(n)
  ).length;



  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất.', 'info');
    navigate('/dang-nhap');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    void i18n.changeLanguage(nextLang);
    localStorage.setItem('lb_language', nextLang);
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim();
    navigate(q ? `/guides?q=${encodeURIComponent(q)}` : '/guides');
    setQuickQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FEEDDC]/95 backdrop-blur-md border-b border-[#EAD7C2] text-[#1C1917] transition-colors">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo Withlocals style */}
        <Link to="/" className="flex items-center shrink-0">
          <Logo size="md" />
        </Link>

        {/* Ô tìm nhanh */}
        <form
          onSubmit={handleQuickSearchSubmit}
          className="hidden md:flex items-center bg-white/90 border border-[#EAD7C2] focus-within:border-[#D12B79] rounded-full px-3.5 h-9 w-52 lg:w-64 transition-all shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-[#78716C] shrink-0 mr-2" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Sơn Trà, Hội An..."
            aria-label="Tìm nhanh"
            className="bg-transparent text-[13px] text-[#1C1917] placeholder:text-[#78716C] w-full focus:outline-none"
          />
        </form>

        {/* Điều hướng chính */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium">
          <Link
            to="/"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname === '/'
                ? 'bg-[#D12B79] text-white font-semibold shadow-xs'
                : 'text-[#6E6259] hover:text-[#1C1917] hover:bg-[#F3DEC8]'
            )}
          >
            {t('nav_home')}
          </Link>
          <Link
            to="/how-it-works"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/how-it-works')
                ? 'bg-[#D12B79] text-white font-semibold shadow-xs'
                : 'text-[#6E6259] hover:text-[#1C1917] hover:bg-[#F3DEC8]'
            )}
          >
            {t('nav_how_it_works')}
          </Link>
          <Link
            to="/guides"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/guides')
                ? 'bg-[#D12B79] text-white font-semibold shadow-xs'
                : 'text-[#6E6259] hover:text-[#1C1917] hover:bg-[#F3DEC8]'
            )}
          >
            {t('nav_guides')}
          </Link>
          <Link
            to="/don-cua-toi"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/don')
                ? 'bg-[#D12B79] text-white font-semibold shadow-xs'
                : 'text-[#6E6259] hover:text-[#1C1917] hover:bg-[#F3DEC8]'
            )}
          >
            {t('nav_my_bookings')}
          </Link>
        </nav>

        {/* Actions: Đổi ngôn ngữ + Vai trò + Thông báo + Tài khoản */}
        <div className="flex items-center gap-2">
          {/* Nút chuyển ngôn ngữ VI / EN */}
          <button
            type="button"
            onClick={toggleLanguage}
            title="Đổi ngôn ngữ"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAD7C2] text-[11px] font-bold text-[#1C1917] hover:border-[#D12B79] cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#D12B79]" />
            <span>{i18n.language.toUpperCase()}</span>
          </button>



          <Link
            to={
              activeRole === 'guide'
                ? '/guide/thong-bao'
                : activeRole === 'admin'
                  ? '/admin/thong-bao'
                  : '/thong-bao'
            }
            aria-label="Thông báo"
            className="relative p-2 rounded-full bg-white border border-[#EAD7C2] hover:border-[#D12B79] text-[#1C1917] transition-colors shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#D12B79] text-white text-[10px] font-bold flex items-center justify-center">
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
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white border border-[#EAD7C2] hover:border-[#D12B79] transition-colors shadow-xs"
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
                className="hidden sm:inline-block px-2 py-1 text-[12px] text-[#6E6259] hover:text-[#1C1917] cursor-pointer"
              >
                {t('common_logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/dang-nhap"
                className="px-3.5 py-1.5 rounded-full text-[#D12B79] text-[13px] font-bold hover:bg-white/60 transition-colors"
              >
                {t('common_login')}
              </Link>
              <Link
                to="/dang-ky"
                className="px-4 py-1.5 rounded-full bg-[#D12B79] text-white text-[13px] font-bold hover:bg-[#B51E63] shadow-xs transition-colors"
              >
                {t('common_register')}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-full bg-white border border-[#EAD7C2] text-[#1C1917] cursor-pointer shadow-xs"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FEEDDC] border-t border-[#EAD7C2] px-4 py-3 space-y-2.5">
          <div className="flex flex-col gap-1 pb-2 border-b border-[#EAD7C2] text-[13px]">
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg font-bold text-[#1C1917] hover:bg-white/80 flex items-center justify-between"
            >
              <span>🌟 Giới thiệu & Mô hình hoạt động</span>
              <span className="text-xs text-[#D12B79]">Local Buddy →</span>
            </Link>
            <Link
              to="/guides"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg font-bold text-[#1C1917] hover:bg-white/80"
            >
              🔍 Tìm Hướng dẫn viên
            </Link>
            <Link
              to="/don-cua-toi"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg font-bold text-[#1C1917] hover:bg-white/80"
            >
              📋 Lịch đặt của tôi
            </Link>
          </div>

          {!currentUser && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#EAD7C2]">
              <Link
                to="/dang-nhap"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-white border border-[#EAD7C2] text-[#1C1917] text-[13px] font-bold shadow-xs"
              >
                {t('common_login')}
              </Link>
              <Link
                to="/dang-ky"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-[#D12B79] text-white text-[13px] font-bold shadow-xs"
              >
                {t('common_register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

// ---------- BottomNav cho Mobile ----------
export const TouristBottomNav: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useBookingContext();

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
      to: currentUser ? '/ho-so-ca-nhan' : '/dang-nhap',
      label: 'Tài khoản',
      icon: '👤',
      match: (p: string) => p === '/ho-so-ca-nhan' || p === '/dang-nhap',
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--lb-surface)]/95 backdrop-blur-md text-[var(--lb-text)] border-t border-[var(--lb-border)] z-40 flex items-center justify-around h-15"
    >
      {links.map((l) => {
        const isActive = l.match(location.pathname);
        return (
          <Link
            key={l.to}
            to={l.to}
            className={clsx(
              'relative flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold gap-0.5 transition-colors',
              isActive ? 'text-[var(--lb-accent)] font-bold' : 'text-[var(--lb-muted)]'
            )}
          >
            <span className="text-base leading-none">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// ---------- Sidebar 240px cho Guide & Admin ----------
export interface DashboardNavLink {
  to: string;
  label: string;
  icon: string;
  badge?: number;
  sub?: string;
  isActive?: (pathname: string, search: string) => boolean;
}

export const DashboardSidebarContent: React.FC<{
  portalTitle: string;
  links: DashboardNavLink[];
  onCloseDrawer?: () => void;
}> = ({ portalTitle, links, onCloseDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useBookingContext();

  return (
    <div className="w-[240px] bg-[var(--lb-surface)] text-[var(--lb-text)] h-full flex flex-col justify-between p-4 border-r border-[var(--lb-border)] select-none">
      <div>
        <div className="flex items-center justify-between px-1 pb-4 border-b border-[var(--lb-border)] mb-4">
          <Link
            to="/"
            onClick={onCloseDrawer}
            className="flex items-center gap-2"
          >
            <Logo size="sm" />
            {portalTitle && (
              <span className="text-[10px] text-[var(--lb-muted)] uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--lb-surface-2)]">
                {portalTitle}
              </span>
            )}
          </Link>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Đóng"
              className="lg:hidden p-1.5 rounded-full bg-[var(--lb-surface-2)] text-[var(--lb-text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = link.isActive
              ? link.isActive(location.pathname, location.search)
              : location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onCloseDrawer}
                className={clsx(
                  'flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[13px] transition-all',
                  isActive
                    ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-semibold'
                    : 'text-[var(--lb-muted)] hover:bg-[var(--lb-surface-2)] hover:text-[var(--lb-text)] font-medium'
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
                        ? 'bg-[var(--lb-on-accent)] text-[var(--lb-accent)]'
                        : 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)]'
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

      <div className="border-t border-[var(--lb-border)] pt-3 space-y-1 text-[12px]">
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            navigate('/');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[var(--lb-text)] hover:bg-[var(--lb-surface-2)] font-medium cursor-pointer"
        >
          ← Về Trang chủ
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseDrawer?.();
            logout();
            navigate('/dang-nhap');
          }}
          className="w-full text-left px-3 py-2 rounded-[10px] text-[var(--lb-error)] hover:bg-[var(--lb-surface-2)] font-medium cursor-pointer"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
};
