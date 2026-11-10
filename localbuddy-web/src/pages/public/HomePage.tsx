// pages/public/HomePage.tsx
// Thiết kế theo Mục [9] THAM KHẢO UI:
// - Ô tìm kiếm làm trung tâm: Đà Nẵng cố định + ngày + giờ + số giờ + ngôn ngữ
// - Chủ đề trải nghiệm Đà Nẵng đặc trưng
// - Hàng Guide nổi bật (ảnh chân dung, tên, khu vực, ngôn ngữ, giá/giờ, điểm + số đánh giá, huy hiệu "Đã xác minh")
// - "Cách hoạt động" 3 bước trực quan
// - Khối tin cậy: KYC xác minh, giá minh bạch, chính sách huỷ rõ
// - Khối nền cát (#E6E4DC) tạo nhịp điệu tương phản tự nhiên
// - Đánh giá thật từ du khách
// - CTA trở thành Guide
// - FAQ Accordion câu hỏi thường gặp

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { GuideCard } from '../../components/common/GuideCard';
import { DANANG_AREAS, GUIDE_LANGUAGES } from '../../data/mockData';
import { Logo } from '../../components/common/Logo';

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
    label: 'Bán đảo Sơn Trà & Voọc chà vá',
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
    label: 'Bình minh Biển Mỹ Khê',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/51500/51500-720.mp4',
    poster:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-4',
    area: 'Đèo Hải Vân & Lăng Cô',
    label: 'Cung đường Hải Vân Quan',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/41576/41576-720.mp4',
    poster:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-5',
    area: 'Ngũ Hành Sơn',
    label: 'Danh thắng Ngũ Hành Sơn',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[200px]',
  },
  {
    id: 'm-6',
    area: 'Cầu Rồng & Sông Hàn',
    label: 'Vịnh Đà Nẵng & Sông Hàn về đêm',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/5363/5363-720.mp4',
    poster:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Marine_da_nang.jpg/1280px-Marine_da_nang.jpg',
    span: 'md:col-span-2 h-64 md:h-[240px]',
  },
  {
    id: 'm-7',
    area: 'Phố cổ Hội An',
    label: 'Đèn lồng Phố cổ Hội An',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=85',
    span: 'h-64 md:h-[240px]',
  },
  {
    id: 'm-8',
    area: 'Chợ Cồn & Chợ Hàn',
    label: 'Thiên đường Ẩm thực Chợ Cồn',
    type: 'image',
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
    span: 'h-64 md:h-[240px]',
  },
];

const EXPERIENCES = [
  {
    id: 'exp-1',
    title: 'Ẩm thực đêm & Chợ Cồn',
    desc: 'Mì Quảng ếch, bánh xèo tôm nhảy, hải sản Sơn Trà chuẩn vị người bản xứ.',
    icon: '🍜',
    param: 'Ẩm thực bản địa',
    bg: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  {
    id: 'exp-2',
    title: 'Cầu Rồng & Sông Hàn về đêm',
    desc: 'Xem Rồng phun lửa, du thuyền sông Hàn và góc ngắm hoàng hôn vịnh biển.',
    icon: '🐉',
    param: 'Khám phá Đà Nẵng về đêm',
    bg: 'bg-orange-50 border-orange-200 text-orange-900',
  },
  {
    id: 'exp-3',
    title: 'Sơn Trà & Bán đảo hoang sơ',
    desc: 'Trekking ngắm Voọc chà vá chân nâu, Đỉnh Bàn Cờ và Chùa Linh Ứng uy nghiêm.',
    icon: '🐒',
    param: 'Thiên nhiên & Trekking Sơn Trà',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },
  {
    id: 'exp-4',
    title: 'Nhiếp ảnh & Check-in di sản',
    desc: 'Những góc máy không góc chết tại Cầu Vàng, Làng chiếu Cẩm Nê và Ngũ Hành Sơn.',
    icon: '📸',
    param: 'Nhiếp ảnh & Check-in',
    bg: 'bg-sky-50 border-sky-200 text-sky-900',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Vì sao tôi chỉ cần đặt cọc 30% khi đặt lịch Thổ địa?',
    a: 'LocalBuddy áp dụng cơ chế thanh toán hai chặng minh bạch (BR-03, BR-05): Du khách chỉ cần thanh toán 30% tiền cọc sau khi Hướng dẫn viên bấm chấp nhận yêu cầu để giữ chỗ nguyên tử trong 15 phút. 70% còn lại bạn chỉ phải thanh toán sau khi chuyến đi thực tế đã hoàn thành (qua cổng Online hoặc trả Tiền mặt trực tiếp).',
  },
  {
    q: 'Chính sách hoàn tiền cọc khi hủy lịch được quy định như thế nào?',
    a: 'Chính sách hủy đơn minh bạch theo mốc thời gian ΔT trước giờ hẹn (BR-06): Nếu bạn hủy trước trên 48 giờ, hệ thống hoàn trả 100% tiền cọc; hủy từ 24 đến 48 giờ, hoàn 50% tiền cọc; hủy dưới 24 giờ phạt 100% cọc để bồi hoàn cho Hướng dẫn viên đã giữ lịch. Trường hợp Hướng dẫn viên hủy đơn, bạn luôn được hoàn 100% tiền cọc ngay lập tức.',
  },
  {
    q: 'Giá thuê trên website tính theo đầu người hay tính theo giờ?',
    a: 'Toàn bộ đơn giá trên LocalBuddy được tính THEO GIỜ của Hướng dẫn viên (từ 150.000 ₫ đến 500.000 ₫/giờ). Đơn giá áp dụng chung cho cả nhóm du khách (tối đa 20 người theo phạm vi tour), hoàn toàn không thu thêm phụ phí theo đầu người.',
  },
  {
    q: 'Làm thế nào để tôi liên hệ trực tiếp với Thổ địa?',
    a: 'Để bảo vệ tính riêng tư và an toàn thông tin, sau khi Hướng dẫn viên chấp nhận yêu cầu và bạn hoàn tất đặt cọc 30%, hệ thống sẽ lập tức tạo Hợp đồng dịch vụ điện tử (SERVICE_AGREEMENT) và cung cấp đầy đủ Số điện thoại & Email của Hướng dẫn viên trong trang chi tiết đơn để hai bên trao đổi điểm hẹn.',
  },
  {
    q: 'LocalBuddy có hỗ trợ du khách khi có khiếu nại hoặc sự cố phát sinh không?',
    a: 'Có. Sau khi kết thúc tour, bạn có cửa sổ 24 giờ để bấm Xác nhận hoàn thành hoặc Gửi khiếu nại (UC.19) kèm hình ảnh bằng chứng nếu Hướng dẫn viên vắng mặt (No-show), đi trễ hoặc không đúng cam kết. Đội ngũ Quản trị viên (Admin) sẽ thẩm định và xử lý tranh chấp công minh theo UC.27.',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { verifiedGuides, slots, reviews, getUserById, getGuideById } = useBookingContext();

  // Search state đầy đủ theo Mục [9]: Đà Nẵng cố định + ngày + giờ + số giờ + ngôn ngữ
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [selectedHours, setSelectedHours] = useState('3');
  const [selectedLang, setSelectedLang] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const availableDates = Array.from(
    new Set(slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date))
  ).sort();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTimePeriod) params.set('time', selectedTimePeriod);
    if (selectedHours) params.set('hours', selectedHours);
    if (selectedLang) params.set('lang', selectedLang);
    navigate(`/guides?${params.toString()}`);
  };

  return (
    <div className="space-y-16 py-2">
      {/* 1. HERO VIDEO + Ô TÌM KIẾM TRUNG TÂM (Đà Nẵng cố định + ngày + giờ + số giờ + ngôn ngữ) */}
      <section className="relative rounded-[28px] overflow-hidden bg-[#272A2D] border border-[#E7E5E4] min-h-[500px] flex flex-col justify-end p-6 sm:p-10">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

        <div className="relative z-10 max-w-4xl w-full space-y-6">
          <div className="space-y-2 text-white">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[12px] font-bold border border-white/30 transition-all group"
            >
              <Logo variant="icon" size="sm" />
              <span>Mô hình Thổ địa theo giờ chuẩn Withlocals</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
            <h1 className="text-[32px] sm:text-[48px] font-black tracking-tight leading-tight text-white drop-shadow-sm">
              Khám phá Đà Nẵng cùng người bản địa
            </h1>
            <p className="text-[14px] sm:text-[16px] text-white/90 max-w-2xl font-medium drop-shadow-sm">
              Trải nghiệm Đà Nẵng chân thực, linh hoạt theo giờ. 100% Thổ địa đã xác thực KYC, cọc 30% giữ chỗ, hoàn tiền minh bạch.
            </p>
          </div>

          {/* Ô TÌM KIẾM TRUNG TÂM THEO [9]: Đà Nẵng cố định + ngày + giờ + số giờ + ngôn ngữ */}
          <form
            onSubmit={handleSearch}
            aria-label="Tìm Thổ địa bản địa Đà Nẵng"
            className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-[22px] shadow-2xl border border-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5"
          >
            {/* 1. Điểm đến cố định Đà Nẵng / Khu vực */}
            <div className="flex flex-col">
              <label htmlFor="hp-search-area" className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3">
                Khu vực
              </label>
              <select
                id="hp-search-area"
                aria-label="Khu vực tại Đà Nẵng"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-[#1C1917] bg-[#F3F1EC]/60 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">📍 Toàn Đà Nẵng</option>
                {DANANG_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Ngày khởi hành */}
            <div className="flex flex-col">
              <label htmlFor="hp-search-date" className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3">
                Ngày đi
              </label>
              <select
                id="hp-search-date"
                aria-label="Ngày khởi hành"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-[#1C1917] bg-[#F3F1EC]/60 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">📅 Mọi ngày</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d.split('-').reverse().join('/')}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Khung giờ trong ngày */}
            <div className="flex flex-col">
              <label htmlFor="hp-search-time" className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3">
                Khung giờ
              </label>
              <select
                id="hp-search-time"
                aria-label="Khung giờ trong ngày"
                value={selectedTimePeriod}
                onChange={(e) => setSelectedTimePeriod(e.target.value)}
                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-[#1C1917] bg-[#F3F1EC]/60 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">⏰ Cả ngày</option>
                <option value="morning">Sáng (06:00 – 12:00)</option>
                <option value="afternoon">Chiều (12:00 – 18:00)</option>
                <option value="evening">Tối (18:00 – 22:00)</option>
              </select>
            </div>

            {/* 4. Số giờ thuê (QĐ-02: 1–8 giờ) */}
            <div className="flex flex-col">
              <label htmlFor="hp-search-hours" className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3">
                Thời lượng
              </label>
              <select
                id="hp-search-hours"
                aria-label="Số giờ thuê"
                value={selectedHours}
                onChange={(e) => setSelectedHours(e.target.value)}
                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-[#1C1917] bg-[#F3F1EC]/60 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="1">1 giờ</option>
                <option value="2">2 giờ</option>
                <option value="3">3 giờ (phổ biến)</option>
                <option value="4">4 giờ (nửa ngày)</option>
                <option value="5">5 giờ</option>
                <option value="6">6 giờ</option>
                <option value="8">8 giờ (trọn ngày)</option>
              </select>
            </div>

            {/* 5. Ngôn ngữ hướng dẫn */}
            <div className="flex flex-col">
              <label htmlFor="hp-search-lang" className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] px-3">
                Ngôn ngữ
              </label>
              <select
                id="hp-search-lang"
                aria-label="Ngôn ngữ giao tiếp"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="px-3 py-2 rounded-xl text-[13px] font-semibold text-[#1C1917] bg-[#F3F1EC]/60 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">🗣 Mọi ngôn ngữ</option>
                {GUIDE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Tìm kiếm magenta chuẩn Withlocals */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#D12B79] hover:bg-[#B51E63] text-white text-[13px] font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Tìm Thổ địa</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. DẢI CAM KẾT VẬN HÀNH TIÊU CHUẨN (4 trụ cột niềm tin) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { num: '100% KYC', label: 'CCCD & Thẻ HDV xác thực' },
          { num: 'Cọc 30%', label: 'Giữ chỗ nguyên tử 15 phút' },
          { num: 'Hoàn 100%', label: 'Hủy trước 48 giờ miễn phí' },
          { num: '0 Phí ẩn', label: 'Đơn giá theo giờ minh bạch' },
        ].map((item) => (
          <div
            key={item.num}
            className="bg-white border border-[#E7E5E4] rounded-[18px] px-4 py-3.5 text-center shadow-xs"
          >
            <span className="block text-[17px] font-black text-[#1C1917]">
              {item.num}
            </span>
            <span className="text-[12px] text-[#78716C] font-medium">{item.label}</span>
          </div>
        ))}
      </section>

      {/* 3. CHỦ ĐỀ TRẢI NGHIỆM ĐÀ NẴNG (Mục [9]: chủ đề) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB5B38]">
              Trải nghiệm theo chủ đề
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
              Khám phá Đà Nẵng theo cách của bạn
            </h2>
          </div>
          <Link
            to="/guides"
            className="text-[13px] font-semibold text-[#57534E] hover:text-[#1C1917]"
          >
            Tất cả chủ đề →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate(`/guides?skill=${encodeURIComponent(exp.param)}`)}
              className="bg-white border border-[#E7E5E4] hover:border-[#EB5B38] rounded-[20px] p-5 cursor-pointer transition-all hover:shadow-md space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform">{exp.icon}</span>
                <span className="text-[11px] font-bold text-[#78716C] group-hover:text-[#EB5B38]">
                  Khám phá →
                </span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1C1917] group-hover:text-[#EB5B38] transition-colors">
                  {exp.title}
                </h3>
                <p className="text-[12px] text-[#78716C] mt-1 line-clamp-2">
                  {exp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "CÁCH HOẠT ĐỘNG" 3 BƯỚC — PHONG CÁCH WITHLOCALS (Mục [9] & GĐ1) */}
      <section className="bg-[#FEEDDC] border border-[#F1DEC9] rounded-[28px] p-6 sm:p-10 space-y-8 text-[#1C1917]">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white text-[#D12B79] border border-[#F1DEC9] text-[11px] font-bold">
            Quy trình 3 bước chuẩn Withlocals
          </span>
          <h2 className="text-[24px] sm:text-[32px] font-black tracking-tight text-[#1C1917]">
            Cách LocalBuddy hoạt động
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#6E6259]">
            Đơn giản, trực tiếp và an tâm tuyệt đối với cơ chế giữ cọc hai chặng 30% / 70%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[22px] p-6 space-y-3 border border-[#F1DEC9] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] font-black text-[18px] flex items-center justify-center">
              1
            </div>
            <h3 className="text-[17px] font-black text-[#1C1917]">
              Chọn Thổ địa & Khung giờ
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Khám phá hồ sơ Thổ địa Đà Nẵng đã xác thực KYC 100%. Chọn ngày, khung giờ rảnh thật và gửi yêu cầu (hoàn toàn chưa tính phí).
            </p>
          </div>

          <div className="bg-white rounded-[22px] p-6 space-y-3 border border-[#F1DEC9] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] font-black text-[18px] flex items-center justify-center">
              2
            </div>
            <h3 className="text-[17px] font-black text-[#1C1917]">
              Guide nhận đơn & Cọc 30%
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Thổ địa phản hồi trong 24 giờ. Khi được chấp nhận, hệ thống giữ chỗ 15 phút để bạn nộp cọc 30%, nhận hợp đồng điện tử và số điện thoại/email liên hệ trực tiếp.
            </p>
          </div>

          <div className="bg-white rounded-[22px] p-6 space-y-3 border border-[#F1DEC9] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] font-black text-[18px] flex items-center justify-center">
              3
            </div>
            <h3 className="text-[17px] font-black text-[#1C1917]">
              Đồng hành & Tất toán 70%
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Gặp gỡ tại điểm hẹn Đà Nẵng, tận hưởng chuyến đi riêng tư. Kết thúc tour, bấm xác nhận hoàn thành và thanh toán 70% còn lại (Online hoặc Tiền mặt).
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FDF6ED] border border-[#F1DEC9] text-[#D12B79] font-bold text-[13px] shadow-xs transition-all"
          >
            <span>Xem hướng dẫn chi tiết & Mô hình vận hành chuẩn Withlocals</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* 5. KHỐI TIN CẬY (KYC xác minh, Giá minh bạch, Chính sách huỷ rõ) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#347CCB]">
            Cam kết cốt lõi
          </span>
          <h2 className="text-[22px] sm:text-[28px] font-black text-[#1C1917] tracking-tight">
            Nền tảng đặt Thổ địa đáng tin cậy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#347CCB] flex items-center justify-center text-xl">
              🛡️
            </div>
            <h3 className="text-[17px] font-bold text-[#1C1917]">
              100% Xác thực KYC
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Mọi Thổ địa đều được kiểm duyệt danh tính qua Căn cước công dân gắn chip và Thẻ Hướng dẫn viên du lịch do Sở Du lịch cấp.
            </p>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              💎
            </div>
            <h3 className="text-[17px] font-bold text-[#1C1917]">
              Đơn giá theo giờ minh bạch
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Giá thuê cố định theo giờ từ 150.000 ₫ – 500.000 ₫/giờ. Tuyệt đối không phụ thu theo số lượng người tham gia, không ép vào điểm mua sắm.
            </p>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
              ⚖️
            </div>
            <h3 className="text-[17px] font-bold text-[#1C1917]">
              Chính sách hủy bảo vệ cả hai bên
            </h3>
            <p className="text-[13px] text-[#78716C] leading-relaxed">
              Hủy trước 48 giờ hoàn 100% cọc; hủy 24h–48h hoàn 50% cọc. Nếu Thổ địa hủy đơn, du khách luôn được hoàn 100% cọc kèm quyền khiếu nại.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HÀNG GUIDE NỔI BẬT (Thẻ Guide chuẩn theo [9]) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB5B38]">
              Thổ địa tiêu biểu
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
              Hướng dẫn viên bản địa Đà Nẵng
            </h2>
          </div>
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

      {/* 7. BỘ SƯU TẬP VIDEO & HÌNH ẢNH THỰC TẾ ĐÀ NẴNG */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#347CCB]">
              Góc nhìn thực tế
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
              Khoảnh khắc Đà Nẵng
            </h2>
          </div>
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

      {/* 8. ĐÁNH GIÁ THỰC TẾ TỪ DU KHÁCH (Chỉ hiển thị khi có đánh giá thật trong CSDL) */}
      {reviews.length > 0 && (
        <section className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB5B38]">
              Đánh giá xác thực
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
              Cảm nhận của du khách sau chuyến đi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.slice(0, 3).map((rev) => {
              const tourist = getUserById(rev.touristId);
              const guide = getGuideById(rev.guideId);
              return (
                <div
                  key={rev.id}
                  className="bg-white border border-[#E7E5E4] rounded-[22px] p-6 space-y-3 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      {'★'.repeat(rev.stars)}
                    </div>
                    <p className="text-[13px] text-[#57534E] leading-relaxed italic">
                      “{rev.comment}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between text-[12px]">
                    <div>
                      <strong className="block text-[#1C1917]">{tourist?.fullName || 'Du khách'}</strong>
                      <span className="text-[#78716C]">{rev.createdAt.split('T')[0]}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#F3F1EC] text-[11px] font-semibold text-[#57534E]">
                      Thổ địa: {guide?.user.fullName || 'Đà Nẵng'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. CTA TRỞ THÀNH GUIDE (Mục [9]: CTA trở thành Guide) */}
      <section className="rounded-[26px] bg-[#272A2D] text-white p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-3 max-w-xl z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#EB5B38] text-[11px] font-bold border border-white/15">
            Dành cho Thổ địa Đà Nẵng
          </span>
          <h2 className="text-[24px] sm:text-[32px] font-black tracking-tight leading-snug">
            Bạn là người Đà Nẵng am hiểu văn hóa và ẩm thực quê hương?
          </h2>
          <p className="text-[13px] sm:text-[14px] text-white/80 leading-relaxed">
            Trở thành Thổ địa LocalBuddy để kết nối bạn bè khắp nơi, chủ động xếp lịch rảnh theo giờ và nhận thù lao xứng đáng, minh bạch.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <Link
            to="/dang-ky?role=guide"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#D12B79] hover:bg-[#B51E63] text-white text-[14px] font-bold shadow-lg transition-all transform hover:scale-105"
          >
            <span>Đăng ký làm Thổ địa ngay</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* 10. FAQ ACCORDION (Mục [9]: FAQ) */}
      <section className="space-y-5 max-w-3xl mx-auto">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-[22px] sm:text-[26px] font-black text-[#1C1917] tracking-tight">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="divide-y divide-[#E7E5E4] border border-[#E7E5E4] rounded-[22px] bg-white overflow-hidden shadow-xs">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-[15px] text-[#1C1917] gap-3 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <span className="text-[18px] text-[#78716C] shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-[13px] text-[#57534E] leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
