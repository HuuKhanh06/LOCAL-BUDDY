// pages/public/HowItWorksPage.tsx
// Trang Giới thiệu & Mô hình hoạt động LocalBuddy chuẩn phong cách Withlocals (https://www.withlocals.com/fr/)
// Màu nền kem ấm Withlocals: #FEEDDC, Điểm nhấn mận Withlocals: #D12B79, Thẻ trắng #FFFFFF, Viền ấm rõ nét #EAD7C2

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const HowItWorksPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Tại sao LocalBuddy chỉ thu cọc 30% thay vì thu toàn bộ 100%?',
      a: 'Theo chuẩn bảo vệ quyền lợi du khách của Local Buddy, LocalBuddy áp dụng cơ chế thanh toán hai chặng: Bạn chỉ cần đặt cọc 30% để Hướng dẫn viên khóa lịch (giữ chỗ nguyên tử trong 15 phút). 70% còn lại bạn chỉ thanh toán sau khi chuyến đi đã hoàn thành và bạn hài lòng với dịch vụ.',
    },
    {
      q: 'Hướng dẫn viên trên LocalBuddy có được kiểm duyệt chất lượng không?',
      a: '100% Thổ địa (Local Guide) bắt buộc nộp Căn cước công dân gắn chip hoặc Thẻ HDV/Chứng chỉ ngoại ngữ để Ban Quản trị thẩm định định danh KYC trước khi được duyệt hiển thị và nhận khách.',
    },
    {
      q: 'Chính sách hoàn cọc khi tôi có việc bận cần hủy chuyến đi ra sao?',
      a: 'Chính sách minh bạch theo mốc thời gian ΔT: Hủy trước trên 48 giờ so với giờ hẹn: hoàn 100% tiền cọc; Hủy từ 24 đến 48 giờ: hoàn 50% tiền cọc; Hủy dưới 24 giờ: phạt 100% cọc để bồi hoàn công chuẩn bị của HDV. Nếu HDV hủy, bạn luôn nhận lại 100% cọc ngay lập tức.',
    },
    {
      q: 'Giá thuê trên website áp dụng cho cả nhóm hay tính theo từng người?',
      a: 'Giá thuê trên LocalBuddy được tính THEO GIỜ của Hướng dẫn viên (từ 80.000 ₫ đến 500.000 ₫/giờ). Đơn giá áp dụng cho toàn bộ nhóm du khách của bạn (tối đa 20 người theo phạm vi tour), không thu thêm bất kỳ phụ phí theo đầu người.',
    },
    {
      q: 'Làm thế nào để hai bên gặp nhau tại Đà Nẵng?',
      a: 'Khi đặt lịch, bạn chọn địa điểm hẹn đón tại Đà Nẵng (Khách sạn, Sân bay, Cầu Rồng, quán cà phê...). Ngay sau khi cọc 30%, Thỏa thuận dịch vụ điện tử hiển thị Số điện thoại và Email của hai bên để kết nối trực tiếp.',
    },
  ];

  return (
    <div className="bg-[#FEEDDC] min-h-screen text-[#1C1917] py-6 sm:py-10 space-y-16 sm:space-y-24">
      {/* 1. HERO BANNER WITHLOCALS STYLE */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#EAD7C2] text-[#D12B79] text-xs font-bold shadow-xs">
              <Logo variant="icon" size="sm" />
              <span>Mô hình đặt Thổ địa theo giờ chuẩn Local Buddy</span>
            </div>

            <h1 className="text-[36px] sm:text-[52px] font-black tracking-tight leading-[1.1] text-[#1C1917]">
              Khám phá Đà Nẵng chân thực cùng{' '}
              <span className="text-[#D12B79]">người bản xứ</span>
            </h1>

            <p className="text-[16px] sm:text-[18px] text-[#6E6259] leading-relaxed max-w-xl">
              Không còn những tour đoàn đông đúc và lịch trình cứng nhắc. Cùng Thổ địa bản địa dạo bước
              qua những ngõ ẩm thực Chợ Cồn, đón bình minh Sơn Trà và cảm nhận Đà Nẵng theo cách riêng của bạn.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/guides"
                className="px-7 py-3.5 rounded-full bg-[#D12B79] hover:bg-[#B51E63] text-white font-extrabold text-[15px] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
              >
                <span>Tìm Thổ địa Đà Nẵng ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/become-a-guide"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-white/80 border border-[#EAD7C2] text-[#1C1917] font-bold text-[14px] transition-all"
              >
                Trở thành Hướng dẫn viên
              </Link>
            </div>

            {/* Micro Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#EAD7C2] text-xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-sm text-[#1C1917]">100% Linh hoạt</div>
                <div className="text-[#78716C]">Lịch trình theo giờ bạn chọn</div>
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-sm text-[#1C1917]">Cọc 30% giữ chỗ</div>
                <div className="text-[#78716C]">70% còn lại trả sau tour</div>
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-sm text-[#1C1917]">Đã duyệt KYC</div>
                <div className="text-[#78716C]">Thẩm định CCCD & Thẻ HDV</div>
              </div>
            </div>
          </div>

          {/* Hero Video Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[28px] overflow-hidden shadow-xl border-4 border-white aspect-[4/5] bg-black">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=85"
                className="w-full h-full object-cover"
              >
                <source src="https://assets.mixkit.co/videos/5371/5371-720.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold inline-block border border-white/30">
                  📍 Bán đảo Sơn Trà, Đà Nẵng
                </span>
                <h2 className="text-xl font-black">Thiên nhiên hoang sơ & Voọc chà vá</h2>
                <p className="text-xs text-white/80">Khám phá cùng Thổ địa am hiểu từng cung đường ven biển.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE (CÁCH THỨC HOẠT ĐỘNG 3 BƯỚC) */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-8 sm:p-14 border border-[#EAD7C2] shadow-sm space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] text-xs font-bold uppercase tracking-wider">
              Quy trình trải nghiệm 3 bước
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-black text-[#1C1917] tracking-tight">
              Cách thức hoạt động tại LocalBuddy
            </h2>
            <p className="text-sm text-[#78716C]">
              Đơn giản, minh bạch và đặt quyền lợi an toàn của bạn lên hàng đầu ở từng bước hành trình.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-[#FEEDDC] text-[#D12B79] font-black text-2xl flex items-center justify-center border border-[#EAD7C2]">
                1
              </div>
              <h3 className="text-xl font-black text-[#1C1917]">
                Chọn Thổ địa & Khung giờ
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Lọc danh sách theo ngôn ngữ (Việt, Anh, Hàn, Nhật, Pháp), sở thích (ẩm thực đường phố, chụp ảnh check-in, thiên nhiên Sơn Trà) và mức giá từ 80k/giờ.
              </p>
              <div className="text-xs font-bold text-[#D12B79] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Chỉ hiện HDV đã được duyệt KYC 100%
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-[#FEEDDC] text-[#D12B79] font-black text-2xl flex items-center justify-center border border-[#EAD7C2]">
                2
              </div>
              <h3 className="text-xl font-black text-[#1C1917]">
                Guide đồng ý & Cọc 30%
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Gửi yêu cầu chuyến đi. Guide có 24h để phản hồi. Khi Guide bấm đồng ý, bạn thanh toán cọc 30% trong 15 phút để chính thức chốt lịch (HOLD sang BUSY).
              </p>
              <div className="text-xs font-bold text-[#D12B79] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Thỏa thuận dịch vụ điện tử tự động
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-[#FEEDDC] text-[#D12B79] font-black text-2xl flex items-center justify-center border border-[#EAD7C2]">
                3
              </div>
              <h3 className="text-xl font-black text-[#1C1917]">
                Trải nghiệm & Trả 70% sau
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Gặp Thổ địa tại điểm hẹn, tận hưởng chuyến đi. Chỉ sau khi kết thúc tour, bạn mới thanh toán 70% còn lại qua Online hoặc Tiền mặt trực tiếp.
              </p>
              <div className="text-xs font-bold text-[#D12B79] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Cửa sổ 24h khiếu nại bảo vệ du khách
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRIẾT LÝ WITHLOCALS: POURQUOI VOYAGER AVEC UN LOCAL GUIDE? */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-white border border-[#EAD7C2] text-[#D12B79] text-xs font-bold uppercase tracking-wider">
            Giá trị khác biệt
          </span>
          <h2 className="text-[28px] sm:text-[40px] font-black text-[#1C1917] tracking-tight">
            Tại sao nên đồng hành cùng Thổ địa bản xứ?
          </h2>
          <p className="text-sm text-[#78716C]">
            Khám phá Đà Nẵng qua lăng kính của những người sinh ra và lớn lên tại mảnh đất này.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-[#EAD7C2] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl border border-amber-200">
              🎯
            </div>
            <h3 className="font-extrabold text-base text-[#1C1917]">100% Cá nhân hóa</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Bạn muốn nán lại ngắm hoàng hôn lâu hơn? Thích thử món ăn vặt bí truyền? Chuyến đi hoàn toàn xoay quanh sở thích của bạn.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#EAD7C2] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-2xl border border-rose-200">
              🛡️
            </div>
            <h3 className="font-extrabold text-base text-[#1C1917]">Bảo vệ quyền lợi</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Cọc 30% được giữ an toàn trên hệ thống. Chính sách hủy minh bạch theo ΔT: hoàn đến 100% khi hủy trước 48 giờ.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#EAD7C2] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl border border-emerald-200">
              🌱
            </div>
            <h3 className="font-extrabold text-base text-[#1C1917]">Du lịch bền vững</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Khoản chi trả của bạn đến trực tiếp với Hướng dẫn viên và các quán ăn gia đình địa phương, lan tỏa giá trị cộng đồng.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#EAD7C2] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center text-2xl border border-sky-200">
              🤝
            </div>
            <h3 className="font-extrabold text-base text-[#1C1917]">Kết nối chân thành</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Không chỉ là hướng dẫn viên du lịch, Thổ địa là người bạn đồng hành tin cậy, kể cho bạn những câu chuyện không có trong sách vở.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE ĐỊA DANH ĐÀ NẴNG (ẢNH & VIDEO THỰC TẾ) */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="px-3.5 py-1 rounded-full bg-white border border-[#EAD7C2] text-[#D12B79] text-xs font-bold uppercase tracking-wider">
              Khám phá Đà Nẵng
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-black text-[#1C1917] tracking-tight mt-2">
              Những trải nghiệm không thể bỏ lỡ
            </h2>
          </div>
          <Link
            to="/guides"
            className="text-[14px] font-bold text-[#D12B79] hover:underline inline-flex items-center gap-1"
          >
            <span>Xem tất cả điểm đến & Thổ địa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Sơn Trà */}
          <div className="bg-white rounded-[24px] overflow-hidden border border-[#EAD7C2] shadow-xs group">
            <div className="relative h-56 overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
                <source src="https://assets.mixkit.co/videos/5371/5371-720.mp4" type="video/mp4" />
              </video>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                Bán đảo Sơn Trà
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-extrabold text-base text-[#1C1917]">
                Trekking Sơn Trà & Ngắm Voọc chà vá
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Đỉnh Bàn Cờ, Chùa Linh Ứng và cung đường rừng nguyên sinh ôm trọn biển Đông.
              </p>
            </div>
          </div>

          {/* Card 2: Biển Mỹ Khê */}
          <div className="bg-white rounded-[24px] overflow-hidden border border-[#EAD7C2] shadow-xs group">
            <div className="relative h-56 overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
                <source src="https://assets.mixkit.co/videos/51500/51500-720.mp4" type="video/mp4" />
              </video>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                Bãi biển Mỹ Khê
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-extrabold text-base text-[#1C1917]">
                Bình minh Làng chài Mân Thái & Biển sớm
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Cùng ngư dân kéo lưới thúng chai, thưởng thức hải sản tươi rói ngay bên bãi cát.
              </p>
            </div>
          </div>

          {/* Card 3: Cầu Rồng & Sông Hàn */}
          <div className="bg-white rounded-[24px] overflow-hidden border border-[#EAD7C2] shadow-xs group">
            <div className="relative h-56 overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
                <source src="https://assets.mixkit.co/videos/5363/5363-720.mp4" type="video/mp4" />
              </video>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                Cầu Rồng & Sông Hàn
              </div>
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-extrabold text-base text-[#1C1917]">
                Đà Nẵng về đêm: Cầu Rồng & Ẩm thực Chợ Cồn
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Xem rồng phun lửa cuối tuần, dạo chợ đêm ẩm thực thưởng thức mì Quảng, bánh xèo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. KHỐI AN TOÀN & BẢO ĐẢM MINH BẠCH (GARANTIE & CONFIANCE) - SÁNG ẤM WITHLOCALS */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="bg-white text-[#1C1917] rounded-[32px] p-8 sm:p-14 border border-[#EAD7C2] shadow-xs space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#EAD7C2] text-xs font-bold uppercase tracking-wider">
              An tâm tuyệt đối
            </span>
            <h2 className="text-[28px] sm:text-[38px] font-black tracking-tight text-[#1C1917]">
              Cam kết dịch vụ & Bảo vệ du khách 100%
            </h2>
            <p className="text-sm text-[#6E6259]">
              Mọi chuyến đi trên LocalBuddy đều được bảo chứng bởi công nghệ đối soát và hợp đồng dịch vụ rõ ràng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#EAD7C2]">
            <div className="space-y-2 bg-[#FEEDDC]/40 p-6 rounded-2xl border border-[#EAD7C2]">
              <div className="text-2xl font-black text-[#D12B79]">30% / 70%</div>
              <h3 className="font-bold text-base text-[#1C1917]">Thanh toán hai chặng</h3>
              <p className="text-xs text-[#6E6259] leading-relaxed">
                Chỉ thanh toán cọc 30% sau khi Guide đồng ý. 70% còn lại chỉ thanh toán sau khi chuyến đi đã hoàn tất.
              </p>
            </div>

            <div className="space-y-2 bg-[#FEEDDC]/40 p-6 rounded-2xl border border-[#EAD7C2]">
              <div className="text-2xl font-black text-emerald-700">Hoàn 100%</div>
              <h3 className="font-bold text-base text-[#1C1917]">Chính sách hủy linh hoạt</h3>
              <p className="text-xs text-[#6E6259] leading-relaxed">
                Hủy trước trên 48 giờ: nhận lại 100% tiền cọc. HDV hủy: hoàn 100% ngay lập tức và ghi nhận kỷ luật hệ thống.
              </p>
            </div>

            <div className="space-y-2 bg-[#FEEDDC]/40 p-6 rounded-2xl border border-[#EAD7C2]">
              <div className="text-2xl font-black text-[#285B9A]">24/7</div>
              <h3 className="font-bold text-base text-[#1C1917]">Phân xử tranh chấp công minh</h3>
              <p className="text-xs text-[#6E6259] leading-relaxed">
                Cửa sổ khiếu nại 24h sau tour. Đội ngũ Quản trị viên thẩm định bằng chứng và giải quyết bảo vệ du khách.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="max-w-[960px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-white border border-[#EAD7C2] text-[#D12B79] text-xs font-bold uppercase tracking-wider">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-[28px] sm:text-[36px] font-black text-[#1C1917]">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#EAD7C2] overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-[15px] text-[#1C1917] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D12B79] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#78716C] leading-relaxed border-t border-[#FEEDDC] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CTA CUỐI: TRỞ THÀNH GUIDE LOCALBUDDY */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-[#EAD7C2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917]">
              Bạn là người con Đà Nẵng đam mê chia sẻ văn hóa?
            </h2>
            <p className="text-sm text-[#78716C] max-w-xl">
              Gia nhập đội ngũ Local Guide, tự do đặt giá theo giờ (80k – 500k/h), làm chủ thời gian và lan tỏa vẻ đẹp Đà Nẵng đến du khách khắp bốn phương.
            </p>
          </div>
          <Link
            to="/become-a-guide"
            className="px-7 py-3.5 rounded-full bg-[#D12B79] hover:bg-[#B51E63] text-white font-extrabold text-[15px] shadow-sm transition-all shrink-0"
          >
            Đăng ký làm Thổ địa ngay
          </Link>
        </div>
      </section>
    </div>
  );
};
