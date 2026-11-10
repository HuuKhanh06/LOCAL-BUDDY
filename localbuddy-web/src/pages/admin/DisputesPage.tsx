// pages/admin/DisputesPage.tsx (UC.27: Phân xử Tranh chấp & BR-12)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState, useEffect } from 'react';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Clock,
  ShieldAlert,
  UserCheck,
  UserX,
  FileText,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDateTimeVN, formatDateVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { DisputeRecord, DisputeFaultDecision } from '../../types';

export const DisputesPage: React.FC = () => {
  const {
    disputes,
    getBookingById,
    getGuideById,
    getUserById,
    resolveDispute,
  } = useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [decision, setDecision] = useState<DisputeFaultDecision>('GUIDE_FAULT');
  const [resolutionNote, setResolutionNote] = useState('');
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const openDisputes = disputes.filter((d) => d.status !== 'RESOLVED');
  const resolvedDisputes = disputes.filter((d) => d.status === 'RESOLVED');

  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus === 'OPEN') return d.status !== 'RESOLVED';
    if (filterStatus === 'RESOLVED') return d.status === 'RESOLVED';
    return true;
  });

  const handleOpenRulingModal = (disp: DisputeRecord) => {
    setSelectedDispute(disp);
    setDecision(disp.decision || 'GUIDE_FAULT');
    setResolutionNote(disp.resolutionNote || '');
    setNoteError('');
  };

  const handleConfirmRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!resolutionNote.trim() || resolutionNote.trim().length < 10) {
      setNoteError(
        'Vui lòng nhập kết luận phân xử chi tiết (tối thiểu 10 ký tự) để lưu hồ sơ đối soát (DISPUTE.ketQuaXuLy).'
      );
      return;
    }

    const res = resolveDispute(selectedDispute.bookingId, resolutionNote.trim(), decision);
    if (res.ok) {
      showToast(res.message, 'success');
      setSelectedDispute(null);
    } else {
      setNoteError(res.message);
      showToast(res.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-[#E7E5E4]" />
        <div className="h-96 bg-white rounded-2xl border border-[#E7E5E4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full mb-2">
            <Scale className="w-3.5 h-3.5" /> Phân xử Khiếu nại & Tranh chấp • UC.27 & BR-12
          </span>
          <h1 className="text-2xl font-extrabold text-[#1C1917]">
            Trung tâm Xử lý Khiếu nại & Bảo vệ Giao dịch
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Thẩm định bằng chứng từ Du khách và Hướng dẫn viên, đưa ra phán quyết hoàn cọc hoặc bồi thường ví HDV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            Chờ phân xử: {openDisputes.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            Đã giải quyết: {resolvedDisputes.length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'ALL', label: `Tất cả hồ sơ (${disputes.length})` },
            { key: 'OPEN', label: `Đang tranh chấp (${openDisputes.length})` },
            { key: 'RESOLVED', label: `Đã kết luận (${resolvedDisputes.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#EB5B38] text-white shadow-xs'
                : 'bg-white text-[#78716C] hover:bg-[#F3F1EC] border border-[#E7E5E4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-12 text-center">
            <Scale className="w-10 h-10 text-[#78716C] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1C1917]">
              Không có hồ sơ khiếu nại nào trong mục này
            </h3>
            <p className="text-sm text-[#78716C] mt-1">
              Mọi giao dịch đặt lịch tại Đà Nẵng đang diễn ra ổn định.
            </p>
          </div>
        ) : (
          filteredDisputes.map((disp) => {
            const booking = getBookingById(disp.bookingId);
            const reporter = getUserById(disp.reporterId);
            const tourist = booking ? getUserById(booking.touristId) : undefined;
            const guide = booking ? getGuideById(booking.guideId) : undefined;

            return (
              <div
                key={disp.id}
                className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E5E4] pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded bg-[#272A2D] text-[#E6E4DC]">
                      {disp.id}
                    </span>
                    <span className="font-bold text-sm text-[#1C1917]">
                      Đơn đặt lịch: {disp.bookingId}
                    </span>
                    {disp.status !== 'RESOLVED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Đang đóng băng chờ phân xử
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã phán quyết:{' '}
                        {disp.decision === 'GUIDE_FAULT' ? 'Lỗi do HDV (Hoàn cọc 100%)' : 'Lỗi do Khách (Tịch thu cọc)'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#78716C] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Gửi lúc: {formatDateTimeVN(disp.createdAt)}
                  </div>
                </div>

                {/* Parties & Financial Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F3F1EC] rounded-xl p-4 border border-[#E7E5E4] text-xs">
                  <div>
                    <div className="text-[#78716C] font-semibold">Người gửi khiếu nại:</div>
                    <div className="font-extrabold text-sm text-[#1C1917] mt-0.5">
                      {reporter?.fullName || disp.reporterId} (
                      {disp.reporterRole === 'tourist' ? 'Du khách' : 'Hướng dẫn viên'})
                    </div>
                    <div className="text-rose-700 font-bold mt-1">
                      Nhóm lý do: {disp.reasonCategory}
                    </div>
                  </div>

                  <div>
                    <div className="text-[#78716C] font-semibold">Các bên trong giao dịch:</div>
                    <div className="mt-0.5 text-[#1C1917]">
                      Du khách: <strong>{tourist?.fullName || booking?.touristId}</strong>
                    </div>
                    <div className="mt-0.5 text-[#1C1917]">
                      HDV: <strong>{guide?.user.fullName || booking?.guideId}</strong>
                    </div>
                    {booking && (
                      <div className="text-[#78716C] mt-0.5">
                        Ngày đi: {formatDateVN(booking.date)} ({booking.startTime} - {booking.endTime})
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[#78716C] font-semibold">Giá trị đơn & Tiền cọc đang giữ:</div>
                    {booking ? (
                      <>
                        <div className="mt-0.5 text-[#1C1917]">
                          Tổng giá trị đơn (G): <strong>{formatMoney(booking.totalAmount)}</strong>
                        </div>
                        <div className="text-sm font-extrabold text-[#347CCB] mt-0.5">
                          Cọc 30% (D): {formatMoney(booking.depositAmount)} (Phí sàn{' '}
                          {Math.round(booking.feeRate * 100)}%)
                        </div>
                      </>
                    ) : (
                      <div className="text-[#78716C]">Không tìm thấy đơn</div>
                    )}
                  </div>
                </div>

                {/* Description & Evidence */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                    Nội dung tường trình khiếu nại:
                  </div>
                  <p className="text-sm text-[#1C1917] bg-[#F3F1EC] p-3.5 rounded-xl border border-[#E7E5E4] leading-relaxed">
                    "{disp.description}"
                  </p>
                </div>

                {disp.evidenceUrls.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-[#78716C] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Bằng chứng đính kèm:
                    </span>
                    {disp.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[#347CCB] text-xs font-bold hover:underline"
                      >
                        Xem ảnh bằng chứng #{idx + 1} ↗
                      </a>
                    ))}
                  </div>
                )}

                {/* Resolved Outcome Box */}
                {disp.status === 'RESOLVED' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-1">
                    <div className="font-extrabold text-emerald-700 text-sm">
                      Kết luận của Admin ({disp.resolvedAt ? formatDateTimeVN(disp.resolvedAt) : ''}):
                    </div>
                    <p className="text-[#1C1917] font-medium">{disp.resolutionNote}</p>
                    <div className="flex flex-wrap gap-4 pt-1 font-bold text-emerald-700">
                      <span>Hoàn trả khách: {formatMoney(disp.refundAmount || 0)}</span>
                      <span>•</span>
                      <span>Bồi thường ví HDV: {formatMoney(disp.guidePayoutAmount || 0)}</span>
                      <span>•</span>
                      <span>Phí sàn giữ: {formatMoney(disp.platformFeeAmount || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant={disp.status === 'RESOLVED' ? 'outline' : 'primary'}
                    onClick={() => handleOpenRulingModal(disp)}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    {disp.status === 'RESOLVED'
                      ? 'Xem chi tiết hồ sơ phân xử'
                      : 'Thẩm định & Ra phán quyết (UC.27)'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ruling Modal */}
      {selectedDispute && (
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          title={`Phân xử Tranh chấp ${selectedDispute.id} — Đơn ${selectedDispute.bookingId}`}
          size="lg"
        >
          {(() => {
            const booking = getBookingById(selectedDispute.bookingId);
            const deposit = booking?.depositAmount || 0;
            const feeRate = booking?.feeRate || 0.12;
            const platformFeeOnForfeit = Math.round(deposit * feeRate);
            const guideCompOnForfeit = Math.max(0, deposit - platformFeeOnForfeit);

            return (
              <form onSubmit={handleConfirmRuling} className="space-y-5">
                <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-xl p-4 text-xs space-y-1.5">
                  <div className="font-bold text-[#1C1917] text-sm">
                    Tóm tắt khiếu nại ({selectedDispute.reasonCategory}):
                  </div>
                  <p className="text-[#1C1917]">"{selectedDispute.description}"</p>
                  <div className="pt-1 font-bold text-[#347CCB]">
                    Tiền cọc 30% đang đóng băng: {formatMoney(deposit)} (Không thu 70% cuối)
                  </div>
                </div>

                {/* 2 Ruling Cards */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1C1917]">
                    Chọn phán quyết của Admin (BR-12, UC.27) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: GUIDE_FAULT */}
                    <button
                      type="button"
                      disabled={selectedDispute.status === 'RESOLVED'}
                      onClick={() => setDecision('GUIDE_FAULT')}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        decision === 'GUIDE_FAULT'
                          ? 'border-[#347CCB] bg-sky-50 shadow-xs'
                          : 'border-[#E7E5E4] bg-white hover:bg-[#F3F1EC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-sm text-[#1C1917] flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          Phương án 1: Lỗi thuộc về HDV
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          GUIDE_FAULT
                        </span>
                      </div>
                      <ul className="text-xs text-[#78716C] space-y-1 list-disc pl-4">
                        <li>
                          Hoàn trả <strong>100% tiền cọc ({formatMoney(deposit)})</strong> cho Du khách
                        </li>
                        <li>Phí nền tảng giữ lại: <strong>0 ₫</strong></li>
                        <li>
                          Cộng <strong>+1 lần vi phạm</strong> (`soLanViPham`) vào hồ sơ HDV
                        </li>
                      </ul>
                    </button>

                    {/* Option 2: TOURIST_FAULT */}
                    <button
                      type="button"
                      disabled={selectedDispute.status === 'RESOLVED'}
                      onClick={() => setDecision('TOURIST_FAULT')}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        decision === 'TOURIST_FAULT'
                          ? 'border-[#EB5B38] bg-rose-50 shadow-xs'
                          : 'border-[#E7E5E4] bg-white hover:bg-[#F3F1EC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-sm text-[#1C1917] flex items-center gap-1.5">
                          <UserX className="w-4 h-4 text-rose-700" />
                          Phương án 2: Lỗi thuộc về Du khách
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          TOURIST_FAULT
                        </span>
                      </div>
                      <ul className="text-xs text-[#78716C] space-y-1 list-disc pl-4">
                        <li>Tịch thu 100% tiền cọc (Hoàn khách: <strong>0 ₫</strong>)</li>
                        <li>
                          Khấu trừ phí sàn {Math.round(feeRate * 100)}%: <strong>{formatMoney(platformFeeOnForfeit)}</strong>
                        </li>
                        <li>
                          Cộng ví HDV: <strong>+{formatMoney(guideCompOnForfeit)}</strong> & Cộng +1 vi phạm khách
                        </li>
                      </ul>
                    </button>
                  </div>
                </div>

                {/* Mandatory Resolution Note */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                    Biên bản kết luận phân xử (`DISPUTE.ketQuaXuLy` — Bắt buộc) *
                  </label>
                  <textarea
                    rows={3}
                    disabled={selectedDispute.status === 'RESOLVED'}
                    value={resolutionNote}
                    onChange={(e) => {
                      setResolutionNote(e.target.value);
                      if (noteError) setNoteError('');
                    }}
                    placeholder="Ghi rõ căn cứ bằng chứng GPS/tin nhắn và lý do đưa ra phán quyết tài chính..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#347CCB] disabled:bg-[#F3F1EC]"
                  />
                  {noteError && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-700 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> {noteError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E5E4]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDispute(null)}
                  >
                    Đóng
                  </Button>
                  {selectedDispute.status !== 'RESOLVED' && (
                    <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                      Xác nhận Phán quyết & Thực thi Đối soát
                    </Button>
                  )}
                </div>
              </form>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
