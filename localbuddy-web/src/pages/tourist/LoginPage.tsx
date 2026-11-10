// pages/tourist/LoginPage.tsx (UC.03: Đăng nhập hệ thống)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
      setErrorMsg(t('msg_invalid_login'));
      return;
    }

    setIsLoading(true);
    try {
      const isLocalAccount = allUsers.some(
        (u) =>
          u.email.toLowerCase() === identifier.trim().toLowerCase() ||
          u.phone === identifier.trim()
      );

      if (isSupabaseConfigured && identifier.includes('@') && !isLocalAccount) {
        const cloudRes = await supabaseAuthApi.signIn(identifier, password);
        if (!cloudRes.ok) {
          setErrorMsg(t('msg_invalid_login'));
          return;
        }
      }

      const res = login(identifier, password);
      if (!res.ok) {
        setErrorMsg(t('msg_invalid_login'));
        return;
      }

      showToast('Đăng nhập thành công', 'success');
      navigateByRole(identifier);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[24px] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--lb-accent)] text-[var(--lb-on-accent)] font-black text-[16px] flex items-center justify-center mx-auto mb-3">
            LB
          </div>
          <h1 className="text-[22px] font-bold text-[var(--lb-text)]">
            Đăng nhập hệ thống
          </h1>
          <p className="text-[13px] text-[var(--lb-muted)] mt-1">
            LocalBuddy Đà Nẵng
          </p>
        </div>

        {isSessionExpired && (
          <div className="p-3 rounded-[12px] bg-[var(--lb-surface-2)] border border-[var(--lb-warning)] text-[12px] text-[var(--lb-warning)] font-medium">
            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
          </div>
        )}
        {isEmailVerified && (
          <div className="p-3 rounded-[12px] bg-[var(--lb-surface-2)] border border-[var(--lb-success)] text-[12px] text-[var(--lb-success)] font-medium">
            Xác minh email thành công! Hãy đăng nhập ngay.
          </div>
        )}
        {isResetSuccess && (
          <div className="p-3 rounded-[12px] bg-[var(--lb-surface-2)] border border-[var(--lb-success)] text-[12px] text-[var(--lb-success)] font-medium">
            Đã đổi mật khẩu mới thành công.
          </div>
        )}

        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
          <Input
            label="Email hoặc Số điện thoại"
            placeholder="ten@gmail.com hoặc 0905..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[13px] font-medium text-[var(--lb-text)]">
                Mật khẩu
              </label>
              <Link
                to="/quen-mat-khau"
                className="text-[12px] text-[var(--lb-blue-text)] hover:underline"
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
            <div className="p-3 bg-[var(--lb-surface-2)] border border-[var(--lb-error)] text-[var(--lb-error)] rounded-[12px] text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
            Đăng nhập
          </Button>
        </form>

        <div className="text-center text-[13px] text-[var(--lb-muted)] border-t border-[var(--lb-border)] pt-4">
          Chưa có tài khoản?{' '}
          <Link
            to="/dang-ky"
            className="font-bold text-[var(--lb-blue-text)] hover:underline"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};
