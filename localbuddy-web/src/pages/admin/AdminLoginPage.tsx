// pages/admin/AdminLoginPage.tsx
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Logo } from '../../components/common/Logo';

export const AdminLoginPage: React.FC = () => {
  const { login } = useBookingContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ Email quản trị và Mật khẩu.');
      return;
    }

    const res = login(email.trim(), password, 'admin');
    if (res.ok) {
      showToast('Đăng nhập Quản trị viên thành công', 'success');
      navigate('/admin/kyc');
    } else {
      setError(res.message);
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lb-bg-deep)] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-[var(--lb-surface)] rounded-[20px] border border-[var(--lb-border)] shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-[var(--lb-surface-2)] px-7 py-6 text-[var(--lb-text)] border-b border-[var(--lb-border)]">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="inline-flex items-center">
              <Logo size="sm" />
            </Link>
            <span className="px-2.5 py-1 rounded-full bg-[var(--lb-surface)] border border-[var(--lb-border)] text-[var(--lb-accent-text)] text-[11px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-lg font-bold text-[var(--lb-text)]">
            Cổng Quản trị & Vận hành Nền tảng
          </h1>
          <p className="text-xs text-[var(--lb-muted)] mt-1">
            Đăng nhập tài khoản Admin để thẩm định KYC, xử lý tranh chấp và quyết toán rút tiền.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="p-3.5 bg-[var(--lb-surface-2)] border border-[var(--lb-error)] rounded-[12px] flex items-start gap-2.5 text-xs text-[var(--lb-error)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--lb-text)] uppercase tracking-wider">
              Email quản trị *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--lb-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="le3245279@gmail.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--lb-text)] uppercase tracking-wider">
              Mật khẩu quản trị *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--lb-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            <span>Đăng nhập Quản trị viên</span>
            <ArrowRight className="w-4 h-4 ml-1.5 inline" />
          </Button>

          <div className="pt-2 text-center text-xs text-[var(--lb-muted)] border-t border-[var(--lb-border)]">
            <Link to="/" className="text-[var(--lb-blue-text)] hover:underline inline-flex items-center gap-1 font-medium">
              ← Quay về Trang chủ LocalBuddy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
