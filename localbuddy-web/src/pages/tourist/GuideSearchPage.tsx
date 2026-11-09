// pages/tourist/GuideSearchPage.tsx
// Trang Tìm kiếm tối giản: 1 tông nền sáng (#FAF9F6 / #FFFFFF), rất ít chữ, lọc theo lịch rảnh thật.

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GuideCard, EmptyState } from '../../components/common/GuideCard';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { DANANG_AREAS, GUIDE_LANGUAGES, GUIDE_SKILLS } from '../../data/mockData';
import { formatMoney } from '../../utils/money';
import { formatDate } from '../../utils/time';

const PAGE_SIZE = 6;

function matchTimePeriod(startTime: string, period: string): boolean {
  if (!period) return true;
  const hour = parseInt(startTime.split(':')[0] || '0', 10);
  if (period === 'morning') return hour >= 5 && hour < 12;
  if (period === 'afternoon') return hour >= 12 && hour < 18;
  if (period === 'evening') return hour >= 18 && hour <= 23;
  return true;
}

export const GuideSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { verifiedGuides, slots } = useBookingContext();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [selectedArea, setSelectedArea] = useState(() => searchParams.get('area') || '');
  const [selectedLang, setSelectedLang] = useState(() => searchParams.get('lang') || '');
  const [selectedSkill, setSelectedSkill] = useState(() => searchParams.get('skill') || '');
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || '');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    () => searchParams.get('time') || ''
  );
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const raw = Number(searchParams.get('maxPrice'));
    return raw > 0 ? raw : 500000;
  });
  const [minRating, setMinRating] = useState<number>(() => {
    const raw = Number(searchParams.get('minRating'));
    return raw >= 0 ? raw : 0;
  });
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc'>(() => {
    const raw = searchParams.get('sort');
    if (raw === 'price_asc' || raw === 'price_desc') return raw;
    return 'rating';
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const realAvailableDates = useMemo(() => {
    const unique = new Set(
      slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date)
    );
    return Array.from(unique).sort();
  }, [slots]);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const areaParam = searchParams.get('area') || '';
    const dateParam = searchParams.get('date') || '';
    const timeParam = searchParams.get('time') || '';
    if (qParam !== searchTerm) setSearchTerm(qParam);
    if (areaParam !== selectedArea) setSelectedArea(areaParam);
    if (dateParam !== selectedDate) setSelectedDate(dateParam);
    if (timeParam !== selectedTimePeriod) setSelectedTimePeriod(timeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (searchTerm.trim()) next.set('q', searchTerm.trim());
    if (selectedArea) next.set('area', selectedArea);
    if (selectedLang) next.set('lang', selectedLang);
    if (selectedSkill) next.set('skill', selectedSkill);
    if (selectedDate) next.set('date', selectedDate);
    if (selectedTimePeriod) next.set('time', selectedTimePeriod);
    if (maxPrice < 500000) next.set('maxPrice', String(maxPrice));
    if (minRating > 0) next.set('minRating', String(minRating));
    if (sortBy !== 'rating') next.set('sort', sortBy);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    selectedArea,
    selectedLang,
    selectedSkill,
    selectedDate,
    selectedTimePeriod,
    maxPrice,
    minRating,
    sortBy,
  ]);

  const filteredGuides = useMemo(() => {
    const list = verifiedGuides.filter(({ user, profile }) => {
      const q = searchTerm.trim().toLowerCase();
      const matchQuery =
        !q ||
        user.fullName.toLowerCase().includes(q) ||
        profile.bio.toLowerCase().includes(q) ||
        profile.tagline.toLowerCase().includes(q) ||
        profile.areas.some((a) => a.toLowerCase().includes(q)) ||
        profile.skills.some((s) => s.toLowerCase().includes(q));

      const matchArea = !selectedArea || profile.areas.includes(selectedArea);
      const matchLang = !selectedLang || profile.languages.includes(selectedLang);
      const matchSkill = !selectedSkill || profile.skills.includes(selectedSkill);
      const matchPrice = profile.hourlyRate <= maxPrice;
      const matchRating = profile.avgRating >= minRating;

      const matchAvailability =
        (!selectedDate && !selectedTimePeriod) ||
        slots.some(
          (s) =>
            s.guideId === user.id &&
            s.status === 'AVAILABLE' &&
            (!selectedDate || s.date === selectedDate) &&
            matchTimePeriod(s.startTime, selectedTimePeriod)
        );

      return (
        matchQuery &&
        matchArea &&
        matchLang &&
        matchSkill &&
        matchPrice &&
        matchRating &&
        matchAvailability
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.profile.hourlyRate - b.profile.hourlyRate;
      if (sortBy === 'price_desc') return b.profile.hourlyRate - a.profile.hourlyRate;
      return b.profile.avgRating - a.profile.avgRating;
    });
  }, [
    verifiedGuides,
    slots,
    searchTerm,
    selectedArea,
    selectedLang,
    selectedSkill,
    selectedDate,
    selectedTimePeriod,
    maxPrice,
    minRating,
    sortBy,
  ]);

  const displayedGuides = filteredGuides.slice(0, visibleCount);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedArea('');
    setSelectedLang('');
    setSelectedSkill('');
    setSelectedDate('');
    setSelectedTimePeriod('');
    setMaxPrice(500000);
    setMinRating(0);
    setSortBy('rating');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilter =
    Boolean(searchTerm) ||
    Boolean(selectedArea) ||
    Boolean(selectedLang) ||
    Boolean(selectedSkill) ||
    Boolean(selectedDate) ||
    Boolean(selectedTimePeriod) ||
    maxPrice < 500000 ||
    minRating > 0;

  return (
    <div className="space-y-6 py-2">
      {/* Tiêu đề & Chọn nhanh Khu vực trên nền sáng */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-[26px] sm:text-[32px] font-black text-[#1C1917] tracking-tight">
            Hướng dẫn viên Đà Nẵng ({filteredGuides.length})
          </h1>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[13px] font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              ✕ Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedArea('')}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedArea === ''
                ? 'bg-[#1C1917] text-white border-[#1C1917]'
                : 'bg-white text-[#57534E] border-[#E7E5E4] hover:border-[#1C1917]'
            }`}
          >
            Tất cả ({verifiedGuides.length})
          </button>
          {DANANG_AREAS.map((area) => {
            const active = selectedArea === area;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(active ? '' : area)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold shrink-0 transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#57534E] border-[#E7E5E4] hover:border-[#1C1917]'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thanh bộ lọc gọn trên 1 thẻ trắng */}
      <div
        className="bg-white border border-[#E7E5E4] rounded-[20px] p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        role="search"
        aria-label="Bộ lọc"
      >
        <input
          type="text"
          placeholder="Tìm tên, kỹ năng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
        />

        <select
          aria-label="Ngôn ngữ"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917]"
        >
          <option value="">🗣 Ngôn ngữ</option>
          {GUIDE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          aria-label="Ngày trống"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917]"
        >
          <option value="">📅 Mọi ngày</option>
          {realAvailableDates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>

        <select
          aria-label="Buổi"
          value={selectedTimePeriod}
          onChange={(e) => setSelectedTimePeriod(e.target.value)}
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917]"
        >
          <option value="">⏰ Cả ngày</option>
          <option value="morning">Buổi sáng</option>
          <option value="afternoon">Buổi chiều</option>
          <option value="evening">Buổi tối</option>
        </select>

        <select
          aria-label="Giá tối đa"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917]"
        >
          <option value={500000}>≤ 500.000 ₫/giờ</option>
          <option value={300000}>≤ 300.000 ₫/giờ</option>
          <option value={250000}>≤ 250.000 ₫/giờ</option>
          <option value={220000}>≤ 220.000 ₫/giờ</option>
        </select>

        <select
          aria-label="Sắp xếp"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'rating' | 'price_asc' | 'price_desc')
          }
          className="px-3.5 h-10 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[13px] text-[#1C1917]"
        >
          <option value="rating">★ Đánh giá cao</option>
          <option value="price_asc">Giá thấp → cao</option>
          <option value="price_desc">Giá cao → thấp</option>
        </select>
      </div>

      {/* Danh sách kết quả */}
      {filteredGuides.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title="Chưa có Hướng dẫn viên khớp bộ lọc"
            actionText="Xem tất cả Hướng dẫn viên"
            onAction={handleResetFilters}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px]">
            {(selectedDate || selectedTimePeriod) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTimePeriod('');
                }}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E5E4] font-semibold cursor-pointer"
              >
                + Bỏ lọc ngày & giờ
              </button>
            )}
            {maxPrice < 500000 && (
              <button
                type="button"
                onClick={() => setMaxPrice(500000)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E5E4] font-semibold cursor-pointer"
              >
                + Mở rộng mức giá ({formatMoney(500000)})
              </button>
            )}
            {selectedSkill && (
              <button
                type="button"
                onClick={() => setSelectedSkill('')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E5E4] font-semibold cursor-pointer"
              >
                + Bỏ lọc {GUIDE_SKILLS.find((s) => s === selectedSkill) || 'chuyên môn'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedGuides.map(({ user, profile }) => (
              <GuideCard
                key={user.id}
                id={user.id}
                name={user.fullName}
                tagline={profile.tagline}
                bio={profile.bio}
                hourlyRate={profile.hourlyRate}
                avgRating={profile.avgRating}
                totalReviews={profile.totalReviews}
                completedTours={profile.completedTours}
                areas={profile.areas}
                languages={profile.languages}
                skills={profile.skills}
                avatarUrl={profile.avatarUrl}
                coverUrl={profile.coverUrl}
                isVerified={profile.isVerified}
                onClick={() =>
                  navigate(
                    `/guides/${user.id}${
                      selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : ''
                    }`
                  )
                }
              />
            ))}
          </div>

          {visibleCount < filteredGuides.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Xem thêm ({filteredGuides.length - visibleCount}) →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
