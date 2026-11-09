// pages/public/HomePage.tsx
// Thiết kế tối giản tuyệt đối: Rất ít chữ, 1 tông nền sáng duy nhất (#FAF9F6 / #FFFFFF),
// tập trung vào Hình ảnh + Video thực tế cùng chủ đề biển & thiên nhiên nắng sáng Đà Nẵng.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { GuideCard } from '../../components/common/GuideCard';
import { DANANG_AREAS } from '../../data/mockData';

interface MediaShowcaseItem {
  id: string;
  area: string;
  label: string;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  span?: string;
}

const DANANG_MEDIA_SHOWCASE: MediaShowcaseItem[] = [
  {
    id: 'm-1',
    area: 'Bán đảo Sơn Trà',
    label: 'Bán đảo Sơn Trà',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/5371/5371-720.mp4',
    poster:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    span: 'md:col-span-2 md:row-span-2 h-80 md:h-[420px]',
  },
  {
    id: 'm-2',
    area: 'Bà Nà Hills',
    label: 'Cầu Vàng Bà Nà',
    type: 'image',
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-3',
    area: 'Bãi biển Mỹ Khê',
    label: 'Biển Mỹ Khê',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/51500/51500-720.mp4',
    poster:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-4',
    area: 'Đèo Hải Vân & Lăng Cô',
    label: 'Cung đường Hải Vân',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/41576/41576-720.mp4',
    poster:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-5',
    area: 'Ngũ Hành Sơn',
    label: 'Ngũ Hành Sơn',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-6',
    area: 'Cầu Rồng & Sông Hàn',
    label: 'Vịnh Đà Nẵng',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/5363/5363-720.mp4',
    poster:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Marine_da_nang.jpg/1280px-Marine_da_nang.jpg',
    span: 'md:col-span-2 h-64 md:h-[240px]',
  },
  {
    id: 'm-7',
    area: 'Phố cổ Hội An',
    label: 'Phố cổ Hội An',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[240px]',
  },
  {
    id: 'm-8',
    area: 'Bãi biển Mỹ Khê',
    label: 'Làng chài Mân Thái',
    type: 'image',
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
    span: 'h-64 md:h-[240px]',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { verifiedGuides, slots } = useBookingContext();
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');

  const availableDates = Array.from(
    new Set(slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date))
  ).sort();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTimePeriod) params.set('time', selectedTimePeriod);
    navigate(`/guides?${params.toString()}`);
  };

  return (
    <div className="space-y-12 py-2">
      {/* 1. HERO VIDEO SÁNG TỐI GIẢN (Video thực tế + Thanh tìm kiếm nổi 1 dòng) */}
      <section className="relative rounded-[28px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4] h-[440px] sm:h-[500px] flex flex-col justify-end p-6 sm:p-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&auto=format&fit=crop&q=85"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/5369/5369-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div className="relative z-10 max-w-3xl w-full space-y-5">
          <div className="space-y-1.5 text-white">
            <span className="inline-block px-3 py-1 rounded-full bg-white/90 text-[#1C1917] text-[11px] font-bold backdrop-blur-xs">
              Đà Nẵng • Đặt theo giờ
            </span>
            <h1 className="text-[32px] sm:text-[46px] font-black tracking-tight leading-none">
              Đà Nẵng cùng người bản địa
            </h1>
          </div>

          {/* Thanh tìm kiếm trắng tối giản */}
          <form
            onSubmit={handleSearch}
            aria-label="Tìm Hướng dẫn viên"
            className="bg-white/95 backdrop-blur-md p-2 rounded-full shadow-lg grid grid-cols-1 sm:grid-cols-4 gap-2 border border-white"
          >
            <select
              aria-label="Khu vực"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-4 py-2.5 rounded-full text-[13px] font-semibold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">📍 Toàn Đà Nẵng</option>
              {DANANG_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <select
              aria-label="Ngày"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 rounded-full text-[13px] font-semibold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">📅 Mọi ngày</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d.split('-').reverse().join('/')}
                </option>
              ))}
            </select>

            <select
              aria-label="Buổi"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
              className="px-4 py-2.5 rounded-full text-[13px] font-semibold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">⏰ Cả ngày</option>
              <option value="morning">Buổi sáng</option>
              <option value="afternoon">Buổi chiều</option>
              <option value="evening">Buổi tối</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#1C1917] text-white text-[13px] font-bold hover:bg-[#292524] transition-colors cursor-pointer"
            >
              Tìm kiếm →
            </button>
          </form>
        </div>
      </section>

      {/* 2. DẢI CAM KẾT TỐI GIẢN 1 DÒNG (Nền sáng đồng nhất) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { num: '100% KYC', label: 'HDV bản địa xác thực' },
          { num: 'Cọc 30%', label: 'Giữ khung giờ 15 phút' },
          { num: 'Hoàn 100%', label: 'Hủy trước 48 giờ' },
          { num: '★ 4.9 / 5', label: '1.250+ chuyến đi' },
        ].map((item) => (
          <div
            key={item.num}
            className="bg-white border border-[#E7E5E4] rounded-[18px] px-4 py-3.5 text-center"
          >
            <span className="block text-[16px] font-black text-[#1C1917]">
              {item.num}
            </span>
            <span className="text-[12px] text-[#78716C]">{item.label}</span>
          </div>
        ))}
      </section>

      {/* 3. BỘ SƯU TẬP VIDEO & HÌNH ẢNH THỰC TẾ ĐÀ NẴNG (Cùng tông sáng biển & thiên nhiên) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
            Khoảnh khắc Đà Nẵng
          </h2>
          <Link
            to="/guides"
            className="text-[13px] font-semibold text-[#57534E] hover:text-[#1C1917]"
          >
            Tất cả điểm đến →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {DANANG_MEDIA_SHOWCASE.map((item) => {
            const areaGuides = verifiedGuides.filter(({ profile }) =>
              profile.areas.includes(item.area)
            );
            const avatars = (
              areaGuides.length > 0 ? areaGuides : verifiedGuides
            ).slice(0, 3);

            return (
              <div
                key={item.id}
                onClick={() =>
                  navigate(`/guides?area=${encodeURIComponent(item.area)}`)
                }
                className={`group relative rounded-[22px] overflow-hidden bg-[#F3F1EC] border border-[#E7E5E4] cursor-pointer ${item.span || 'h-64'}`}
              >
                {item.type === 'video' ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={item.poster}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  >
                    <source src={item.src} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-[#1C1917] text-[10px] font-bold backdrop-blur-xs">
                  {item.type === 'video' ? '▶ Video' : '📷 Ảnh thực tế'}
                </span>

                {/* Chân thẻ chỉ có Tên địa danh + Cụm Avatar tròn của Host */}
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2">
                  <h3 className="text-[16px] font-bold text-white drop-shadow-xs">
                    {item.label}
                  </h3>
                  <div className="flex items-center -space-x-2 shrink-0">
                    {avatars.map(({ user, profile }) => (
                      <img
                        key={user.id}
                        src={profile.avatarUrl}
                        alt={user.fullName}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white"
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. HƯỚNG DẪN VIÊN BẢN ĐỊA (Thẻ tối giản, ít chữ, đơn giá theo giờ) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
            Hướng dẫn viên bản địa
          </h2>
          <Link
            to="/guides"
            className="px-4 py-2 rounded-full bg-white border border-[#E7E5E4] text-[13px] font-semibold text-[#1C1917] hover:bg-[#F3F1EC]"
          >
            Xem tất cả ({verifiedGuides.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {verifiedGuides.map(({ user, profile }) => (
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
              onClick={() => navigate(`/guides/${user.id}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
