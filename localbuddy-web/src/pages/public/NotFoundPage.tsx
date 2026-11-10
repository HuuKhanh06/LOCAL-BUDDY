// pages/public/NotFoundPage.tsx (Trang 404 — Đường dẫn không tồn tại)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white border border-[#F1DEC9] rounded-[24px] p-8 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] text-xs font-bold uppercase tracking-wider">
            Mã lỗi 404 • Lạc đường rồi!
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917]">
            Không tìm thấy trang bạn yêu cầu
          </h1>
          <p className="text-sm text-[#6E6259] leading-relaxed">
            Đường dẫn này không tồn tại hoặc đã được di chuyển. Hãy để các Thổ địa bản xứ Đà Nẵng đưa bạn quay lại lộ trình chính nhé!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            icon={<Search className="w-4 h-4" />}
            onClick={() => navigate('/guides')}
          >
            Tìm Hướng dẫn viên Đà Nẵng
          </Button>
          <Button variant="secondary" icon={<Home className="w-4 h-4" />} onClick={() => navigate('/')}>
            Quay về Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};
