// components/common/PaymentSummary.tsx
// Bảng chi tiết tài chính minh bạch theo từng vai trò (BR-03, BR-13)
// Quy tắc bất biến: Du khách KHÔNG BAO GIỜ nhìn thấy Phí hoa hồng nền tảng (Fee_Rate).

import React from 'react';
import { formatMoney, formatHourlyRate } from '../../utils/money';

interface PaymentSummaryProps {
  hourlyRate?: number;
  hours?: number;
  total: number;         // G = Hourly_Rate * Hours
  deposit: number;       // D = 30% G
  remaining: number;     // B = 70% G
  feeRate?: number;      // Tỷ lệ phí sàn snapshot
  platformFee?: number;  // F = G * Fee_Rate (Chỉ hiển thị cho Guide & Admin)
  guideReceives?: number;// G - F (Khi khách trả Online 70%)
  paymentMethod?: 'ONLINE' | 'CASH';
  mode: 'tourist' | 'guide' | 'admin';
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  hourlyRate,
  hours,
  total,
  deposit,
  remaining,
  feeRate,
  platformFee,
  guideReceives,
  paymentMethod,
  mode,
}) => {
  const computedFee =
    platformFee !== undefined
      ? platformFee
      : feeRate !== undefined
      ? Math.round(total * feeRate)
      : undefined;
  const computedGuideOnline =
    guideReceives !== undefined
      ? guideReceives
      : computedFee !== undefined
      ? total - computedFee
      : undefined;
  const computedGuideCashDelta =
    computedFee !== undefined ? deposit - computedFee : undefined;

  return (
    <div className="bg-[#FBF4F6] border border-[#E4C3CC] rounded-[12px] p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#E4C3CC] pb-2.5">
        <h4 className="text-[15px] font-bold text-[#1A0A0F]">
          Chi tiết thanh toán & Đặt cọc (BR-03)
        </h4>
        {hourlyRate && hours && (
          <span className="text-[12px] font-semibold text-[#52526B]">
            {formatHourlyRate(hourlyRate)} × {hours} giờ
          </span>
        )}
      </div>

      <div className="flex justify-between text-[14px]">
        <span className="text-[#52526B]">Tổng giá trị dịch vụ (G = 100%):</span>
        <span className="font-extrabold tabular-nums text-[#1A0A0F]">
          {formatMoney(total)}
        </span>
      </div>

      <div className="flex justify-between text-[14px] bg-white p-2.5 rounded-[10px] border border-[#1EC1CB]/60">
        <div>
          <span className="font-bold text-[#1C1C28]">1. Đặt cọc giữ lịch 30% (D):</span>
          <p className="text-[11px] text-[#52526B]">
            Thanh toán Online trong 15 phút sau khi HDV chấp nhận
          </p>
        </div>
        <span className="font-extrabold tabular-nums text-[#1A0A0F] self-center">
          {formatMoney(deposit)}
        </span>
      </div>

      <div className="flex justify-between text-[14px] bg-white p-2.5 rounded-[10px] border border-[#E4C3CC]">
        <div>
          <span className="font-bold text-[#1C1C28]">2. Tất toán 70% còn lại (B):</span>
          <p className="text-[11px] text-[#52526B]">
            Thanh toán sau khi kết thúc tour (Online hoặc Tiền mặt)
          </p>
        </div>
        <span className="font-bold tabular-nums text-[#1C1C28] self-center">
          {formatMoney(remaining)}
        </span>
      </div>

      {/* Chỉ HDV và Admin mới nhìn thấy Phí hoa hồng nền tảng và Công thức quyết toán Ví (BR-13) */}
      {mode !== 'tourist' && computedFee !== undefined && (
        <div className="border-t border-[#E4C3CC] pt-3 mt-2 space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#1A0A0F]">
            Đối soát doanh thu Hướng dẫn viên (BR-13)
          </p>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#52526B]">
              Phí hoa hồng nền tảng ({feeRate ? `${(feeRate * 100).toFixed(0)}%` : 'Snapshot'} trên tổng G):
            </span>
            <span className="text-[#A61B2B] tabular-nums font-bold">
              −{formatMoney(computedFee)}
            </span>
          </div>

          {computedGuideOnline !== undefined && (
            <div className="flex justify-between text-[13px] font-bold text-[#0F6E4B]">
              <span>Tổng thu nhập thực nhận của HDV (G − F):</span>
              <span className="tabular-nums">{formatMoney(computedGuideOnline)}</span>
            </div>
          )}

          {computedGuideCashDelta !== undefined && (
            <div className="text-[12px] bg-[#F6E6EA]/70 p-2.5 rounded-[8px] text-[#1C1C28] space-y-1">
              <div>
                • <strong>Nếu khách trả 70% Online:</strong> Ví HDV cộng{' '}
                <strong className="text-[#0F6E4B]">+{formatMoney(computedGuideOnline || 0)}</strong>
              </div>
              <div>
                • <strong>Nếu khách trả 70% Tiền mặt ({formatMoney(remaining)}):</strong> HDV đã cầm trực tiếp 70%, sàn khấu trừ phí vào cọc 30% và cộng phần dư{' '}
                <strong className="text-[#0F6E4B]">
                  (D − F) = +{formatMoney(computedGuideCashDelta)}
                </strong>{' '}
                vào ví HDV.
              </div>
              {paymentMethod && (
                <div className="pt-1 font-semibold text-[#1A0A0F]">
                  → Phương thức khách chọn: {paymentMethod === 'ONLINE' ? 'Thanh toán Online' : 'Tiền mặt trực tiếp'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
