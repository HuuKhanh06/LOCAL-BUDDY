// pages/tourist/LoginPage.tsx (UC.02: Đăng nhập đa vai trò với Supabase Auth)
// Thiết kế tối giản 1 tông nền sáng (#FAF9F6 / #FFFFFF), rất ít chữ.
// Giữ đúng 2 tài khoản hệ thống (1 HDV, 1 Admin), người dùng mới bấm Đăng ký.

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useBookingContext } from '../../context/BookingContext';
import { useToast } from '../../components/ui/Toast';
import { supabaseAuthApi, isSupabaseConfigured } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, allUsers } = useBookingContext();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isSessionExpired = searchParams.get('expired') === '1';
  const isEmailVerified = searchParams.get('verified') === '1';
  const isResetSuccess = searchParams.get('reset_success') === '1';
  const returnTo = searchParams.get('returnTo') || searchParams.get('redirect');

  const navigateByRole = (emailOrPhone: string) => {
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo);
      return;
    }
    const matched = allUsers.find(
      (u) =>
        u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
        u.phone === emailOrPhone.trim()
    );
    if (matched?.role === 'guide') {
      navigate('/guide/don-den');
    } else if (matched?.role === 'admin') {
      navigate('/admin/kyc');
    } else {
      navigate('/don-cua-toi');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email/Số điện thoại và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const isLocalDemoAccount = allUsers.some(
        (u) =>
          u.email.toLowerCase() === identifier.trim().toLowerCase() ||
          u.phone === identifier.trim()
      );

      if (isSupabaseConfigured && identifier.includes('@') && !isLocalDemoAccount) {
        const cloudRes = await supabaseAuthApi.signIn(identifier, password);
        if (!cloudRes.ok) {
          setErrorMsg(cloudRes.message);
          return;
        }
      }

      const res = login(identifier, password);
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      showToast(res.message, 'success');
      navigateByRole(identifier);
    } finally {
      setIsLoading(false);
    }
  };

  const quickFillAndLogin = (email: string) => {
    setErrorMsg('');
    setIdentifier(email);
    setPassword('123456');
    const res = login(email, '123456');
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    showToast(res.message, 'success');
    navigateByRole(email);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white border border-[#E7E5E4] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center">
          <div className="w-11 h-11 rounded-full bg-[#1C1917] text-white font-black text-[15px] flex items-center justify-center mx-auto mb-3">
            LB
          </div>
          <h1 className="text-[22px] font-black tracking-tight text-[#1C1917]">
            Đăng nhập
          </h1>
          <p className="text-[13px] text-[#78716C] mt-1">
            LocalBuddy Đà Nẵng
          </p>
        </div>

        {isSessionExpired && (
          <div className="p-3 rounded-[12px] bg-[#FEF3C7] border border-[#FDE68A] text-[12px] text-[#92400E] font-medium">
            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
          </div>
        )}
        {isEmailVerified && (
          <div className="p-3 rounded-[12px] bg-[#DCFCE7] border border-[#BBF7D0] text-[12px] text-[#166534] font-medium">
            Xác minh email thành công! Hãy đăng nhập ngay.
          </div>
        )}
        {isResetSuccess && (
          <div className="p-3 rounded-[12px] bg-[#DCFCE7] border border-[#BBF7D0] text-[12px] text-[#166534] font-medium">
            Đã đổi mật khẩu mới thành công.
          </div>
        )}

        {/* 2 Tài khoản hệ thống sẵn sàng */}
        <div className="bg-[#FAF9F6] border border-[#E7E5E4] rounded-[16px] p-3.5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
            Tài khoản mẫu có sẵn
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[12px] border border-[#E7E5E4]">
              <div className="min-w-0 pr-2">
                <div className="text-[12px] font-bold text-[#1C1917] truncate">
                  🧭 HDV: Nguyễn Hữu Khanh
                </div>
                <div className="text-[11px] text-[#78716C] truncate">
                  khanh.nguyen.dn@gmail.com
                </div>
              </div>
              <button
                type="button"
                onClick={() => quickFillAndLogin('khanh.nguyen.dn@gmail.com')}
                className="shrink-0 px-3 py-1 rounded-full bg-[#1C1917] text-white text-[11px] font-semibold hover:bg-[#292524] cursor-pointer"
              >
                Vào HDV
              </button>
            </div>

            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[12px] border border-[#E7E5E4]">
              <div className="min-w-0 pr-2">
                <div className="text-[12px] font-bold text-[#1C1917] truncate">
                  ⚖️ Admin: Lê Văn Hoàng
                </div>
                <div className="text-[11px] text-[#78716C] truncate">
                  admin@localbuddy.vn
                </div>
              </div>
              <button
                type="button"
                onClick={() => quickFillAndLogin('admin@localbuddy.vn')}
                className="shrink-0 px-3 py-1 rounded-full bg-[#F3F1EC] text-[#1C1917] hover:bg-[#E7E5E4] text-[11px] font-semibold cursor-pointer border border-[#E7E5E4]"
              >
                Vào Admin
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} className="space-y-3.5">
          <Input
            label="Email hoặc Số điện thoại"
            placeholder="dukhach@gmail.com hoặc 0905..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[13px] font-medium text-[#1C1917]">
                Mật khẩu
              </label>
              <Link
                to="/quen-mat-khau"
                className="text-[12px] text-[#78716C] hover:text-[#1C1917]"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-[12px] text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
            Đăng nhập
          </Button>
        </form>

        <div className="text-center text-[13px] text-[#78716C] border-t border-[#E7E5E4] pt-4">
          Chưa có tài khoản?{' '}
          <Link
            to="/dang-ky"
            className="font-bold text-[#1C1917] hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
