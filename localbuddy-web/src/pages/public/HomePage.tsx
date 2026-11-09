// pages/public/HomePage.tsx
// Trang chủ thương mại lấy cảm hứng từ Withlocals + ToursByLocals + ShowAround
// Bảng màu: Burgundy (#1A0A0F), Blush (#F6E6EA), Navy (#1C1C28), Cyan (#1EC1CB - chữ luôn là Navy #1C1C28)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { GuideCard } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';
import { DANANG_AREAS } from '../../data/mockData';

const DANANG_SPOTLIGHT_CARDS = [
  {
    name: 'Bán đảo Sơn Trà',
    subtitle: 'Chùa Linh Ứng, Đỉnh Bàn Cờ & săn Voọc chà vá chân nâu quý hiếm',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    tag: 'Thiên nhiên & Nhiếp ảnh',
  },
  {
    name: 'Ngũ Hành Sơn',
    subtitle: 'Khám phá động Huyền Không, làng đá Non Nước & tầm nhìn biển Non Nước',
    image:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=80',
    tag: 'Di sản & Văn hóa',
  },
  {
    name: 'Bà Nà Hills',
    subtitle: 'Cầu Vàng trứ danh, cáp treo xuyên mây & Làng Pháp cổ kính trên đỉnh Chúa',
    image:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80',
    tag: 'Biểu tượng Đà Nẵng',
  },
  {
    name: 'Phố cổ Hội An',
    subtitle: 'Dạo phố đèn lồng ven sông Hoài, thưởng thức cao lầu & thả hoa đăng đêm',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    tag: 'Kết nối từ Đà Nẵng',
  },
];

const HOME_FAQS = [
  {
    q: 'LocalBuddy tính chi phí theo đầu người hay theo giờ?',
    a: '100% tính theo GIỜ thuê riêng Hướng dẫn viên (từ 80.000 ₫ – 500.000 ₫ / giờ tùy kinh nghiệm), không phụ thu theo số người trong nhóm nhỏ của bạn.',
  },
  {
    q: 'Tôi có bị trừ tiền ngay khi bấm đặt lịch không?',
    a: 'Chưa! Khi gửi yêu cầu, khung giờ vẫn mở và bạn chưa phải trả tiền. Chỉ khi HDV chấp nhận lịch (hoặc bạn chọn khóa giữ chỗ), hệ thống mới khóa nguyên tử khung giờ 15 phút để bạn đặt cọc 30%. Phần 70% còn lại chỉ thanh toán sau khi hoàn thành chuyến đi.',
  },
  {
    q: 'Chính sách hủy và hoàn tiền đặt cọc 30% được tính như thế nào?',
    a: 'Tính tự động theo khoảng cách thời gian ΔT từ lúc hủy đến giờ hẹn khởi hành: Hủy trước > 48 giờ được hoàn 100% cọc; từ 24–48 giờ hoàn 50% cọc; dưới 24 giờ phạt 100% cọc. Nếu lỗi hủy từ phía HDV, bạn luôn được hoàn 100% tiền cọc.',
  },
  {
    q: 'Làm sao biết Hướng dẫn viên trên LocalBuddy đáng tin cậy?',
    a: 'Mọi Hướng dẫn viên hiển thị trên hệ thống đều đã vượt qua bước thẩm định định danh KYC của Quản trị viên (CCCD gắn chip, Thẻ HDV hoặc chứng chỉ ngoại ngữ) và chỉ nhận đánh giá thật từ các đơn đã hoàn thành.',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { verifiedGuides, reviews, getUserById, slots } = useBookingContext();
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [guestCount, setGuestCount] = useState('2');

  const availableDates = Array.from(
    new Set(slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date))
  ).sort();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTimePeriod) params.set('time', selectedTimePeriod);
    if (guestCount) params.set('guests', guestCount);
    navigate(`/guides?${params.toString()}`);
  };

  return (
    <div className="space-y-14 py-2">
      {/* 1. HERO BANNER (Nền Navy #1C1C28 kết hợp Burgundy #1A0A0F, nút CTA Cyan #1EC1CB chữ Navy #1C1C28) */}
      <section className="relative rounded-[20px] overflow-hidden bg-[#1C1C28] text-white shadow-xl border border-[#E4C3CC]/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1EC1CB]/20 border border-[#1EC1CB]/50 text-[#1EC1CB] text-[12px] font-bold tracking-wide">
              <span>✨</span>
              <span>100% Hướng dẫn viên bản địa Đà Nẵng đã xác thực KYC</span>
            </div>

            <h1 className="text-[30px] sm:text-[40px] lg:text-[44px] font-black text-white leading-[1.15] tracking-tight">
              Khám phá Đà Nẵng theo giờ cùng{' '}
              <span className="text-[#1EC1CB]">người bạn bản địa</span> hiểu từng góc phố
            </h1>

            <p className="text-[15px] sm:text-[16px] text-[#F6E6EA]/90 leading-relaxed max-w-2xl">
              Tự do lên lịch trình riêng tại Cầu Rồng, Bán đảo Sơn Trà, Chợ Cồn hay Bà Nà Hills. Đặt theo giờ minh bạch từ{' '}
              <strong className="text-[#1EC1CB]">180.000 ₫ – 320.000 ₫ / giờ</strong>, chỉ đặt cọc 30% sau khi Hướng dẫn viên xác nhận nhận lịch.
            </p>

            {/* Thanh tìm kiếm thương mại kiểu Withlocals (Khu vực, Ngày, Giờ, Số người) */}
            <form
              onSubmit={handleSearch}
              aria-label="Tìm kiếm Hướng dẫn viên Đà Nẵng"
              className="bg-white p-3 rounded-[16px] shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 border-2 border-[#1EC1CB]"
            >
              <div className="lg:col-span-3 flex flex-col px-2.5 py-1 border-b sm:border-b-0 sm:border-r border-[#E4C3CC]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52526B]">
                  📍 Điểm đến / Khu vực
                </span>
                <select
                  aria-label="Chọn khu vực Đà Nẵng"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full py-1 text-[13px] text-[#1C1C28] font-bold bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">Toàn TP. Đà Nẵng</option>
                  {DANANG_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3 flex flex-col px-2.5 py-1 border-b sm:border-b-0 lg:border-r border-[#E4C3CC]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52526B]">
                  📅 Ngày khởi hành
                </span>
                <select
                  aria-label="Chọn ngày khởi hành"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full py-1 text-[13px] text-[#1C1C28] font-bold bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">Mọi ngày còn trống</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d.split('-').reverse().join('/')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 flex flex-col px-2.5 py-1 border-b sm:border-b-0 sm:border-r border-[#E4C3CC]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52526B]">
                  ⏰ Khung giờ
                </span>
                <select
                  aria-label="Chọn buổi trong ngày"
                  value={selectedTimePeriod}
                  onChange={(e) => setSelectedTimePeriod(e.target.value)}
                  className="w-full py-1 text-[13px] text-[#1C1C28] font-bold bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">Cả ngày</option>
                  <option value="morning">Buổi sáng</option>
                  <option value="afternoon">Buổi chiều</option>
                  <option value="evening">Buổi tối</option>
                </select>
              </div>

              <div className="lg:col-span-2 flex flex-col px-2.5 py-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52526B]">
                  👥 Số người
                </span>
                <select
                  aria-label="Số lượng khách"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full py-1 text-[13px] text-[#1C1C28] font-bold bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="1">1 du khách</option>
                  <option value="2">2 du khách</option>
                  <option value="4">Nhóm 3–4 người</option>
                  <option value="6">Nhóm 5–8 người</option>
                  <option value="10">Đoàn 9+ người</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2 flex items-center">
                <Button type="submit" variant="primary" size="md" className="w-full h-full">
                  Tìm HDV →
                </Button>
              </div>
            </form>

            {/* Hàng trấn an chính sách (Withlocals Reassurance Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[12px] text-[#F6E6EA]/90">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-[10px] border border-white/10">
                <span className="text-[#1EC1CB] font-bold">✓</span>
                <span>HDV duyệt mới thu cọc 30% (Giữ lịch 15p)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-[10px] border border-white/10">
                <span className="text-[#1EC1CB] font-bold">✓</span>
                <span>Hoàn 100% cọc khi hủy trước 48 giờ</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-[10px] border border-white/10">
                <span className="text-[#1EC1CB] font-bold">✓</span>
                <span>Tất toán 70% sau khi hoàn thành tour</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-72 lg:h-full min-h-[340px]">
            <img
              src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop&q=80"
              alt="Cầu Rồng Đà Nẵng"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1C1C28] via-[#1C1C28]/40 to-transparent" />
            <div className="absolute bottom-5 right-5 left-5 sm:left-auto bg-[#1A0A0F]/95 border border-[#1EC1CB]/50 rounded-[14px] p-4 max-w-xs backdrop-blur-xs shadow-lg">
              <p className="text-[11px] uppercase tracking-wider text-[#1EC1CB] font-bold">
                Trải nghiệm thực tế tại Đà Nẵng
              </p>
              <p className="text-[13px] text-white font-semibold mt-1">
                “Đi cùng anh Khanh 3 tiếng buổi sáng ở Sơn Trà & Chợ Cồn vui như đi với bạn thân lâu năm!”
              </p>
              <p className="text-[11px] text-[#F6E6EA]/75 mt-1.5">
                — Dương Đăng Huân • Đánh giá 5.0 ★
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THẺ ĐIỂM ĐẾN ĐÀ NẴNG (City / Area Cards kiểu Withlocals) */}
      <section className="space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] bg-[#F6E6EA] px-3 py-1 rounded-full">
              Tự chọn khu vực & Khung giờ
            </span>
            <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[#1A0A0F] mt-2">
              Khám phá Đà Nẵng theo phong cách của riêng bạn
            </h2>
          </div>
          <Link
            to="/guides"
            className="text-[14px] font-bold text-[#1C1C28] hover:text-[#1A0A0F] underline decoration-[#1EC1CB] decoration-2 underline-offset-4"
          >
            Xem tất cả khu vực →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DANANG_SPOTLIGHT_CARDS.map((spot) => (
            <div
              key={spot.name}
              onClick={() => navigate(`/guides?area=${encodeURIComponent(spot.name)}`)}
              className="group relative h-64 rounded-[12px] overflow-hidden cursor-pointer shadow-sm border border-[#E4C3CC] hover:border-[#1EC1CB] transition-all"
            >
              <img
                src={spot.image}
                alt={spot.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0F] via-[#1A0A0F]/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1EC1CB] text-[#1C1C28]">
                {spot.tag}
              </span>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-[18px] font-extrabold text-white group-hover:text-[#1EC1CB] transition-colors">
                  {spot.name}
                </h3>
                <p className="text-[12px] text-[#F6E6EA]/90 mt-1 line-clamp-2">
                  {spot.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DANH SÁCH HƯỚNG DẪN VIÊN BẢN ĐỊA NỔI BẬT (Đơn giá "250.000 ₫ / giờ") */}
      <section className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] bg-[#F6E6EA] px-3 py-1 rounded-full">
              100% Đã thẩm định CCCD & Chuyên môn (BR-01)
            </span>
            <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[#1A0A0F] mt-2">
              Gặp gỡ các Local Guide hàng đầu tại Đà Nẵng
            </h2>
            <p className="text-[14px] text-[#52526B] mt-1">
              Đặt lịch trực tiếp theo giờ, nhắn tin thỏa thuận lịch trình và điểm hẹn linh hoạt
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/guides')}>
            Xem tất cả {verifiedGuides.length} Hướng dẫn viên →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* 4. QUY TRÌNH 4 BƯỚC MINH BẠCH (Quy trình To-Be chuẩn tài liệu) */}
      <section className="bg-[#F6E6EA] border border-[#E4C3CC] rounded-[16px] p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-[24px] font-extrabold text-[#1A0A0F]">
            Quy trình đặt lịch & Bảo vệ thanh toán chuẩn Quốc tế
          </h2>
          <p className="text-[14px] text-[#52526B] mt-1">
            Kết hợp cơ chế giữ lịch xác nhận của Withlocals và đặt lịch theo giờ của ShowAround
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-[12px] p-5 border border-[#E4C3CC] space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] font-black flex items-center justify-center text-[16px]">
              01
            </div>
            <h3 className="text-[16px] font-bold text-[#1A0A0F]">
              Chọn HDV & Khung giờ
            </h3>
            <p className="text-[13px] text-[#52526B] leading-relaxed">
              Chọn khung giờ trống, nhập Điểm hẹn tại Đà Nẵng và Ghi chú lịch trình mong muốn (UC.12). Chưa thu tiền ngay!
            </p>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#E4C3CC] space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] font-black flex items-center justify-center text-[16px]">
              02
            </div>
            <h3 className="text-[16px] font-bold text-[#1A0A0F]">
              HDV xác nhận & Khóa lịch 15p
            </h3>
            <p className="text-[13px] text-[#52526B] leading-relaxed">
              Khi HDV bấm Chấp nhận (UC.13), hệ thống khóa nguyên tử khung giờ (HOLD) trong 15 phút để bạn đặt cọc 30% (UC.14).
            </p>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#E4C3CC] space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] font-black flex items-center justify-center text-[16px]">
              03
            </div>
            <h3 className="text-[16px] font-bold text-[#1A0A0F]">
              Trải nghiệm & Cửa sổ 24h
            </h3>
            <p className="text-[13px] text-[#52526B] leading-relaxed">
              Sau chuyến đi, HDV gửi yêu cầu hoàn thành (UC.17). Bạn có 24 giờ để xác nhận (UC.18) hoặc gửi khiếu nại nếu có sự cố (UC.19).
            </p>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#E4C3CC] space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#1EC1CB] text-[#1C1C28] font-black flex items-center justify-center text-[16px]">
              04
            </div>
            <h3 className="text-[16px] font-bold text-[#1A0A0F]">
              Tất toán 70% & Đánh giá
            </h3>
            <p className="text-[13px] text-[#52526B] leading-relaxed">
              Thanh toán nốt 70% còn lại qua cổng Online hoặc Tiền mặt trực tiếp cho HDV (UC.20, UC.21) và để lại đánh giá 1–5 sao (UC.26).
            </p>
          </div>
        </div>
      </section>

      {/* 5. LỜI CHỨNG THỰC TỪ DU KHÁCH (ToursByLocals Testimonials) */}
      <section className="space-y-5">
        <div>
          <h2 className="text-[24px] font-extrabold text-[#1A0A0F]">
            Đánh giá thực tế từ Du khách vừa đi Đà Nẵng
          </h2>
          <p className="text-[14px] text-[#52526B]">
            100% đánh giá đến từ các đơn đặt lịch đã hoàn thành và thanh toán đầy đủ (BR-09)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.slice(0, 3).map((rev) => {
            const tourist = getUserById(rev.touristId);
            const guide = getUserById(rev.guideId);
            return (
              <div
                key={rev.id}
                className="bg-white border border-[#E4C3CC] rounded-[12px] p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-500 font-bold text-[14px]">
                      {'★'.repeat(rev.stars)}
                    </span>
                    <span className="text-[11px] font-bold text-[#52526B] bg-[#F6E6EA] px-2 py-0.5 rounded">
                      Đơn {rev.bookingId}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#1C1C28] italic leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
                <div className="border-t border-[#E4C3CC] pt-3 flex items-center justify-between text-[12px]">
                  <div>
                    <strong className="text-[#1A0A0F] block">
                      {tourist?.fullName || 'Du khách'}
                    </strong>
                    <span className="text-[#52526B]">
                      Đồng hành cùng HDV {guide?.fullName || 'Đà Nẵng'}
                    </span>
                  </div>
                  <Link
                    to={`/guides/${rev.guideId}`}
                    className="text-[#1C1C28] font-bold hover:underline"
                  >
                    Xem HDV →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CÂU HỎI THƯỜNG GẶP (FAQ Trang chủ) */}
      <section className="bg-white border border-[#E4C3CC] rounded-[16px] p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F] bg-[#F6E6EA] px-3 py-1 rounded-full">
              Giải đáp nhanh cho Du khách
            </span>
            <h2 className="text-[24px] font-extrabold text-[#1A0A0F] mt-2">
              Câu hỏi thường gặp khi đặt Hướng dẫn viên tại Đà Nẵng
            </h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/guides')}>
            Bắt đầu tìm HDV →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HOME_FAQS.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-[12px] bg-[#FBF4F6] border border-[#E4C3CC] space-y-2"
            >
              <h3 className="text-[15px] font-extrabold text-[#1A0A0F]">
                ❓ {item.q}
              </h3>
              <p className="text-[13px] text-[#52526B] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
