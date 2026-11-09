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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#118B93] bg-[#E6F9FA] px-3 py-1 rounded-full mb-2">
            <Percent className="w-3.5 h-3.5" /> Cấu hình Tham số Tài chính • UC.29 & BR-13
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Cấu hình Tỷ lệ Phí dịch vụ Nền tảng (10% – 15%)
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Thiết lập mức phí hoa hồng nền tảng (`Fee_Rate`). Mức phí mới chỉ áp dụng cho đơn tạo mới, các đơn cũ giữ nguyên `feeRate` đã snapshot khi đặt lịch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-2 bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between bg-[#1C1C28] text-white p-5 rounded-[12px]">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#F6E6EA]/75 font-semibold">
                Tỷ lệ phí dịch vụ hiện hành (`Fee_Rate`)
              </div>
              <div className="text-3xl font-extrabold text-[#1EC1CB] mt-1">
                {Math.round(feeRate * 100)}% / đơn hoàn thành
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-[#1EC1CB]/20 text-[#1EC1CB] text-xs font-bold">
                Khung chuẩn BR-13: 10% – 15%
              </span>
            </div>
          </div>

          {/* Quick Select Buttons 10%..15% */}
          <div className="space-y-2.5">
            <label className="block text-sm font-extrabold text-[#1A0A0F]">
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
                  className={`py-3 rounded-[10px] font-extrabold text-base transition-all cursor-pointer border-2 ${
                    percentValue === pct
                      ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1EC1CB] shadow-sm'
                      : 'bg-white text-[#1C1C28] border-[#E8CED5] hover:bg-[#F6E6EA]/50'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-[#1C1C28] mb-1.5">
              Lý do điều chỉnh / Ghi chú nghị quyết vận hành *
            </label>
            <textarea
              rows={3}
              value={effectiveNote}
              onChange={(e) => setEffectiveNote(e.target.value)}
              placeholder="Nhập ghi chú lý do thay đổi tỷ lệ phí dịch vụ..."
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#D4C0C6] text-sm text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1EC1CB]"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-semibold text-[#A62626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="bg-[#FDF7F9] border border-[#E8CED5] rounded-[10px] p-4 text-xs text-[#525266] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#118B93] shrink-0 mt-0.5" />
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
        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8CED5] pb-3">
            <Calculator className="w-5 h-5 text-[#118B93]" />
            <h2 className="text-base font-extrabold text-[#1A0A0F]">
              Mô phỏng tác động với mức phí {percentValue}%
            </h2>
          </div>

          <p className="text-xs text-[#525266]">
            Ví dụ đơn đặt lịch 4 giờ tại Đà Nẵng có tổng giá trị <strong>G = 1.000.000 ₫</strong> (Cọc 30%{' '}
            <strong>D = 300.000 ₫</strong>):
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-[10px] bg-[#F4F5F8] space-y-1.5">
              <div className="font-bold text-[#1A0A0F]">Phí nền tảng thu về (F):</div>
              <div className="text-lg font-extrabold text-[#118B93]">
                {formatMoney(sampleF)} ({percentValue}% × G)
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#E6F7F0]/60 border border-[#B2E5D0] space-y-1">
              <div className="font-bold text-[#146C43]">
                Nếu khách trả 70% cuối ONLINE (UC.20):
              </div>
              <div>
                Cộng vào Ví HDV <strong>+(G - F)</strong>:{' '}
                <strong className="text-sm">{formatMoney(sampleG - sampleF)}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#E6F9FA]/60 border border-[#1EC1CB]/40 space-y-1">
              <div className="font-bold text-[#118B93]">
                Nếu khách trả 70% cuối TIỀN MẶT (UC.21):
              </div>
              <div>
                HDV cầm 700.000 ₫ tiền mặt + Cộng thêm vào Ví HDV <strong>+(D - F)</strong>:{' '}
                <strong className="text-sm">{formatMoney(sampleD - sampleF)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#1A0A0F] flex items-center gap-2">
          <History className="w-5 h-5 text-[#1A0A0F]" /> Lịch sử điều chỉnh Tỷ lệ Phí dịch vụ (`PLATFORM_FEE_CONFIG`)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                <th className="py-3 px-4">Mã phiên bản</th>
                <th className="py-3 px-4">Tỷ lệ phí</th>
                <th className="py-3 px-4">Ghi chú áp dụng</th>
                <th className="py-3 px-4">Người cập nhật</th>
                <th className="py-3 px-4">Thời gian hiệu lực</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8CED5] text-sm">
              {feeHistory.map((item) => {
                const admin = getUserById(item.updatedByAdminId);
                return (
                  <tr key={item.id} className="hover:bg-[#FDF7F9]/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1C1C28]">{item.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#E6F9FA] text-[#118B93] border border-[#1EC1CB]/40">
                        {Math.round(item.feeRate * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#1C1C28]">{item.effectiveNote}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#525266]">
                      {admin?.fullName || item.updatedByAdminId}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6E7085]">
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
      <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#1A0A0F]">
          Chính sách Đặt cọc, Giữ khung giờ & Bậc Phạt/Hoàn theo ΔT (BR-05, BR-06)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-[10px] bg-[#FDF7F9] border border-[#E8CED5] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#525266] block">
              Tỷ lệ Đặt cọc & Tất toán
            </span>
            <strong className="text-base text-[#1A0A0F] block">30% Cọc • 70% Sau tour</strong>
            <p className="text-[#525266]">Giữ khung giờ nguyên tử (HOLD) đúng 15 phút khi thanh toán cọc.</p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#E6F7F0]/60 border border-[#B2E5D0] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#146C43] block">
              Bậc 1: ΔT &gt; 48 giờ
            </span>
            <strong className="text-base text-[#146C43] block">Phạt 0% • Hoàn 100% cọc</strong>
            <p className="text-[#1C1C28]">Hủy sớm trước hơn 48 giờ so với giờ hẹn khởi hành.</p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#FFF5E5] border border-[#F8D39A] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#9A5B06] block">
              Bậc 2: 24h ≤ ΔT ≤ 48h
            </span>
            <strong className="text-base text-[#9A5B06] block">Phạt 50% • Hoàn 50% cọc</strong>
            <p className="text-[#1C1C28]">Phần phạt 50% khấu trừ phí sàn rồi cộng bồi thường ví HDV.</p>
          </div>
          <div className="p-4 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#A62626] block">
              Bậc 3: ΔT &lt; 24 giờ
            </span>
            <strong className="text-base text-[#A62626] block">Phạt 100% • Hoàn 0% cọc</strong>
            <p className="text-[#1C1C28]">Nếu lỗi hủy từ phía HDV: Khách luôn được hoàn 100% cọc + HDV bị +1 vi phạm.</p>
          </div>
        </div>
      </div>

      {/* Nhật ký hoạt động quản trị & kiểm toán hệ thống (System Activity Audit Log) */}
      <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-extrabold text-[#1A0A0F]">
            Nhật ký Hoạt động & Truy vết Hệ thống (Audit Log)
          </h2>
          <span className="text-xs font-bold text-[#118B93] bg-[#E6F9FA] px-2.5 py-1 rounded-full">
            Tự động ghi nhận mọi thay đổi trạng thái nhạy cảm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Chi tiết sự kiện kiểm toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8CED5] text-xs">
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
                  <tr key={log.id} className="hover:bg-[#FDF7F9]/60">
                    <td className="py-3 px-4 font-mono text-[#525266] whitespace-nowrap">
                      {formatDateTimeVN(log.time)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1C1C28] text-[#1EC1CB] font-bold text-[10px]">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1A0A0F]">{log.ref}</td>
                    <td className="py-3 px-4 text-[#1C1C28]">{log.detail}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
