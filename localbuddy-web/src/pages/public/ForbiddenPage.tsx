// pages/public/ForbiddenPage.tsx (Trang 403 — Không đủ quyền truy cập theo vai trò RBAC)
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useBookingContext } from '../../context/BookingContext';
import { UserRole } from '../../types';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, switchRoleQuickly } = useBookingContext();

  const requiredRole = (searchParams.get('required') as UserRole | null) || 'admin';
  const roleLabel =
    requiredRole === 'admin'
      ? 'Quản trị viên (Admin)'
      : requiredRole === 'guide'
        ? 'Hướng dẫn viên (Local Guide)'
        : 'Du khách (Tourist)';

  const handleSwitchAndEnter = () => {
    switchRoleQuickly(requiredRole);
    if (requiredRole === 'admin') navigate('/admin/kyc');
    else if (requiredRole === 'guide') navigate('/guide/don-den');
    else navigate('/');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white border border-[#F1DEC9] rounded-[24px] p-8 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] text-xs font-bold uppercase tracking-wider">
            Mã lỗi 403 • Từ chối truy cập (RBAC)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917]">
            Bạn không có quyền truy cập trang này
          </h1>
          <p className="text-sm text-[#6E6259] leading-relaxed">
            Khu vực này chỉ dành cho vai trò <strong>{roleLabel}</strong>.
            {currentUser ? (
              <>
                {' '}
                Hiện tại bạn đang đăng nhập dưới tên <strong>{currentUser.fullName}</strong> (Vai
                trò:{' '}
                <strong className="uppercase">
                  {currentUser.role === 'tourist'
                    ? 'Du khách'
                    : currentUser.role === 'guide'
                      ? 'Hướng dẫn viên'
                      : 'Quản trị viên'}
                </strong>
                ).
              </>
            ) : (
              ' Vui lòng đăng nhập đúng tài khoản để tiếp tục.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            icon={<LogIn className="w-4 h-4" />}
            onClick={handleSwitchAndEnter}
          >
            Chuyển nhanh sang {roleLabel}
          </Button>
          <Button variant="secondary" icon={<Home className="w-4 h-4" />} onClick={() => navigate('/')}>
            Về trang chủ Đà Nẵng
          </Button>
        </div>
      </div>
    </div>
  );
};
