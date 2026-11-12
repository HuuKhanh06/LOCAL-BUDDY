// pages/guide/ProfileAndPricePage.tsx
// Kiểm tra nghiêm ngặt BR-02: Đơn giá từ 80.000 ₫ đến 500.000 ₫ / giờ.
// Cho phép chọn Khu vực hoạt động tại Đà Nẵng, Ngôn ngữ, Kỹ năng và tài khoản ngân hàng nhận tiền.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { formatHourlyRate } from '../../utils/money';
import { KYC_STATUS_LABELS } from '../../utils/statusLabels';
import {
  DANANG_AREAS,
  GUIDE_LANGUAGES,
  GUIDE_SKILLS,
} from '../../data/mockData';

export const ProfileAndPricePage: React.FC = () => {
  const navigate = useNavigate();
  const { allGuides, currentUser, updateGuidePrice } = useBookingContext();
  const { showToast } = useToast();

  const activeGuideId =
    currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const guideItem =
    allGuides.find((g) => g.user.id === activeGuideId) || allGuides[0];

  const [rate, setRate] = useState<number>(
    guideItem?.profile.hourlyRate || 250000
  );
  const [tagline, setTagline] = useState<string>(
    guideItem?.profile.tagline || ''
  );
  const [bio, setBio] = useState<string>(guideItem?.profile.bio || '');
  const [yearsExp, setYearsExp] = useState<number>(
    guideItem?.profile.yearsExperience || 5
  );
  const [areas, setAreas] = useState<string[]>(guideItem?.profile.areas || []);
  const [languages, setLanguages] = useState<string[]>(
    guideItem?.profile.languages || []
  );
  const [skills, setSkills] = useState<string[]>(
    guideItem?.profile.skills || []
  );
  const [bankName, setBankName] = useState<string>(
    guideItem?.profile.bankName || 'Vietcombank - CN Đà Nẵng'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(
    guideItem?.profile.bankAccountNumber || '0041000987654'
  );
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(
    guideItem?.profile.bankAccountHolder || 'NGUYEN HUU KHANH'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!guideItem) return null;

  const toggleChip = (
    list: string[],
    item: string,
    setter: (v: string[]) => void
  ) => {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = updateGuidePrice(guideItem.user.id, rate, bio, {
      tagline,
      areas,
      languages,
      skills,
      yearsExperience: yearsExp,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
    });

    if (!res.ok) {
      setErrorMsg(res.message);
      showToast(res.message, 'error');
      return;
    }

    showToast(res.message, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <img
            src={guideItem.profile.avatarUrl}
            alt={guideItem.user.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#1EC1CB]"
          />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
              Hồ sơ chuyên môn & Đơn giá theo giờ 
            </span>
            <h1 className="text-[24px] font-extrabold text-white mt-0.5">
              {guideItem.user.fullName}
            </h1>
            <p className="text-[13px] text-[#F6E6EA]/85">
              Trạng thái KYC:{' '}
              <strong className="text-[#1EC1CB]">
                {KYC_STATUS_LABELS[guideItem.profile.kycStatus]}
              </strong>{' '}
              • Vi phạm: <strong>{guideItem.user.violationCount} lần</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/guide/kyc')}
          >
            🪪 Xem hồ sơ KYC
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/guides/${guideItem.user.id}`)}
          >
            👁 Xem trang công khai
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Đơn giá thuê theo giờ (VNĐ / giờ) * "
              type="number"
              min={80000}
              max={500000}
              step={10000}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              hint="Bắt buộc trong dải: 80.000 ₫ – 500.000 ₫ / giờ"
            />
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6E6EA] text-[#1A0A0F] text-[13px] font-extrabold">
              Hiển thị trên thẻ HDV: {formatHourlyRate(rate)}
            </div>
          </div>

          <Input
            label="Số năm kinh nghiệm dẫn khách tại Đà Nẵng *"
            type="number"
            min={1}
            max={30}
            value={yearsExp}
            onChange={(e) => setYearsExp(Number(e.target.value))}
          />
        </div>

        <Input
          label="Tiêu đề giới thiệu ngắn (Tagline hiển thị trên thẻ HDV) *"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Ví dụ: Thổ địa ẩm thực Chợ Cồn, nhiếp ảnh Cầu Rồng & Bán đảo Sơn Trà"
        />

        <Textarea
          label="Giới thiệu chi tiết bản thân & Phong cách dẫn tour (Bio) *"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {/* Chọn Khu vực Đà Nẵng */}
        <div>
          <label className="text-[14px] font-bold text-[#1A0A0F] block mb-2">
            📍 Khu vực hoạt động tại Đà Nẵng:
          </label>
          <div className="flex flex-wrap gap-2">
            {DANANG_AREAS.map((area) => {
              const active = areas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleChip(areas, area, setAreas)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#52526B] border-[#E4C3CC]'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chọn Ngôn ngữ */}
        <div>
          <label className="text-[14px] font-bold text-[#1A0A0F] block mb-2">
            🗣 Ngôn ngữ hướng dẫn:
          </label>
          <div className="flex flex-wrap gap-2">
            {GUIDE_LANGUAGES.map((lang) => {
              const active = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleChip(languages, lang, setLanguages)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#52526B] border-[#E4C3CC]'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chọn Kỹ năng */}
        <div>
          <label className="text-[14px] font-bold text-[#1A0A0F] block mb-2">
            🎯 Kỹ năng chuyên môn:
          </label>
          <div className="flex flex-wrap gap-2">
            {GUIDE_SKILLS.map((skill) => {
              const active = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleChip(skills, skill, setSkills)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                      : 'bg-[#FBF4F6] text-[#52526B] border-[#E4C3CC]'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thông tin ngân hàng nhận rút tiền  */}
        <div className="border-t border-[#E4C3CC] pt-5 space-y-4">
          <h3 className="text-[16px] font-extrabold text-[#1A0A0F]">
            🏦 Tài khoản Ngân hàng nhận tiền rút từ Ví 
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Ngân hàng & Chi nhánh"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <Input
              label="Số tài khoản"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
            />
            <Input
              label="Tên chủ tài khoản (In hoa)"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FCE8EB] border border-[#F5B2BA] text-[#A61B2B] rounded-[12px] text-[13px] font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#E4C3CC]">
          <Button type="submit" variant="primary" size="lg">
            💾 Lưu Hồ sơ & Đơn giá theo giờ
          </Button>
        </div>
      </form>
    </div>
  );
};
