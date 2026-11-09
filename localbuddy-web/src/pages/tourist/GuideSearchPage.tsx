// pages/tourist/GuideSearchPage.tsx (UC.07: Tìm kiếm và lọc Hướng dẫn viên tại Đà Nẵng)
// Lọc theo ngày/giờ rảnh THẬT (đọc từ lịch rảnh), ngôn ngữ, khu vực, khoảng giá/giờ, đánh giá;
// sắp xếp; phân trang; lưu trạng thái lọc trên URL; trạng thái rỗng kèm gợi ý nới bộ lọc.

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

  // Đọc danh sách ngày có lịch trống THẬT từ bảng lịch rảnh (AVAILABILITY_SLOT)
  const realAvailableDates = useMemo(() => {
    const unique = new Set(
      slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date)
    );
    return Array.from(unique).sort();
  }, [slots]);

  // Đồng bộ URL -> state khi người dùng đi từ Header / Trang chủ vào
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

  // Đồng bộ state -> URL để lưu trạng thái lọc trên thanh địa chỉ
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

  // Lọc danh sách HDV đã xác minh KYC (BR-01) và khớp khung giờ trống thật
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
      {/* Header trang Tìm kiếm */}
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            UC.07 • Khám phá Đà Nẵng theo giờ
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1">
            Tìm Hướng dẫn viên bản địa tại Đà Nẵng
          </h1>
          <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
            Tìm thấy <strong>{filteredGuides.length}</strong> Hướng dẫn viên đã xác minh KYC sẵn sàng đồng hành
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] bg-white/10 px-4 py-2.5 rounded-[12px] border border-white/15">
          <span className="text-[#1EC1CB] font-extrabold">✓</span>
          <span className="text-[#F6E6EA]">
            Lịch rảnh thời gian thực • Cọc 30% • Giữ khung giờ 15 phút
          </span>
        </div>
      </div>

      {/* Bộ lọc đa tiêu chí (Khu vực, Ngôn ngữ, Kỹ năng, Giá/giờ, Đánh giá, Ngày/Giờ rảnh thật) */}
      <div
        className="bg-white border border-[#E4C3CC] rounded-[16px] p-5 shadow-xs space-y-4"
        role="search"
        aria-label="Bộ lọc Hướng dẫn viên Đà Nẵng"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label
              htmlFor="filter-keyword"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Từ khóa tìm kiếm
            </label>
            <input
              id="filter-keyword"
              type="text"
              placeholder="Tên HDV, Sơn Trà, ẩm thực..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] focus:outline-none focus:border-[#1EC1CB]"
            />
          </div>

          <div>
            <label
              htmlFor="filter-area"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Khu vực tại Đà Nẵng
            </label>
            <select
              id="filter-area"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white focus:outline-none focus:border-[#1EC1CB]"
            >
              <option value="">Tất cả khu vực Đà Nẵng</option>
              {DANANG_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-lang"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Ngôn ngữ hướng dẫn
            </label>
            <select
              id="filter-lang"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white focus:outline-none focus:border-[#1EC1CB]"
            >
              <option value="">Mọi ngôn ngữ</option>
              {GUIDE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-skill"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Chuyên môn / Kỹ năng
            </label>
            <select
              id="filter-skill"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white focus:outline-none focus:border-[#1EC1CB]"
            >
              <option value="">Tất cả kỹ năng</option>
              {GUIDE_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-3 border-t border-[#E4C3CC]/70 items-end">
          <div>
            <label
              htmlFor="filter-date"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Ngày có lịch trống thật
            </label>
            <select
              id="filter-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
            >
              <option value="">Mọi ngày còn trống</option>
              {realAvailableDates.map((d) => (
                <option key={d} value={d}>
                  Ngày {formatDate(d)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-time"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Khung giờ trống
            </label>
            <select
              id="filter-time"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
            >
              <option value="">Cả ngày (Sáng / Chiều / Tối)</option>
              <option value="morning">Buổi sáng (05:00 – 12:00)</option>
              <option value="afternoon">Buổi chiều (12:00 – 18:00)</option>
              <option value="evening">Buổi tối (18:00 – 23:00)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-price"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Giá tối đa: <span className="text-[#1C1C28]">{formatMoney(maxPrice)} / giờ</span>
            </label>
            <select
              id="filter-price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
            >
              <option value={500000}>≤ 500.000 ₫ / giờ (Tất cả)</option>
              <option value={300000}>≤ 300.000 ₫ / giờ</option>
              <option value={250000}>≤ 250.000 ₫ / giờ</option>
              <option value={220000}>≤ 220.000 ₫ / giờ</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-rating"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Điểm đánh giá
            </label>
            <select
              id="filter-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
            >
              <option value={0}>Mọi mức đánh giá</option>
              <option value={4.5}>Từ 4.5 ★ trở lên</option>
              <option value={4.8}>Từ 4.8 ★ trở lên</option>
              <option value={4.9}>Xuất sắc (≥ 4.9 ★)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-sort"
              className="text-[12px] font-bold text-[#1A0A0F] block mb-1"
            >
              Sắp xếp theo
            </label>
            <select
              id="filter-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'rating' | 'price_asc' | 'price_desc')
              }
              className="w-full px-3 min-h-[42px] rounded-[10px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] bg-white"
            >
              <option value="rating">★ Điểm đánh giá cao nhất</option>
              <option value="price_asc">Đơn giá thấp → cao</option>
              <option value="price_desc">Đơn giá cao → thấp</option>
            </select>
          </div>
        </div>

        {hasActiveFilter && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E4C3CC]/60 text-[12px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-[#52526B]">Đang lọc:</span>
              {selectedArea && (
                <span className="px-2.5 py-1 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-semibold">
                  📍 {selectedArea}
                </span>
              )}
              {selectedLang && (
                <span className="px-2.5 py-1 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-semibold">
                  🗣 {selectedLang}
                </span>
              )}
              {selectedDate && (
                <span className="px-2.5 py-1 rounded-full bg-[#E5F8F9] text-[#1C1C28] font-semibold">
                  📅 {formatDate(selectedDate)}
                </span>
              )}
              {selectedTimePeriod && (
                <span className="px-2.5 py-1 rounded-full bg-[#E5F8F9] text-[#1C1C28] font-semibold">
                  ⏰{' '}
                  {selectedTimePeriod === 'morning'
                    ? 'Buổi sáng'
                    : selectedTimePeriod === 'afternoon'
                    ? 'Buổi chiều'
                    : 'Buổi tối'}
                </span>
              )}
              {maxPrice < 500000 && (
                <span className="px-2.5 py-1 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-semibold">
                  ≤ {formatMoney(maxPrice)} / giờ
                </span>
              )}
              {minRating > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#FEF1DC] text-[#8C4A08] font-semibold">
                  ≥ {minRating} ★
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              ✕ Xóa toàn bộ bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Kết quả hiển thị */}
      {filteredGuides.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="Không có Hướng dẫn viên phù hợp"
            description="Hiện chưa có Hướng dẫn viên nào thỏa mãn đồng thời các tiêu chí bạn chọn. Bạn hãy thử nới bộ lọc theo gợi ý bên dưới để xem thêm lịch trống tại Đà Nẵng."
            actionText="Xem toàn bộ Hướng dẫn viên Đà Nẵng"
            onAction={handleResetFilters}
          />
          <div className="bg-white border border-[#E4C3CC] rounded-[12px] p-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
            <span className="font-bold text-[#1A0A0F]">Gợi ý nới bộ lọc nhanh:</span>
            {(selectedDate || selectedTimePeriod) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTimePeriod('');
                }}
                className="px-3 py-1.5 rounded-full bg-[#E5F8F9] text-[#1C1C28] border border-[#1EC1CB] font-bold hover:bg-[#1EC1CB] transition-colors cursor-pointer"
              >
                + Bỏ lọc ngày & khung giờ
              </button>
            )}
            {maxPrice < 500000 && (
              <button
                type="button"
                onClick={() => setMaxPrice(500000)}
                className="px-3 py-1.5 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-bold hover:bg-[#E4C3CC] transition-colors cursor-pointer"
              >
                + Mở rộng giá lên 500.000 ₫ / giờ
              </button>
            )}
            {selectedArea && (
              <button
                type="button"
                onClick={() => setSelectedArea('')}
                className="px-3 py-1.5 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-bold hover:bg-[#E4C3CC] transition-colors cursor-pointer"
              >
                + Mở rộng ra toàn Đà Nẵng
              </button>
            )}
            {minRating > 0 && (
              <button
                type="button"
                onClick={() => setMinRating(0)}
                className="px-3 py-1.5 rounded-full bg-[#F6E6EA] text-[#1A0A0F] font-bold hover:bg-[#E4C3CC] transition-colors cursor-pointer"
              >
                + Bỏ giới hạn số sao
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Phân trang / Tải thêm */}
          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            <p className="text-[12px] text-[#52526B]">
              Đang hiển thị <strong>{displayedGuides.length}</strong> /{' '}
              <strong>{filteredGuides.length}</strong> Hướng dẫn viên tại Đà Nẵng
            </p>
            {visibleCount < filteredGuides.length && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Xem thêm Hướng dẫn viên ({filteredGuides.length - visibleCount} còn lại) →
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
