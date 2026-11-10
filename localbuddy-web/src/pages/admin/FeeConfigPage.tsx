// pages/admin/FeeConfigPage.tsx (UC.29: Cấu hình Phí sàn & BR-13)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState } from 'react';
import {
  Percent,
  CheckCircle2,
  History,
  Info,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDateTimeVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const FeeConfigPage: React.FC = () => {
  const {
    feeRate,
    feeHistory,
    updateFeeRate,
    getUserById,
    cancellations,
    disputes,
    withdrawals,
    kycRecords,
  } = useBookingContext();
  const { showToast } = useToast();

  const [percentValue, setPercentValue] = useState<number>(Math.round(feeRate * 100));
  const [effectiveNote, setEffectiveNote] = useState(
    'Điều chỉnh tỷ lệ phí dịch vụ nền tảng áp dụng cho các đơn đặt lịch mới tại Đà Nẵng.'
  );
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (percentValue < 10 || percentValue > 15) {
      setError('Theo quy tắc nghiệp vụ BR-13, tỷ lệ phí sàn bắt buộc nằm trong khoảng từ 10% đến 15%.');
      return;
    }

    const res = updateFeeRate(percentValue / 100, effectiveNote.trim());
    if (res.ok) {
      showToast(res.message, 'success');
    } else {
      setError(res.message);
      showToast(res.message, 'error');
    }
  };

  // Sample calculation for 1.000.000 VND booking
  const sampleG = 1000000;
  const sampleD = 300000;
  const sampleF = Math.round(sampleG * (percentValue / 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#347CCB] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full mb-2">
            <Percent className="w-3.5 h-3.5" /> Cấu hình Tham số Tài chính • UC.29 & BR-13
          </span>
          <h1 className="text-2xl font-extrabold text-[#1C1917]">
            Cấu hình Tỷ lệ Phí dịch vụ Nền tảng (10% – 15%)
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Thiết lập mức phí hoa hồng nền tảng (`Fee_Rate`). Mức phí mới chỉ áp dụng cho đơn tạo mới, các đơn cũ giữ nguyên `feeRate` đã snapshot khi đặt lịch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between bg-[#272A2D] text-white p-5 rounded-xl">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#E6E4DC]/75 font-semibold">
                Tỷ lệ phí dịch vụ hiện hành (`Fee_Rate`)
              </div>
              <div className="text-3xl font-extrabold text-[#EB5B38] mt-1">
                {Math.round(feeRate * 100)}% / đơn hoàn thành
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-white/10 text-[#E6E4DC] text-xs font-bold">
                Khung chuẩn BR-13: 10% – 15%
              </span>
            </div>
          </div>

          {/* Quick Select Buttons 10%..15% */}
          <div className="space-y-2.5">
            <label className="block text-sm font-extrabold text-[#1C1917]">
              Chọn mức phí dịch vụ nền tảng mới (Từ 10% đến 15%) *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[10, 11, 12, 13, 14, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setPercentValue(pct);
                    setError('');
                  }}
                  className={`py-3 rounded-xl font-extrabold text-base transition-all cursor-pointer border-2 ${
                    percentValue === pct
                      ? 'bg-[#EB5B38] text-white border-[#EB5B38] shadow-sm'
                      : 'bg-white text-[#1C1917] border-[#E7E5E4] hover:bg-[#F3F1EC]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
              Lý do điều chỉnh / Ghi chú nghị quyết vận hành *
            </label>
            <textarea
              rows={3}
              value={effectiveNote}
              onChange={(e) => setEffectiveNote(e.target.value)}
              placeholder="Nhập ghi chú lý do thay đổi tỷ lệ phí dịch vụ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#347CCB]"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-xl p-4 text-xs text-[#78716C] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#347CCB] shrink-0 mt-0.5" />
            <span>
              <strong>Bảo toàn dữ liệu lịch sử (`tyLePhiSanSnapshot`):</strong> Mọi đơn đặt lịch đã khởi tạo trước thời điểm cập nhật sẽ tiếp tục được quyết toán theo tỷ lệ phí đã lưu cứng trên đơn đó.
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Lưu cấu hình Phí nền tảng ({percentValue}%)
            </Button>
          </div>
        </form>

        {/* Preview Impact Card */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
            <Calculator className="w-5 h-5 text-[#347CCB]" />
            <h2 className="text-base font-extrabold text-[#1C1917]">
              Mô phỏng tác động với mức phí {percentValue}%
            </h2>
          </div>

          <p className="text-xs text-[#78716C]">
            Ví dụ đơn đặt lịch 4 giờ tại Đà Nẵng có tổng giá trị <strong>G = 1.000.000 ₫</strong> (Cọc 30%{' '}
            <strong>D = 300.000 ₫</strong>):
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F3F1EC] space-y-1.5">
              <div className="font-bold text-[#1C1917]">Phí nền tảng thu về (F):</div>
              <div className="text-lg font-extrabold text-[#347CCB]">
                {formatMoney(sampleF)} ({percentValue}% × G)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-700">
                Nếu khách trả 70% cuối ONLINE (UC.20):
              </div>
              <div className="text-[#1C1917]">
                Cộng vào Ví HDV <strong>+(G - F)</strong>:{' '}
                <strong className="text-sm">{formatMoney(sampleG - sampleF)}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <div className="font-bold text-[#347CCB]">
                Nếu khách trả 70% cuối TIỀN MẶT (UC.21):
              </div>
              <div className="text-[#1C1917]">
                HDV cầm 700.000 ₫ tiền mặt + Cộng thêm vào Ví HDV <strong>+(D - F)</strong>:{' '}
                <strong className="text-sm">{formatMoney(sampleD - sampleF)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#1C1917] flex items-center gap-2">
          <History className="w-5 h-5 text-[#1C1917]" /> Lịch sử điều chỉnh Tỷ lệ Phí dịch vụ (`PLATFORM_FEE_CONFIG`)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                <th className="py-3 px-4">Mã phiên bản</th>
                <th className="py-3 px-4">Tỷ lệ phí</th>
                <th className="py-3 px-4">Ghi chú áp dụng</th>
                <th className="py-3 px-4">Người cập nhật</th>
                <th className="py-3 px-4">Thời gian hiệu lực</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] text-sm">
              {feeHistory.map((item) => {
                const admin = getUserById(item.updatedByAdminId);
                return (
                  <tr key={item.id} className="hover:bg-[#F3F1EC]/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1C1917]">{item.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-[#347CCB] border border-sky-200">
                        {Math.round(item.feeRate * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#1C1917]">{item.effectiveNote}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#78716C]">
                      {admin?.fullName || item.updatedByAdminId}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#78716C]">
                      {formatDateTimeVN(item.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bảng Quy tắc Đặt cọc & Chính sách Hủy/Hoàn cọc theo ΔT (BR-05, BR-06, BR-09) */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#1C1917]">
          Chính sách Đặt cọc, Giữ khung giờ & Bậc Phạt/Hoàn theo ΔT (BR-05, BR-06)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#F3F1EC] border border-[#E7E5E4] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#78716C] block">
              Tỷ lệ Đặt cọc & Tất toán
            </span>
            <strong className="text-base text-[#1C1917] block">30% Cọc • 70% Sau tour</strong>
            <p className="text-[#78716C]">Giữ khung giờ nguyên tử (HOLD) đúng 15 phút khi thanh toán cọc.</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="font-bold uppercase tracking-wider text-emerald-700 block">
              Bậc 1: ΔT &gt; 48 giờ
            </span>
            <strong className="text-base text-emerald-700 block">Phạt 0% • Hoàn 100% cọc</strong>
            <p className="text-[#1C1917]">Hủy sớm trước hơn 48 giờ so với giờ hẹn khởi hành.</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <span className="font-bold uppercase tracking-wider text-amber-700 block">
              Bậc 2: 24h ≤ ΔT ≤ 48h
            </span>
            <strong className="text-base text-amber-700 block">Phạt 50% • Hoàn 50% cọc</strong>
            <p className="text-[#1C1917]">Phần phạt 50% khấu trừ phí sàn rồi cộng bồi thường ví HDV.</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <span className="font-bold uppercase tracking-wider text-rose-700 block">
              Bậc 3: ΔT &lt; 24 giờ
            </span>
            <strong className="text-base text-rose-700 block">Phạt 100% • Hoàn 0% cọc</strong>
            <p className="text-[#1C1917]">Nếu lỗi hủy từ phía HDV: Khách luôn được hoàn 100% cọc + HDV bị +1 vi phạm.</p>
          </div>
        </div>
      </div>

      {/* Nhật ký hoạt động quản trị & kiểm toán hệ thống (System Activity Audit Log) */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-extrabold text-[#1C1917]">
            Nhật ký Hoạt động & Truy vết Hệ thống (Audit Log)
          </h2>
          <span className="text-xs font-bold text-[#347CCB] bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
            Tự động ghi nhận mọi thay đổi trạng thái nhạy cảm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Chi tiết sự kiện kiểm toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] text-xs">
              {[
                ...feeHistory.map((f) => ({
                  id: `audit-fee-${f.id}`,
                  time: f.updatedAt,
                  category: 'CẤU HÌNH PHÍ',
                  ref: f.id,
                  detail: `Cập nhật tỷ lệ phí nền tảng thành ${Math.round(f.feeRate * 100)}% — ${f.effectiveNote}`,
                })),
                ...kycRecords
                  .filter((k) => k.reviewedAt)
                  .map((k) => ({
                    id: `audit-kyc-${k.id}`,
                    time: k.reviewedAt || k.submittedAt,
                    category: 'THẨM ĐỊNH KYC',
                    ref: k.id,
                    detail: `Hồ sơ KYC của ${getUserById(k.guideId)?.fullName || k.guideId}: ${k.status} (${k.reviewNote || 'Đã duyệt'})`,
                  })),
                ...disputes
                  .filter((d) => d.resolvedAt)
                  .map((d) => ({
                    id: `audit-dsp-${d.id}`,
                    time: d.resolvedAt || d.createdAt,
                    category: 'PHÁN QUYẾT TRANH CHẤP',
                    ref: d.bookingId,
                    detail: `Xử lý khiếu nại ${d.id} (${d.decision || 'RESOLVED'}): ${d.resolutionNote || d.reasonCategory}`,
                  })),
                ...withdrawals
                  .filter((w) => w.processedAt)
                  .map((w) => ({
                    id: `audit-wd-${w.id}`,
                    time: w.processedAt || w.createdAt,
                    category: 'DUYỆT RÚT TIỀN',
                    ref: w.id,
                    detail: `Lệnh rút ${formatMoney(w.amount)} của ${getUserById(w.guideId)?.fullName || w.guideId}: ${w.status} (${w.transactionRef || w.adminNote || ''})`,
                  })),
                ...cancellations.slice(0, 6).map((c) => ({
                  id: `audit-can-${c.id}`,
                  time: c.cancelledAt,
                  category: 'HỦY & HOÀN CỌC',
                  ref: c.bookingId,
                  detail: `${c.cancellationType} (ΔT=${c.deltaHours}h, phạt ${Math.round(c.penaltyRate * 100)}%, hoàn khách ${formatMoney(c.refundToTourist)})`,
                })),
              ]
                .sort((a, b) => b.time.localeCompare(a.time))
                .slice(0, 12)
                .map((log) => (
                  <tr key={log.id} className="hover:bg-[#F3F1EC]/50">
                    <td className="py-3 px-4 font-mono text-[#78716C] whitespace-nowrap">
                      {formatDateTimeVN(log.time)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#272A2D] text-[#E6E4DC] font-bold text-[10px]">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1C1917]">{log.ref}</td>
                    <td className="py-3 px-4 text-[#1C1917]">{log.detail}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
