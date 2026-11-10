// pages/tourist/RegisterPage.tsx (UC.01 & UC.02: Đăng ký tài khoản Tourist / Guide)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { useBookingContext } from '../../context/BookingContext';
import { DANANG_AREAS, GUIDE_LANGUAGES } from '../../data/mockData';
import { supabaseAuthApi } from '../../lib/supabase';
import { Logo } from '../../components/common/Logo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { registerAccount } = useBookingContext();
  const { t } = useTranslation();

  const [roleTab, setRoleTab] = useState<'tourist' | 'guide'>('tourist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifySentMessage, setVerifySentMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('Việt Nam');
  const [hourlyRate, setHourlyRate] = useState('220000');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([
    'Cầu Rồng & Sông Hàn',
    'Bán đảo Sơn Trà',
  ]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([
    'Tiếng Việt',
    'Tiếng Anh',
  ]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerifySentMessage('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (!/^0\d{9,10}$/.test(phone.trim())) {
      setErrorMsg('Số điện thoại không hợp lệ (10–11 chữ số bắt đầu bằng 0).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (roleTab === 'guide') {
      const rateNum = Number(hourlyRate);
      if (Number.isNaN(rateNum) || rateNum < 80000 || rateNum > 500000) {
        setErrorMsg(t('msg_invalid_hourly_rate'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const cloudRes = await supabaseAuthApi.signUp({
        email,
        password,
        fullName,
        phone,
        role: roleTab,
      });

      if (!cloudRes.ok) {
        setErrorMsg(cloudRes.message);
        return;
      }

      const res = registerAccount({
        role: roleTab,
        fullName,
        email,
        phone,
        nationality,
        hourlyRate: Number(hourlyRate),
        areas: selectedAreas,
        languages: selectedLangs,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      if (cloudRes.needsEmailVerification) {
        setVerifySentMessage(cloudRes.message);
        showToast(cloudRes.message, 'info');
        return;
      }

      showToast(res.message, 'success');
      if (roleTab === 'guide') {
        navigate('/guide/kyc');
      } else {
        navigate('/guides');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-[var(--lb-surface)] border border-[var(--lb-border)] rounded-[24px] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo variant="icon" size="lg" />
          </div>
          <h1 className="text-[22px] font-bold text-[var(--lb-text)]">
            Đăng ký tài khoản LocalBuddy
          </h1>
          <p className="text-[13px] text-[var(--lb-muted)] mt-1">
            Chọn vai trò để bắt đầu hành trình tại Đà Nẵng
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'tourist', label: '🧳 Du khách' },
            { id: 'guide', label: '🧭 Hướng dẫn viên' },
          ]}
          activeTab={roleTab}
          onChange={(id) => setRoleTab(id as 'tourist' | 'guide')}
          className="mb-4 justify-center"
        />

        {roleTab === 'guide' && (
          <div className="p-3.5 bg-[var(--lb-surface-2)] border border-[var(--lb-warning)] rounded-[14px] text-[12px] text-[var(--lb-warning)]">
            <strong>Quy định KYC:</strong> Sau khi tạo tài khoản Guide, bạn cần nộp ảnh CCCD hoặc Thẻ sinh viên để Admin thẩm định trước khi mở nhận booking.
          </div>
        )}

        <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên *"
              placeholder="Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Số điện thoại *"
              placeholder="0905123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Địa chỉ Email *"
              type="email"
              placeholder="ten@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {roleTab === 'tourist' ? (
              <Input
                label="Quốc tịch"
                placeholder="Việt Nam"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            ) : (
              <Input
                label="Đơn giá (VNĐ / giờ) *"
                type="number"
                min={80000}
                max={500000}
                step={10000}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                hint="Từ 80.000 ₫ đến 500.000 ₫ / giờ"
              />
            )}
          </div>

          {roleTab === 'guide' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[12px] font-bold text-[var(--lb-text)] block mb-1.5">
                  Khu vực dẫn khách tại Đà Nẵng:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DANANG_AREAS.map((area) => {
                    const active = selectedAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleItem(selectedAreas, area, setSelectedAreas)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] border-[var(--lb-accent)]'
                            : 'bg-[var(--lb-surface-2)] text-[var(--lb-muted)] border-[var(--lb-border)] hover:text-[var(--lb-text)]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[var(--lb-text)] block mb-1.5">
                  Ngôn ngữ giao tiếp:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GUIDE_LANGUAGES.map((lang) => {
                    const active = selectedLangs.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleItem(selectedLangs, lang, setSelectedLangs)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)] border-[var(--lb-accent)]'
                            : 'bg-[var(--lb-surface-2)] text-[var(--lb-muted)] border-[var(--lb-border)] hover:text-[var(--lb-text)]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mật khẩu *"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Xác nhận mật khẩu *"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {verifySentMessage && (
            <div className="p-3 bg-[var(--lb-surface-2)] border border-[var(--lb-success)] text-[var(--lb-success)] rounded-[12px] text-[12px] font-medium">
              ✉️ {verifySentMessage}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[var(--lb-surface-2)] border border-[var(--lb-error)] text-[var(--lb-error)] rounded-[12px] text-[12px] font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
            {roleTab === 'guide'
              ? 'Tạo tài khoản Guide & Tiếp tục nộp KYC →'
              : 'Hoàn tất đăng ký Du khách'}
          </Button>
        </form>

        <div className="text-center text-[13px] text-[var(--lb-muted)] border-t border-[var(--lb-border)] pt-4">
          Đã có tài khoản?{' '}
          <Link
            to="/dang-nhap"
            className="font-bold text-[var(--lb-blue-text)] hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
