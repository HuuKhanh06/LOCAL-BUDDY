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

export const Header: React.FC<{ role?: UserRole; userName?: string }> = ({ role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const {
    currentUser,
    notifications,
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
    <header className="sticky top-0 z-40 bg-[var(--lb-surface)]/95 backdrop-blur-md text-[var(--lb-text)] border-b border-[var(--lb-border)]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] flex items-center justify-center font-black text-[14px]">
            LB
          </div>
          <span className="text-[18px] font-black tracking-tight text-[var(--lb-text)]">
            LocalBuddy
          </span>
        </Link>

        {/* Ô tìm nhanh */}
        <form
          onSubmit={handleQuickSearchSubmit}
          className="hidden md:flex items-center bg-[var(--lb-surface-2)] border border-[var(--lb-border)] focus-within:border-[var(--lb-blue)] rounded-full px-3.5 h-9 w-52 lg:w-64 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-[var(--lb-muted)] shrink-0 mr-2" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Sơn Trà, Hội An..."
            aria-label="Tìm nhanh"
            className="bg-transparent text-[13px] text-[var(--lb-text)] placeholder:text-[var(--lb-muted)] w-full focus:outline-none"
          />
        </form>

        {/* Điều hướng chính */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium">
          <Link
            to="/"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname === '/'
                ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-semibold'
                : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)] hover:bg-[var(--lb-surface-2)]'
            )}
          >
            {t('nav_home')}
          </Link>
          <Link
            to="/guides"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/guides')
                ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-semibold'
                : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)] hover:bg-[var(--lb-surface-2)]'
            )}
          >
            {t('nav_guides')}
          </Link>
          <Link
            to="/don-cua-toi"
            className={clsx(
              'px-3.5 py-1.5 rounded-full transition-colors',
              location.pathname.startsWith('/don')
                ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-semibold'
                : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)] hover:bg-[var(--lb-surface-2)]'
            )}
          >
            Lịch đặt
          </Link>
        </nav>

        {/* Actions: Đổi ngôn ngữ + Vai trò + Thông báo + Tài khoản */}
        <div className="flex items-center gap-2">
          {/* Nút chuyển ngôn ngữ VI / EN */}
          <button
            type="button"
            onClick={toggleLanguage}
            title="Đổi ngôn ngữ"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[11px] font-bold text-[var(--lb-text)] hover:border-[var(--lb-blue)] cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--lb-blue)]" />
            <span>{i18n.language.toUpperCase()}</span>
          </button>

          {/* Chuyển nhanh 2 tài khoản hệ thống */}
          <div className="hidden sm:flex items-center bg-[var(--lb-surface-2)] p-0.5 rounded-full border border-[var(--lb-border)]">
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('guide', 'u-guide-1')}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                activeRole === 'guide'
                  ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] shadow-xs'
                  : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)]'
              )}
            >
              HDV
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSwitch('admin', 'u-admin-1')}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                activeRole === 'admin'
                  ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] shadow-xs'
                  : 'text-[var(--lb-muted)] hover:text-[var(--lb-text)]'
              )}
            >
              Admin
            </button>
          </div>

          <Link
            to="/thong-bao"
            aria-label="Thông báo"
            className="relative p-2 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] hover:border-[var(--lb-blue)] text-[var(--lb-text)] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] text-[10px] font-bold flex items-center justify-center">
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
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] hover:border-[var(--lb-blue)] transition-colors"
              >
                <img
                  src={
                    currentUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={displayUserName}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="hidden xl:block text-[12px] font-semibold text-[var(--lb-text)] max-w-[96px] truncate">
                  {displayUserName.split(' ').slice(-2).join(' ')}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-block px-2 py-1 text-[12px] text-[var(--lb-muted)] hover:text-[var(--lb-text)] cursor-pointer"
              >
                {t('common_logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/dang-nhap"
                className="px-3 py-1.5 rounded-full text-[var(--lb-text)] text-[12px] font-semibold hover:bg-[var(--lb-surface-2)] transition-colors"
              >
                {t('common_login')}
              </Link>
              <Link
                to="/dang-ky"
                className="px-3.5 py-1.5 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] text-[12px] font-semibold hover:bg-[var(--lb-accent-hover)] transition-colors"
              >
                {t('common_register')}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[var(--lb-text)] cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--lb-surface)] border-t border-[var(--lb-border)] px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                handleQuickRoleSwitch('guide', 'u-guide-1');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[12px] font-semibold"
            >
              HDV Khanh
            </button>
            <button
              type="button"
              onClick={() => {
                handleQuickRoleSwitch('admin', 'u-admin-1');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[12px] font-semibold"
            >
              Admin Hoàng
            </button>
          </div>
          {!currentUser && (
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--lb-border)]">
              <Link
                to="/dang-nhap"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-[var(--lb-surface-2)] border border-[var(--lb-border)] text-[13px] font-semibold"
              >
                {t('common_login')}
              </Link>
              <Link
                to="/dang-ky"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] text-[13px] font-semibold"
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
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] flex items-center justify-center font-black text-[13px]">
              LB
            </div>
            <div>
              <span className="font-bold text-[15px] text-[var(--lb-text)] block leading-tight">
                LocalBuddy
              </span>
              <span className="text-[10px] text-[var(--lb-muted)] uppercase font-semibold">
                {portalTitle}
              </span>
            </div>
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
            const isActive = location.pathname === link.to;
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
