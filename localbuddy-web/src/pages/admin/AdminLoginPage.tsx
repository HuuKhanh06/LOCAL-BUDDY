import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export const AdminLoginPage: React.FC = () => {
  const { login, switchRoleQuickly } = useBookingContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('hoang.admin@localbuddy.vn');
  const [password, setPassword] = useState('Admin@123');
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
      showToast(res.message, 'success');
      navigate('/admin/duyet-kyc');
    } else {
      setError(res.message);
      showToast(res.message, 'error');
    }
  };

  const handleQuickDemoAdmin = () => {
    const u = switchRoleQuickly('admin');
    showToast(`Đã đăng nhập nhanh quyền Admin (${u.fullName})`, 'success');
    navigate('/admin/duyet-kyc');
  };

  return (
    <div className="min-h-screen bg-[#1C1C28] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-[16px] border border-[#E8CED5] shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-[#1A0A0F] px-7 py-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="inline-flex items-center gap-2 text-white font-extrabold text-lg">
              <span className="w-8 h-8 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] flex items-center justify-center font-black">
                LB
              </span>
              LocalBuddy Đà Nẵng
            </Link>
            <span className="px-2.5 py-1 rounded-full bg-[#1EC1CB]/20 text-[#1EC1CB] text-[11px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#F6E6EA]">
            Cổng Quản trị & Vận hành Nền tảng
          </h1>
          <p className="text-xs text-[#F6E6EA]/75 mt-1">
            Thẩm định KYC, xử lý khiếu nại tranh chấp, đối soát rút tiền và cấu hình phí dịch vụ (UC.02).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-semibold text-[#A62626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email Quản trị viên *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hoang.admin@localbuddy.vn"
            required
          />

          <Input
            label="Mật khẩu bảo mật *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Đăng nhập Hệ thống Quản trị
          </Button>

          {/* Quick Demo Box */}
          <div className="pt-4 border-t border-[#E8CED5] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#525266]">
              <span className="font-bold text-[#1A0A0F] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#118B93]" /> Tài khoản Admin mẫu:
              </span>
              <span className="font-mono">Lê Văn Hoàng (admin-1)</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="w-full py-2.5 px-4 rounded-[10px] bg-[#F6E6EA] hover:bg-[#EDD3DA] text-[#1A0A0F] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#146C43]" />
              Vào thẳng Bảng điều khiển Admin (1-Click Demo)
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/dang-nhap"
              className="text-xs font-semibold text-[#525266] hover:text-[#1A0A0F] underline"
            >
              ← Quay lại trang đăng nhập Du khách & Hướng dẫn viên
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs text-[#F6E6EA]/60">
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" /> Kết nối bảo mật SSL
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1">
          <Mail className="w-3.5 h-3.5" /> Bộ phận Vận hành LocalBuddy Đà Nẵng
        </span>
      </div>
    </div>
  );
};
