import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Building2,
  MapPin,
  Languages,
  AlertCircle,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDateTimeVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { KycRecord, KycStatus } from '../../types';

export const KycReviewPage: React.FC = () => {
  const { kycRecords, getGuideById, approveKyc, rejectKyc } = useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | KycStatus>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const filteredRecords = kycRecords.filter((rec) =>
    filterStatus === 'ALL' ? true : rec.status === filterStatus
  );

  const pendingCount = kycRecords.filter((r) => r.status === 'PENDING').length;
  const approvedCount = kycRecords.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = kycRecords.filter((r) => r.status === 'REJECTED').length;

  const handleOpenInspect = (rec: KycRecord) => {
    setSelectedRecord(rec);
    setReviewNote(rec.reviewNote || '');
    setNoteError('');
  };

  const handleApprove = (guideId: string) => {
    const note = reviewNote.trim() || 'Đã đối chiếu CCCD gắn chip và Thẻ HDV/Chứng chỉ hợp lệ tại Đà Nẵng.';
    approveKyc(guideId, note);
    showToast('Đã phê duyệt hồ sơ KYC! Hướng dẫn viên đã được mở khóa hiển thị công khai (BR-01).', 'success');
    setSelectedRecord(null);
  };

  const handleReject = (guideId: string) => {
    if (!reviewNote.trim()) {
      setNoteError('Bắt buộc nhập lý do từ chối cụ thể để Hướng dẫn viên biết và bổ sung lại hồ sơ.');
      return;
    }
    rejectKyc(guideId, reviewNote.trim());
    showToast('Đã từ chối hồ sơ KYC và gửi thông báo yêu cầu bổ sung cho HDV.', 'info');
    setSelectedRecord(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-[12px] border border-[#E8CED5]" />
        <div className="h-96 bg-white rounded-[12px] border border-[#E8CED5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#118B93] bg-[#E6F9FA] px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Thẩm định Định danh HDV • UC.10 & BR-01
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Duyệt hồ sơ KYC Hướng dẫn viên
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Kiểm tra CCCD, Thẻ HDV/Chứng chỉ ngoại ngữ và tài khoản ngân hàng trước khi cấp quyền nhận khách (BR-01).
          </p>
        </div>

        {/* Summary Counters */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-[10px] bg-[#FFF5E5] border border-[#F8D39A] text-xs font-bold text-[#9A5B06]">
            Chờ duyệt: {pendingCount}
          </span>
          <span className="px-3 py-1.5 rounded-[10px] bg-[#E6F7F0] border border-[#B2E5D0] text-xs font-bold text-[#146C43]">
            Đã duyệt: {approvedCount}
          </span>
          <span className="px-3 py-1.5 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-bold text-[#A62626]">
            Từ chối: {rejectedCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'ALL', label: `Tất cả hồ sơ (${kycRecords.length})` },
            { key: 'PENDING', label: `Chờ thẩm định (${pendingCount})` },
            { key: 'APPROVED', label: `Đã phê duyệt (${approvedCount})` },
            { key: 'REJECTED', label: `Đã từ chối (${rejectedCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#1EC1CB] text-[#1C1C28] shadow-xs'
                : 'bg-white text-[#525266] hover:bg-[#F6E6EA]/60 border border-[#E8CED5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-[#E8CED5] shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-[#6E7085] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1A0A0F]">
              Không có hồ sơ KYC nào trong trạng thái này
            </h3>
            <p className="text-sm text-[#525266] mt-1">
              Hãy chuyển bộ lọc sang "Tất cả hồ sơ" để xem toàn bộ danh sách Hướng dẫn viên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                  <th className="py-3.5 px-4">Hướng dẫn viên</th>
                  <th className="py-3.5 px-4">Số CCCD & Ngân hàng</th>
                  <th className="py-3.5 px-4">Chuyên môn & Khu vực</th>
                  <th className="py-3.5 px-4">Tài liệu đính kèm</th>
                  <th className="py-3.5 px-4">Trạng thái KYC</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CED5] text-sm">
                {filteredRecords.map((rec) => {
                  const guideData = getGuideById(rec.guideId);
                  return (
                    <tr key={rec.id} className="hover:bg-[#FDF7F9]/60 transition-colors">
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              guideData?.profile.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
                            }
                            alt={guideData?.user.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-[#E8CED5]"
                          />
                          <div>
                            <div className="font-extrabold text-[#1A0A0F]">
                              {guideData?.user.fullName || rec.guideId}
                            </div>
                            <div className="text-xs text-[#525266]">
                              {guideData?.user.email} • {guideData?.user.phone}
                            </div>
                            <div className="text-[11px] text-[#6E7085] mt-0.5">
                              Nộp lúc: {formatDateTimeVN(rec.submittedAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono font-bold text-[#1C1C28]">
                          CCCD: {rec.idNumber}
                        </div>
                        <div className="text-xs text-[#525266] mt-1">
                          {rec.bankName} • <strong>{rec.bankAccountNumber}</strong>
                        </div>
                        <div className="text-[11px] text-[#6E7085]">{rec.bankAccountHolder}</div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        {guideData && (
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-[#118B93]">
                              {formatMoney(guideData.profile.hourlyRate)} / giờ •{' '}
                              {guideData.profile.yearsExperience} năm KN
                            </div>
                            <div className="text-[#525266] flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {guideData.profile.areas.join(', ')}
                              </span>
                            </div>
                            <div className="text-[#525266] flex items-center gap-1">
                              <Languages className="w-3 h-3 shrink-0" />
                              <span>{guideData.profile.languages.join(', ')}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {rec.documents.map((doc) => (
                            <span
                              key={doc.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F5F8] text-[#1C1C28] text-xs font-medium border border-[#E2E4EC]"
                            >
                              <FileText className="w-3 h-3 text-[#118B93]" />
                              {doc.docType === 'CCCD_FRONT'
                                ? 'CCCD Trước'
                                : doc.docType === 'CCCD_BACK'
                                ? 'CCCD Sau'
                                : doc.docType === 'GUIDE_CARD'
                                ? 'Thẻ HDV'
                                : 'Chứng chỉ NN'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        {rec.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF5E5] text-[#9A5B06] border border-[#F8D39A]">
                            <Clock className="w-3.5 h-3.5" /> Chờ thẩm định
                          </span>
                        )}
                        {rec.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#146C43] border border-[#B2E5D0]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã phê duyệt
                          </span>
                        )}
                        {rec.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDECEC] text-[#A62626] border border-[#F5B5B5]">
                            <XCircle className="w-3.5 h-3.5" /> Đã từ chối
                          </span>
                        )}
                        {rec.reviewNote && (
                          <div className="text-[11px] text-[#525266] mt-1 max-w-[200px] line-clamp-2">
                            Ghi chú: {rec.reviewNote}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenInspect(rec)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Xem & Thẩm định
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect & Approve/Reject Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Thẩm định Hồ sơ KYC: ${
            getGuideById(selectedRecord.guideId)?.user.fullName || selectedRecord.guideId
          }`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Guide Info Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FDF7F9] border border-[#E8CED5] rounded-[12px] p-4 text-xs">
              <div className="space-y-1">
                <div className="text-[#525266]">Họ tên & Số CCCD định danh:</div>
                <div className="font-extrabold text-sm text-[#1A0A0F]">
                  {getGuideById(selectedRecord.guideId)?.user.fullName} — CCCD:{' '}
                  {selectedRecord.idNumber}
                </div>
                <div className="text-[#525266]">
                  Đơn giá niêm yết:{' '}
                  <strong>
                    {formatMoney(getGuideById(selectedRecord.guideId)?.profile.hourlyRate || 0)} / giờ
                  </strong>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[#525266] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Tài khoản nhận đối soát:
                </div>
                <div className="font-bold text-[#1C1C28]">{selectedRecord.bankName}</div>
                <div className="font-mono text-[#118B93] font-bold">
                  STK: {selectedRecord.bankAccountNumber} ({selectedRecord.bankAccountHolder})
                </div>
              </div>
            </div>

            {/* Document Gallery */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#525266] mb-2.5">
                Tài liệu định danh đính kèm ({selectedRecord.documents.length} tệp)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRecord.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-[#E8CED5] rounded-[10px] overflow-hidden bg-white"
                  >
                    <div className="px-3 py-2 bg-[#F6E6EA]/60 border-b border-[#E8CED5] flex items-center justify-between text-xs font-bold text-[#1A0A0F]">
                      <span>{doc.name}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#118B93] hover:underline"
                      >
                        Mở ảnh gốc ↗
                      </a>
                    </div>
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Note Input */}
            <div>
              <label className="block text-xs font-bold text-[#1C1C28] mb-1.5">
                Nhận xét thẩm định / Lý do từ chối (Bắt buộc nếu Từ chối) *
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => {
                  setReviewNote(e.target.value);
                  if (noteError) setNoteError('');
                }}
                placeholder="Nhập ghi chú đối chiếu giấy tờ hoặc lý do yêu cầu HDV bổ sung..."
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#D4C0C6] text-sm text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1EC1CB]"
              />
              {noteError && (
                <p className="mt-1.5 text-xs font-semibold text-[#C93B3B] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {noteError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#E8CED5]">
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                Đóng
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(selectedRecord.guideId)}
                icon={<XCircle className="w-4 h-4" />}
              >
                Từ chối & Yêu cầu bổ sung
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedRecord.guideId)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Phê duyệt KYC & Cấp quyền nhận khách (BR-01)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
