// pages/tourist/ForgotPasswordPage.tsx
// Luồng Quên mật khẩu, Đặt lại mật khẩu & Xác minh Email bằng Supabase Auth (Giai đoạn 3.1)
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, MailCheck, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useBookingContext } from '../../context/BookingContext';
import { useToast } from '../../components/ui/Toast';
import { supabaseAuthApi } from '../../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { allUsers } = useBookingContext();
  const { showToast } = useToast();

  const initialMode = searchParams.get('mode') === 'reset' ? 'reset' : 'request';
  const [step, setStep] = useState<'request' | 'sent' | 'reset'>(initialMode);

  const [email, setEmail] = useState('huan.duong@gmail.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ đã đăng ký với LocalBuddy.');
      return;
    }

    const matchedUser = allUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (matchedUser?.isLocked) {
      setErrorMsg(
        `Tài khoản "${matchedUser.fullName}" đang bị tạm khóa do vi phạm chính sách (${matchedUser.violationCount} lần). Vui lòng liên hệ Quản trị viên Đà Nẵng.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await supabaseAuthApi.requestPasswordReset(trimmed);
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }
      showToast(res.message, 'success');
      setStep('sent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await supabaseAuthApi.updatePassword(newPassword);
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }
      showToast(res.message, 'success');
      navigate('/dang-nhap?reset_success=1');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-[12px] bg-[#1EC1CB] text-[#1C1C28] flex items-center justify-center mx-auto">
            {step === 'sent' ? <MailCheck className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            {step === 'reset'
              ? 'Thiết lập mật khẩu mới'
              : step === 'sent'
                ? 'Kiểm tra hộp thư của bạn'
                : 'Khôi phục mật khẩu LocalBuddy'}
          </h1>
          <p className="text-sm text-[#52526B]">
            {step === 'reset'
              ? 'Nhập mật khẩu mới an toàn cho tài khoản của bạn.'
              : step === 'sent'
                ? `Chúng tôi đã gửi liên kết đặt lại mật khẩu tới ${email}.`
                : 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu qua Supabase Auth.'}
          </p>
        </div>

        {step === 'request' && (
          <form onSubmit={(e) => void handleRequestReset(e)} className="space-y-4">
            <Input
              label="Địa chỉ Email đã đăng ký *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: huan.duong@gmail.com"
              required
            />

            {errorMsg && (
              <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
              Gửi liên kết đặt lại mật khẩu
            </Button>
          </form>
        )}

        {step === 'sent' && (
          <div className="space-y-4">
            <div className="p-4 rounded-[12px] bg-[#E3F7EF] border border-[#99E2C4] text-xs text-[#0F6E4B] leading-relaxed">
              ✓ Liên kết khôi phục có hiệu lực trong <strong>15 phút</strong>. Nếu chưa thấy email, hãy kiểm tra thư mục Quảng cáo / Spam hoặc bấm nút bên dưới để mở ngay bước đặt lại mật khẩu mới.
            </div>
            <Button variant="primary" fullWidth onClick={() => setStep('reset')}>
              Mở biểu mẫu Đặt lại mật khẩu mới →
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setStep('request')}>
              Gửi lại bằng địa chỉ email khác
            </Button>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
            <Input
              label="Mật khẩu mới * (Tối thiểu 6 ký tự)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              required
            />
            <Input
              label="Nhập lại mật khẩu mới *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới..."
              required
            />

            {errorMsg && (
              <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
              Lưu mật khẩu mới & Đăng nhập
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-[#E4C3CC] text-center">
          <Link
            to="/dang-nhap"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A0A0F] hover:text-[#118B93]"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
