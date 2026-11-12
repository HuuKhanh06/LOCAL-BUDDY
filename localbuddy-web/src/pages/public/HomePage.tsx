// pages/public/HomePage.tsx
// Trang chủ LocalBuddy phong cách Withlocals sáng ấm (#FEEDDC)
// Bố cục chuẩn theo ảnh mẫu Withlocals (https://www.withlocals.com/fr/):
// - Hero banner: Tiêu đề lớn màu than đậm & điểm nhấn hồng mận (#D12B79), ô tìm kiếm dạng pill nổi nền trắng với nút vàng hổ phách (#F2B33D), khối ảnh ghép mosaic địa danh Đà Nẵng
// - Thẻ điểm đến: Phong cách 'QUE FAIRE À...' chuẩn ảnh mẫu với ảnh trên, giới thiệu dưới, hàng avatar Thổ địa kèm vòng tròn xanh + và nút hồng mận 'Khám phá tour', viền thẻ ấm (#EAD7C2)
// - Khối Tour Ẩm thực & Văn hóa Đánh số (1-5) chuẩn mẫu Withlocals (ảnh món ăn, số thứ tự, mô tả, avatar stack, nút khám phá)
// - Quy trình 3 bước giữ cọc 30%/70%
// - Hàng Thổ địa tiêu biểu (100% KYC)
// - Khối cam kết an tâm & Đánh giá thật
// - FAQ Accordion câu hỏi thường gặp

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { GuideCard } from '../../components/common/GuideCard';
import { DANANG_AREAS } from '../../data/mockData';
import { Logo } from '../../components/common/Logo';

interface DestinationCardItem {
  id: string;
  destination: string;
  headline: string;
  desc: string;
  image: string;
  guideCount: number;
  guideAvatars: string[];
  areaParam: string;
}

const DESTINATION_CARDS: DestinationCardItem[] = [
  {
    id: 'dest-1',
    destination: 'Bán đảo Sơn Trà',
    headline: 'Trekking hoang sơ & Voọc chà vá',
    desc: 'Bạn đến Sơn Trà và tự hỏi nên làm gì? Thổ địa bản xứ sẽ dẫn bạn trekking đường rừng nguyên sinh, ngắm bầy Voọc chà vá chân nâu và đón hoàng hôn Đỉnh Bàn Cờ.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=85',
    guideCount: 36,
    guideAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Sơn Trà',
  },
  {
    id: 'dest-2',
    destination: 'Cầu Rồng & Sông Hàn',
    headline: 'Ẩm thực đêm & Sông Hàn lung linh',
    desc: 'Bạn đến Đà Nẵng và tìm kiếm hương vị bản địa? Thổ địa sẽ cùng bạn lùng sục ngõ chợ Cồn thưởng thức mì Quảng, bánh xèo tôm nhảy và xem Rồng phun lửa.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Marine_da_nang.jpg/1280px-Marine_da_nang.jpg',
    guideCount: 42,
    guideAvatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Hải Châu',
  },
  {
    id: 'dest-3',
    destination: 'Bãi biển Mỹ Khê',
    headline: 'Bình minh biển & Thúng chai Mân Thái',
    desc: 'Dạo bờ cát sớm mai cùng ngư dân kéo lưới thúng chai, chèo SUP đón ánh mặt trời vịnh biển và thưởng thức hải sản tươi rói chuẩn giá người địa phương.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg',
    guideCount: 60,
    guideAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Ngũ Hành Sơn',
  },
  {
    id: 'dest-4',
    destination: 'Ngũ Hành Sơn & Non Nước',
    headline: 'Huyền tích động cổ & Làng đá 400 năm',
    desc: 'Khám phá huyền tích Phật giáo trong các hang động kỳ ảo tại Động Huyền Không, viếng Chùa Linh Ứng non nước và chiêm ngưỡng nghề điêu khắc đá truyền thống.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=85',
    guideCount: 25,
    guideAvatars: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Ngũ Hành Sơn',
  },
  {
    id: 'dest-5',
    destination: 'Bà Nà Hills & Cầu Vàng',
    headline: 'Cầu Vàng mây phủ & Làng Pháp',
    desc: 'Trải nghiệm cáp treo kỷ lục ngắm trọn thung lũng xanh mướt, dạo bước trên Cầu Vàng giữa biển mây bồng bềnh và lắng nghe những tích truyện xứ Đà cùng Thổ địa.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg',
    guideCount: 38,
    guideAvatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Hải Châu',
  },
  {
    id: 'dest-6',
    destination: 'Phố cổ Hội An & Rừng dừa',
    headline: 'Đèn lồng sông Hoài & Chèo thúng',
    desc: 'Thả đèn hoa đăng lung linh dòng sông Hoài, ngồi thuyền thúng len lỏi giữa rừng dừa Bảy Mẫu và thưởng thức món cao lầu, bánh bao bánh vạc trứ danh.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85',
    guideCount: 45,
    guideAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    ],
    areaParam: 'Ngũ Hành Sơn',
  },
];

interface NumberedTourItem {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  desc: string;
  image: string;
  guideCount: number;
  guideAvatars: string[];
  param: string;
}

const NUMBERED_TOURS: NumberedTourItem[] = [
  {
    id: 'tour-1',
    number: 1,
    title: 'Ẩm thực Chợ Cồn & Phố đêm',
    shortTitle: 'Chợ Cồn & Ẩm thực đêm',
    desc: 'Chợ Cồn là thiên đường ẩm thực đường phố lừng danh Đà thành. Thổ địa dẫn bạn thưởng thức mì Quảng ếch, bánh xèo tôm nhảy và ốc hút cay nồng chuẩn vị bản xứ.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85',
    guideCount: 28,
    guideAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    ],
    param: 'Ẩm thực bản địa',
  },
  {
    id: 'tour-2',
    number: 2,
    title: 'Hải sản Biển Mỹ Khê & Làng chài Mân Thái',
    shortTitle: 'Hải sản Biển Mỹ Khê',
    desc: 'Đà Nẵng là thiên đường hải sản tươi sống phong vị miền Trung. Cùng thổ địa đón thuyền thúng cập bến sớm mai, thưởng thức ghẹ hấp sả, mực nướng sa tế và chip chip xào lá quế.',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
    guideCount: 18,
    guideAvatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    ],
    param: 'Ẩm thực bản địa',
  },
  {
    id: 'tour-3',
    number: 3,
    title: 'Bán đảo Sơn Trà & Đỉnh Bàn Cờ',
    shortTitle: 'Bán đảo Sơn Trà',
    desc: 'Trekking qua tán rừng nguyên sinh ngắm loài linh trưởng Voọc chà vá chân nâu quý hiếm. Dừng chân tại Đỉnh Bàn Cờ uống trà ngắm trọn toàn cảnh vịnh biển Đà Nẵng từ trên cao.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=85',
    guideCount: 22,
    guideAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    ],
    param: 'Thiên nhiên & Trekking Sơn Trà',
  },
  {
    id: 'tour-4',
    number: 4,
    title: 'Cầu Rồng, Cầu Tình Yêu & Sông Hàn về đêm',
    shortTitle: 'Cầu Rồng & Sông Hàn',
    desc: 'Thưởng ngoạn màn trình diễn Rồng phun lửa và phun nước độc đáo vào cuối tuần. Tận hưởng gió mát trên du thuyền sông Hàn và hòa mình vào nhịp sống sôi động của phố đi bộ Bạch Đằng.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Marine_da_nang.jpg/1280px-Marine_da_nang.jpg',
    guideCount: 31,
    guideAvatars: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    ],
    param: 'Khám phá Đà Nẵng về đêm',
  },
  {
    id: 'tour-5',
    number: 5,
    title: 'Làng đá Non Nước & Ngũ Hành Sơn',
    shortTitle: 'Ngũ Hành Sơn & Non Nước',
    desc: 'Chiêm ngưỡng kiệt tác điêu khắc đá mỹ nghệ Non Nước hơn 400 năm tuổi, chinh phục các ngọn Kim, Mộc, Thủy, Hỏa, Thổ và khám phá sự huyền bí trong Động Huyền Không cổ kính.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=85',
    guideCount: 25,
    guideAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    ],
    param: 'Nhiếp ảnh & Check-in',
  },
];

interface ExperienceItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  image: string;
  param: string;
  tag: string;
}

const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-1',
    title: 'Ẩm thực đêm & Chợ Cồn',
    desc: 'Mì Quảng ếch, bánh xèo tôm nhảy, hải sản Sơn Trà chuẩn vị người bản xứ.',
    icon: '🍜',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85',
    param: 'Ẩm thực bản địa',
    tag: 'Đặc sản xứ Quảng',
  },
  {
    id: 'exp-2',
    title: 'Cầu Rồng & Sông Hàn về đêm',
    desc: 'Xem Rồng phun lửa, du thuyền sông Hàn và ngắm hoàng hôn vịnh biển.',
    icon: '🐉',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Marine_da_nang.jpg/1280px-Marine_da_nang.jpg',
    param: 'Khám phá Đà Nẵng về đêm',
    tag: 'Phố đêm sông Hàn',
  },
  {
    id: 'exp-3',
    title: 'Sơn Trà & Bán đảo hoang sơ',
    desc: 'Trekking ngắm Voọc chà vá chân nâu, Đỉnh Bàn Cờ và Chùa Linh Ứng.',
    icon: '🐒',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=85',
    param: 'Thiên nhiên & Trekking Sơn Trà',
    tag: 'Rừng & Voọc chà vá',
  },
  {
    id: 'exp-4',
    title: 'Nhiếp ảnh & Check-in di sản',
    desc: 'Những góc máy tại Cầu Vàng, Làng đá Non Nước và Ngũ Hành Sơn.',
    icon: '📸',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg',
    param: 'Nhiếp ảnh & Check-in',
    tag: 'Cầu Vàng Bà Nà',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Vì sao tôi chỉ cần đặt cọc 30% khi đặt lịch Thổ địa?',
    a: 'LocalBuddy áp dụng cơ chế thanh toán hai chặng minh bạch theo chuẩn Local Buddy: Du khách chỉ cần thanh toán 30% tiền cọc sau khi Hướng dẫn viên chấp nhận yêu cầu để khóa lịch nguyên tử trong 15 phút. 70% còn lại bạn chỉ phải thanh toán sau khi chuyến đi thực tế đã hoàn thành.',
  },
  {
    q: 'Chính sách hoàn tiền cọc khi hủy lịch được quy định như thế nào?',
    a: 'Chính sách hủy đơn minh bạch theo mốc thời gian ΔT trước giờ hẹn: Nếu bạn hủy trước trên 48 giờ, hệ thống hoàn trả 100% tiền cọc; hủy từ 24 đến 48 giờ, hoàn 50% tiền cọc; hủy dưới 24 giờ phạt 100% cọc để bồi hoàn cho Hướng dẫn viên. Trường hợp Hướng dẫn viên hủy đơn, bạn luôn được hoàn 100% tiền cọc ngay lập tức.',
  },
  {
    q: 'Giá thuê trên website tính theo đầu người hay tính theo giờ?',
    a: 'Toàn bộ đơn giá trên LocalBuddy được tính THEO GIỜ của Hướng dẫn viên (từ 80.000 ₫ đến 500.000 ₫/giờ). Đơn giá áp dụng chung cho cả nhóm du khách (tối đa 20 người), hoàn toàn không thu thêm phụ phí theo đầu người.',
  },
  {
    q: 'Làm thế nào để tôi liên hệ trực tiếp với Thổ địa?',
    a: 'Sau khi Hướng dẫn viên chấp nhận yêu cầu và bạn hoàn tất đặt cọc 30%, hệ thống tự động khởi tạo Thỏa thuận dịch vụ điện tử (SERVICE_AGREEMENT) và cung cấp đầy đủ Số điện thoại & Email của Hướng dẫn viên để hai bên kết nối trực tiếp.',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { verifiedGuides, slots, reviews, getUserById, getGuideById } = useBookingContext();

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHours, setSelectedHours] = useState('3');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const availableDates = Array.from(
    new Set(slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.date))
  ).sort();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedHours) params.set('hours', selectedHours);
    navigate(`/guides?${params.toString()}`);
  };

  return (
    <div className="bg-[#FEEDDC] text-[#1C1917] space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* 1. HERO SECTION WITHLOCALS (Chuẩn mẫu media_1794289911371_f8b0b2d1.jpg) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#EAD7C2] text-[#D12B79] text-xs font-bold shadow-xs hover:bg-white/80 transition-all"
              >
                <Logo variant="icon" size="sm" />
                <span>Nền tảng đặt Thổ địa theo giờ chuẩn Local Buddy →</span>
              </Link>

              <h1 className="text-[38px] sm:text-[54px] lg:text-[62px] font-black tracking-tight leading-[1.08] text-[#1C1917]">
                Trải nghiệm đầy mê hoặc,{' '}
                <span className="block text-[#D12B79]">cùng người bản xứ tuyệt vời</span>
              </h1>

              <p className="text-[17px] sm:text-[20px] text-[#6E6259] leading-relaxed max-w-xl font-medium">
                Đặt trước những trải nghiệm độc bản tại Đà Nẵng, đồng hành theo giờ cùng Thổ địa bản địa đã xác thực KYC 100%.
              </p>
            </div>

            {/* Floating Search Pill Bar (Chuẩn thanh tìm kiếm nổi trắng của Withlocals) */}
            <form
              onSubmit={handleSearch}
              aria-label="Tìm Thổ địa bản địa Đà Nẵng"
              className="bg-white rounded-[32px] sm:rounded-full p-2.5 sm:p-2 sm:pl-6 shadow-xl border border-[#EAD7C2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
            >
              {/* Điểm đến */}
              <div className="flex-1 flex items-center gap-2.5 px-2">
                <MapPin className="w-5 h-5 text-[#D12B79] shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                    Bạn muốn đi đâu?
                  </span>
                  <select
                    id="hp-search-area"
                    aria-label="Điểm đến tại Đà Nẵng"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full text-[14px] font-bold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="">Toàn Đà Nẵng (Sơn Trà, Mỹ Khê, Cầu Rồng...)</option>
                    {DANANG_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden sm:block w-[1px] h-8 bg-[#EAD7C2]" />

              {/* Ngày đi */}
              <div className="flex items-center gap-2 px-2 sm:w-40">
                <Calendar className="w-4 h-4 text-[#78716C] shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                    Ngày khởi hành
                  </span>
                  <select
                    id="hp-search-date"
                    aria-label="Ngày khởi hành"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-[13px] font-semibold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="">Mọi ngày</option>
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d.split('-').reverse().join('/')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden sm:block w-[1px] h-8 bg-[#EAD7C2]" />

              {/* Số giờ thuê */}
              <div className="flex items-center gap-2 px-2 sm:w-28">
                <Clock className="w-4 h-4 text-[#78716C] shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                    Thời lượng
                  </span>
                  <select
                    id="hp-search-hours"
                    aria-label="Số giờ thuê"
                    value={selectedHours}
                    onChange={(e) => setSelectedHours(e.target.value)}
                    className="w-full text-[13px] font-semibold text-[#1C1917] bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="1">1 giờ</option>
                    <option value="2">2 giờ</option>
                    <option value="3">3 giờ (chuẩn)</option>
                    <option value="4">4 giờ</option>
                    <option value="6">6 giờ</option>
                    <option value="8">8 giờ</option>
                  </select>
                </div>
              </div>

              {/* Nút Tìm kiếm vàng hổ phách chuẩn Withlocals (#F2B33D) */}
              <button
                type="submit"
                className="bg-[#F2B33D] hover:bg-[#E0A22C] text-[#1C1917] font-black text-[14px] px-8 py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Tìm kiếm</span>
              </button>
            </form>

            {/* Trust rating badge */}
            <div className="flex flex-wrap items-center gap-3 text-[13px] font-semibold text-[#1C1917] pt-1">
              <span className="flex items-center gap-1">
                <span>Xuất sắc 4.8 trên 5</span>
                <span className="text-emerald-700 font-bold">★ Trustpilot</span>
              </span>
              <span className="text-[#D8C7B5]">•</span>
              <span className="text-[#6E6259]">100% Thổ địa duyệt KYC</span>
              <span className="text-[#D8C7B5]">•</span>
              <span className="text-[#6E6259]">Cọc 30% giữ chỗ</span>
            </div>
          </div>

          {/* Right Hero Mosaic Collage (Chuẩn bố cục ảnh cắt góc tròn như Withlocals) */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4">
              {/* Ảnh dọc bên trái */}
              <div className="space-y-4">
                <div className="relative rounded-[32px] overflow-hidden shadow-xl aspect-[3/4] border-2 border-white group">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=85"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  >
                    <source src="https://assets.mixkit.co/videos/5371/5371-720.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Đồng hành cùng Thổ địa
                    </span>
                    <h3 className="text-sm font-bold">Bán đảo Sơn Trà & Voọc chà vá</h3>
                  </div>
                </div>

                <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-[4/3] border-2 border-white group">
                  <img
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=85"
                    alt="Phố cổ Hội An"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-bold">
                    Đèn lồng Phố cổ Hội An
                  </div>
                </div>
              </div>

              {/* Cột ảnh bên phải */}
              <div className="space-y-4 pt-6">
                <div className="relative rounded-[28px] overflow-hidden shadow-lg aspect-[4/5] border-2 border-white group">
                  <img
                    src="https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Golden_Bridge_%28Vietnam%29.jpg/1280px-Golden_Bridge_%28Vietnam%29.jpg"
                    alt="Cầu Vàng Bà Nà"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Điểm check-in nổi tiếng
                    </span>
                    <h3 className="text-sm font-bold">Cầu Vàng Bà Nà Hills</h3>
                  </div>
                </div>

                <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-[4/3] border-2 border-white group">
                  <img
                    src="https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Da-Nang_Vietnam_Coracles-01.jpg/1280px-Da-Nang_Vietnam_Coracles-01.jpg"
                    alt="Thuyền thúng Biển Mỹ Khê"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-bold">
                    Làng chài & Biển Mỹ Khê
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel navigation pills */}
            <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold text-[#6E6259]">
              <span className="cursor-pointer hover:text-[#1C1917]">‹</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAD7C2] text-[#1C1917] shadow-xs">
                📍 Đà Nẵng, Việt Nam
              </span>
              <span className="cursor-pointer hover:text-[#1C1917]">›</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KHỐI THẺ ĐIỂM ĐẾN 'VIVEZ LOCAL DANS DES VILLES CHARMANTES' (Chuẩn 100% mẫu Withlocals media_1794289944077_b9ba7517.jpg) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] sm:text-[40px] font-black text-[#1C1917] tracking-tight">
              Trải nghiệm bản địa tại các <span className="text-[#D12B79]">Điểm đến quyến rũ</span>
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#6E6259] mt-1 font-medium">
              Tìm kiếm buổi đồng hành riêng tư với một trong những thổ địa bản xứ của chúng tôi
            </p>
          </div>
          <Link
            to="/guides"
            className="text-[14px] font-bold text-[#D12B79] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Tất cả điểm đến & Thổ địa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Lưới thẻ theo phong cách thẻ thành phố Withlocals có viền ấm rõ nét */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {DESTINATION_CARDS.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/guides?area=${encodeURIComponent(item.areaParam)}`)}
              className="bg-white rounded-[26px] overflow-hidden border border-[#EAD7C2] shadow-xs hover:shadow-xl hover:border-[#D12B79] transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Phần ảnh trên với tiêu đề QUE FAIRE À / TRẢI NGHIỆM TẠI */}
              <div className="relative h-60 sm:h-64 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.destination}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-center">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 border-b border-white/40 pb-1 mb-1">
                    BẠN MUỐN LÀM GÌ TẠI
                  </span>
                  <h3 className="text-[22px] sm:text-[24px] font-black text-white drop-shadow-sm">
                    {item.destination}
                  </h3>
                </div>
              </div>

              {/* Phần thân mô tả trên nền kem Withlocals nhẹ */}
              <div className="p-6 space-y-5 flex-1 flex flex-col justify-between bg-white">
                <p className="text-[13px] text-[#6E6259] leading-relaxed">
                  {item.desc}
                </p>

                {/* Hàng dưới: Avatar Thổ địa + Vòng tròn xanh lá + Nút hồng mận Withlocals */}
                <div className="pt-4 border-t border-[#EAD7C2] flex items-center justify-between gap-3">
                  <div className="flex items-center -space-x-2">
                    {item.guideAvatars.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Local Guide"
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                    ))}
                    <span className="w-8 h-8 rounded-full bg-[#5D8035] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                      +{item.guideCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-[#D12B79] hover:bg-[#B51E63] text-white text-[12px] font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Khám phá {item.guideCount} tour
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. KHỐI TOUR ẨM THỰC & VĂN HÓA ĐÁNH SỐ (1-5) (Chuẩn 100% ảnh mẫu Withlocals media_1794290060825_b0cb0216.jpg) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h2 className="text-[28px] sm:text-[40px] font-black text-[#1C1917] tracking-tight">
            Tour Ẩm thực & Văn hóa <span className="text-[#D12B79]">Đặc sắc</span>
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#6E6259] mt-1 font-medium">
            Hành trình vị giác và giai thoại miền Trung không thể nào quên cùng thổ địa sành ăn
          </p>
        </div>

        {/* Lưới các thẻ ẩm thực đánh số Withlocals với viền ấm #EAD7C2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {NUMBERED_TOURS.map((tour) => (
            <div
              key={tour.id}
              onClick={() => navigate(`/guides?skill=${encodeURIComponent(tour.param)}`)}
              className="bg-white rounded-[24px] overflow-hidden border border-[#EAD7C2] shadow-xs hover:shadow-xl hover:border-[#D12B79] transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Ảnh món ăn hoặc cảnh quan phía trên */}
              <div className="relative h-56 sm:h-60 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/95 text-[#1C1917] font-black text-xs border border-[#EAD7C2] shadow-xs">
                  Điểm đến #{tour.number}
                </span>
              </div>

              {/* Phần thông tin đánh số */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-[19px] sm:text-[21px] font-black text-[#1C1917] group-hover:text-[#D12B79] transition-colors">
                    {tour.number}. {tour.shortTitle}
                  </h3>
                  <p className="text-[13px] text-[#6E6259] leading-relaxed line-clamp-3">
                    {tour.desc}
                  </p>
                </div>

                {/* Hàng nút dưới cùng: Avatar stack + green circle + Magenta button */}
                <div className="pt-4 border-t border-[#EAD7C2] flex items-center justify-between gap-3">
                  <div className="flex items-center -space-x-2">
                    {tour.guideAvatars.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Local Guide"
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                    ))}
                    <span className="w-8 h-8 rounded-full bg-[#5D8035] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                      +{tour.guideCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-white hover:bg-[#FEEDDC] border border-[#D12B79] text-[#D12B79] font-bold text-[12px] shadow-xs transition-colors cursor-pointer group-hover:bg-[#D12B79] group-hover:text-white"
                  >
                    Khám phá {tour.guideCount} tour
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. QUY TRÌNH 3 BƯỚC HOẠT ĐỘNG (Thẻ trắng viền ấm #EAD7C2 trên nền sáng) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#EAD7C2] shadow-xs space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#EAD7C2] text-[11px] font-bold uppercase tracking-wider">
              Quy trình 3 bước Local Buddy
            </span>
            <h2 className="text-[26px] sm:text-[34px] font-black tracking-tight text-[#1C1917]">
              Cách LocalBuddy vận hành
            </h2>
            <p className="text-[14px] text-[#6E6259]">
              Cơ chế thanh toán hai chặng 30% / 70% bảo vệ trọn vẹn cả du khách và Thổ địa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FEEDDC]/50 rounded-[22px] p-6 space-y-3 border border-[#EAD7C2]">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#D12B79] border border-[#EAD7C2] font-black text-[20px] flex items-center justify-center shadow-xs">
                1
              </div>
              <h3 className="text-[18px] font-black text-[#1C1917]">
                Chọn Thổ địa & Khung giờ
              </h3>
              <p className="text-[13px] text-[#6E6259] leading-relaxed">
                Khám phá hồ sơ Thổ địa Đà Nẵng đã xác thực KYC 100%. Chọn ngày, khung giờ rảnh thật và gửi yêu cầu (hoàn toàn chưa tính phí).
              </p>
            </div>

            <div className="bg-[#FEEDDC]/50 rounded-[22px] p-6 space-y-3 border border-[#EAD7C2]">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#D12B79] border border-[#EAD7C2] font-black text-[20px] flex items-center justify-center shadow-xs">
                2
              </div>
              <h3 className="text-[18px] font-black text-[#1C1917]">
                Guide nhận đơn & Cọc 30%
              </h3>
              <p className="text-[13px] text-[#6E6259] leading-relaxed">
                Thổ địa phản hồi trong 24 giờ. Khi chấp nhận, hệ thống giữ chỗ 15 phút để bạn nộp cọc 30%, nhận thỏa thuận dịch vụ và số liên hệ trực tiếp.
              </p>
            </div>

            <div className="bg-[#FEEDDC]/50 rounded-[22px] p-6 space-y-3 border border-[#EAD7C2]">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#D12B79] border border-[#EAD7C2] font-black text-[20px] flex items-center justify-center shadow-xs">
                3
              </div>
              <h3 className="text-[18px] font-black text-[#1C1917]">
                Đồng hành & Tất toán 70%
              </h3>
              <p className="text-[13px] text-[#6E6259] leading-relaxed">
                Gặp gỡ tại điểm hẹn Đà Nẵng, tận hưởng chuyến đi riêng tư. Kết thúc tour, bạn thanh toán 70% còn lại qua cổng Online hoặc Tiền mặt trực tiếp.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D12B79] hover:bg-[#B51E63] text-white font-bold text-[13px] shadow-xs transition-all"
            >
              <span>Xem hướng dẫn chi tiết trang giới thiệu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. HÀNG GUIDE TIÊU BIỂU (Thẻ Guide chuẩn với viền #EAD7C2) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D12B79]">
              Thổ địa tiêu biểu
            </span>
            <h2 className="text-[24px] sm:text-[32px] font-black text-[#1C1917] tracking-tight">
              Hướng dẫn viên bản địa Đà Nẵng
            </h2>
          </div>
          <Link
            to="/guides"
            className="px-5 py-2.5 rounded-full bg-white border border-[#EAD7C2] text-[13px] font-bold text-[#1C1917] hover:bg-[#FDF6ED] shadow-xs"
          >
            Xem tất cả ({verifiedGuides.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* 6. DẢI CAM KẾT VẬN HÀNH TIÊU CHUẨN (4 trụ cột niềm tin với viền #EAD7C2) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { num: '100% KYC', label: 'CCCD & Thẻ HDV xác thực' },
            { num: 'Cọc 30%', label: 'Giữ chỗ nguyên tử 15 phút' },
            { num: 'Hoàn 100%', label: 'Hủy trước 48 giờ miễn phí' },
            { num: '0 Phí ẩn', label: 'Đơn giá theo giờ minh bạch' },
          ].map((item) => (
            <div
              key={item.num}
              className="bg-white border border-[#EAD7C2] rounded-[22px] px-5 py-5 text-center shadow-xs"
            >
              <span className="block text-[20px] font-black text-[#1C1917]">
                {item.num}
              </span>
              <span className="text-[13px] text-[#6E6259] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CHỦ ĐỀ TRẢI NGHIỆM ĐÀ NẴNG */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D12B79]">
              Trải nghiệm theo chủ đề
            </span>
            <h2 className="text-[24px] sm:text-[30px] font-black text-[#1C1917] tracking-tight">
              Khám phá Đà Nẵng theo cách của bạn
            </h2>
          </div>
          <Link
            to="/guides"
            className="text-[13px] font-bold text-[#6E6259] hover:text-[#1C1917]"
          >
            Tất cả chủ đề →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate(`/guides?skill=${encodeURIComponent(exp.param)}`)}
              className="bg-white border border-[#EAD7C2] hover:border-[#D12B79] rounded-[24px] overflow-hidden cursor-pointer transition-all hover:shadow-xl flex flex-col justify-between group shadow-xs"
            >
              {/* Ảnh thực tế địa danh Đà Nẵng */}
              <div className="relative h-44 sm:h-48 overflow-hidden bg-stone-100">
                <img
                  src={exp.image}
                  alt={exp.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[#1C1917] text-[11px] font-bold border border-[#EAD7C2] shadow-xs flex items-center gap-1.5">
                  <span>{exp.icon}</span>
                  <span>{exp.tag}</span>
                </span>
              </div>

              {/* Nội dung mô tả */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-[#1C1917] group-hover:text-[#D12B79] transition-colors leading-snug">
                    {exp.title}
                  </h3>
                  <p className="text-[13px] text-[#6E6259] mt-1.5 line-clamp-2 leading-relaxed">
                    {exp.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[12px] font-bold text-[#D12B79]">
                  <span>Khám phá ngay</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. ĐÁNH GIÁ THỰC TẾ TỪ DU KHÁCH */}
      {reviews.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D12B79]">
              Đánh giá xác thực
            </span>
            <h2 className="text-[24px] sm:text-[30px] font-black text-[#1C1917] tracking-tight">
              Cảm nhận của du khách sau chuyến đi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((rev) => {
              const tourist = getUserById(rev.touristId);
              const guide = getGuideById(rev.guideId);
              return (
                <div
                  key={rev.id}
                  className="bg-white border border-[#EAD7C2] rounded-[24px] p-6 space-y-4 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      {'★'.repeat(rev.stars)}
                    </div>
                    <p className="text-[13px] text-[#6E6259] leading-relaxed italic">
                      “{rev.comment}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EAD7C2] flex items-center justify-between text-[12px]">
                    <div>
                      <strong className="block text-[#1C1917]">{tourist?.fullName || 'Du khách'}</strong>
                      <span className="text-[#78716C]">{rev.createdAt.split('T')[0]}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FEEDDC] text-[11px] font-semibold text-[#1C1917] border border-[#EAD7C2]">
                      Thổ địa: {guide?.user.fullName || 'Đà Nẵng'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. CTA TRỞ THÀNH GUIDE (Thẻ trắng viền ấm #EAD7C2) */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#EAD7C2] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-3 max-w-xl text-center sm:text-left">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] text-[11px] font-bold border border-[#EAD7C2]">
              Dành cho Thổ địa Đà Nẵng
            </span>
            <h2 className="text-[24px] sm:text-[32px] font-black tracking-tight leading-snug text-[#1C1917]">
              Bạn là người Đà Nẵng am hiểu văn hóa và ẩm thực quê hương?
            </h2>
            <p className="text-[14px] text-[#6E6259] leading-relaxed">
              Trở thành Thổ địa LocalBuddy để kết nối du khách khắp thế giới, chủ động bật lịch rảnh theo giờ và nhận thù lao xứng đáng, minh bạch.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/dang-ky?role=guide"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#D12B79] hover:bg-[#B51E63] text-white text-[14px] font-bold shadow-md transition-all transform hover:scale-105"
            >
              <span>Đăng ký làm Thổ địa ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FAQ ACCORDION (Viền ấm #EAD7C2) */}
      <section className="max-w-[960px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-[24px] sm:text-[30px] font-black text-[#1C1917] tracking-tight">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="divide-y divide-[#EAD7C2] border border-[#EAD7C2] rounded-[24px] bg-white overflow-hidden shadow-xs">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-[15px] text-[#1C1917] gap-3 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D12B79] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-[13px] text-[#6E6259] leading-relaxed border-t border-[#FEEDDC] pt-3">
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
