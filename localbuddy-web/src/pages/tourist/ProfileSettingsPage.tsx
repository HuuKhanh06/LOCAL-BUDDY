// pages/tourist/ProfileSettingsPage.tsx (UC.04: Quản lý thông tin cá nhân Du khách)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabaseAuthApi } from '../../lib/supabase';

export const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, bookings, uploadFile } = useBookingContext();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!currentPassword.trim()) {
      setPwdError('Vui lòng nhập mật khẩu hiện tại để xác thực.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('Mật khẩu mới xác nhận không khớp.');
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const res = await supabaseAuthApi.updatePassword(newPassword);
      if (!res.ok) {
        setPwdError(res.message);
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast(res.message, 'success');
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadFile('avatars', file);
    if (res.ok) {
      setAvatarUrl(res.url);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const activeUser = currentUser || {
    id: 'u-tourist-1',
    role: 'tourist' as const,
    fullName: 'Dương Đăng Huân',
    email: 'huan.duong@gmail.com',
    phone: '0905123456',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    isLocked: false,
    violationCount: 0,
    nationality: 'Việt Nam',
    preferredLanguage: 'Tiếng Việt, Tiếng Anh',
    createdAt: '2026-09-10T08:00:00Z',
  };

  const [fullName, setFullName] = useState(activeUser.fullName);
  const [phone, setPhone] = useState(activeUser.phone);
  const [nationality, setNationality] = useState(activeUser.nationality || 'Việt Nam');
  const [preferredLanguage, setPreferredLanguage] = useState(
    activeUser.preferredLanguage || 'Tiếng Việt'
  );
  const [avatarUrl, setAvatarUrl] = useState(activeUser.avatarUrl);
  const [errorMsg, setErrorMsg] = useState('');

  const myBookingsCount = bookings.filter((b) => b.touristId === activeUser.id).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    const res = updateUserProfile({
      userId: activeUser.id,
      fullName,
      phone,
      nationality,
      preferredLanguage,
      avatarUrl,
    });

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    showToast(res.message, 'success');
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#1EC1CB]"
          />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
              UC.04 • Hồ sơ tài khoản
            </span>
            <h1 className="text-[24px] font-extrabold text-white mt-0.5">
              {activeUser.fullName}
            </h1>
            <p className="text-[13px] text-[#F6E6EA]/85">
              {activeUser.email} • Đã đặt {myBookingsCount} chuyến đi tại Đà Nẵng
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/don-cua-toi')}>
          Xem đơn đặt lịch ({myBookingsCount}) →
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-5"
      >
        <h2 className="text-[18px] font-extrabold text-[#1A0A0F] border-b border-[#E4C3CC] pb-3">
          Cập nhật thông tin cá nhân
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Số điện thoại liên hệ *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quốc tịch"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
          <Input
            label="Ngôn ngữ ưu tiên khi đi tour"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Input
            label="Ảnh đại diện (URL hoặc tải tệp)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118B93] hover:text-[#1A0A0F] cursor-pointer">
            <span>📤 Tải ảnh đại diện mới từ thiết bị (Supabase Storage: avatars)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarUpload(e)}
            />
          </label>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#E4C3CC]">
          <Button type="submit" variant="primary" size="lg">
            Lưu thay đổi thông tin
          </Button>
        </div>
      </form>

      {/* Khối Đổi mật khẩu bảo mật (Giai đoạn 5) */}
      <form
        onSubmit={(e) => void handlePasswordChange(e)}
        className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-5"
      >
        <div>
          <h2 className="text-[18px] font-extrabold text-[#1A0A0F] border-b border-[#E4C3CC] pb-3">
            Đổi mật khẩu bảo mật
          </h2>
          <p className="text-xs text-[#52526B] mt-2">
            Thay đổi mật khẩu đăng nhập định kỳ giúp bảo vệ an toàn thông tin chuyến đi và thanh toán của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mật khẩu hiện tại *"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="Mật khẩu mới *"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Xác nhận mật khẩu mới *"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>

        {pwdError && (
          <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
            ⚠️ {pwdError}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#E4C3CC]">
          <Button type="submit" variant="secondary" isLoading={isUpdatingPwd}>
            Cập nhật mật khẩu mới
          </Button>
        </div>
      </form>
    </div>
  );
};
