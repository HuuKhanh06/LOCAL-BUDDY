// pages/tourist/LoginPage.tsx (UC.02: Đăng nhập đa vai trò với Supabase Auth & Xử lý ngách lỗi)
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

  const [identifier, setIdentifier] = useState('huan.duong@gmail.com');
  const [password, setPassword] = useState('123456');
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
      // Nếu đã cấu hình Supabase Cloud và người dùng nhập email không phải tài khoản mẫu 1-chạm
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
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-md space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#1EC1CB] text-[#1C1C28] font-black text-[20px] flex items-center justify-center mx-auto mb-3">
            LB
          </div>
          <h1 className="text-[24px] font-extrabold text-[#1A0A0F]">
            Đăng nhập LocalBuddy Đà Nẵng
          </h1>
          <p className="text-[14px] text-[#52526B] mt-1">
            Quản lý lịch trình, đặt cọc và trò chuyện trực tiếp cùng Hướng dẫn viên bản địa
          </p>
        </div>

        {/* Các thông báo trạng thái phiên / xác minh email / đặt lại mật khẩu */}
        {isSessionExpired && (
          <div className="p-3.5 rounded-[12px] bg-[#FEF1DC] border border-[#F8CA84] text-[13px] text-[#8C4A08] font-semibold">
            ⏰ Phiên đăng nhập của bạn đã hết hạn để đảm bảo an toàn. Vui lòng đăng nhập lại để tiếp tục thao tác.
          </div>
        )}
        {isEmailVerified && (
          <div className="p-3.5 rounded-[12px] bg-[#E3F7EF] border border-[#99E2C4] text-[13px] text-[#0F6E4B] font-semibold">
            ✓ Địa chỉ Email của bạn đã được xác minh thành công! Hãy đăng nhập ngay bên dưới.
          </div>
        )}
        {isResetSuccess && (
          <div className="p-3.5 rounded-[12px] bg-[#E3F7EF] border border-[#99E2C4] text-[13px] text-[#0F6E4B] font-semibold">
            ✓ Đã cập nhật mật khẩu mới thành công! Vui lòng đăng nhập bằng mật khẩu mới.
          </div>
        )}

        {/* Khung chọn nhanh 3 vai trò Demo */}
        <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-4 space-y-2.5">
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#1A0A0F] block">
            ⚡ Đăng nhập 1 chạm theo vai trò (3 Tài khoản Demo):
          </span>

          <div className="grid grid-cols-1 gap-2 text-[13px]">
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E4C3CC]">
              <div>
                <strong className="text-[#1A0A0F]">🧳 Du khách: Dương Đăng Huân</strong>
                <span className="block text-[11px] text-[#52526B]">
                  huan.duong@gmail.com • MK: 123456
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => quickFillAndLogin('huan.duong@gmail.com')}
              >
                Vào ngay
              </Button>
            </div>

            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E4C3CC]">
              <div>
                <strong className="text-[#1A0A0F]">🧭 HDV: Nguyễn Hữu Khanh (Đã KYC)</strong>
                <span className="block text-[11px] text-[#52526B]">
                  khanh.nguyen.dn@gmail.com • MK: 123456
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => quickFillAndLogin('khanh.nguyen.dn@gmail.com')}
              >
                Vào ngay
              </Button>
            </div>

            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E4C3CC]">
              <div>
                <strong className="text-[#1A0A0F]">🪪 HDV mới: Hoàng Minh Đức (Chờ KYC)</strong>
                <span className="block text-[11px] text-[#52526B]">
                  minhduc.kyc@gmail.com • MK: 123456
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => quickFillAndLogin('minhduc.kyc@gmail.com')}
              >
                Vào ngay
              </Button>
            </div>

            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E4C3CC]">
              <div>
                <strong className="text-[#1A0A0F]">⚖️ Admin: Lê Văn Hoàng</strong>
                <span className="block text-[11px] text-[#52526B]">
                  admin@localbuddy.vn • MK: 123456
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="dark"
                onClick={() => quickFillAndLogin('admin@localbuddy.vn')}
              >
                Vào Admin
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
          <Input
            label="Email hoặc Số điện thoại *"
            placeholder="Nhập email hoặc số điện thoại"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[14px] font-semibold text-[#1A0A0F]">
                Mật khẩu *
              </label>
              <Link
                to="/quen-mat-khau"
                className="text-[12px] font-bold text-[#118B93] hover:text-[#1A0A0F] underline"
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
            <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
            Đăng nhập vào hệ thống
          </Button>
        </form>

        <div className="text-center text-[14px] text-[#52526B] border-t border-[#E4C3CC] pt-4">
          Chưa có tài khoản LocalBuddy?{' '}
          <Link
            to="/dang-ky"
            className="font-bold text-[#1A0A0F] underline decoration-[#1EC1CB] decoration-2"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};
