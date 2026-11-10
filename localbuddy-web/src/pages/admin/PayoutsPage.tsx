// pages/admin/PayoutsPage.tsx (UC.23: Duyệt Rút tiền HDV & BR-09)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDateTimeVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { WithdrawalRequest } from '../../types';

export const PayoutsPage: React.FC = () => {
  const { withdrawals, getGuideById, getWalletByGuideId, approveWithdrawal, rejectWithdrawal } =
    useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionMode, setActionMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [txRef, setTxRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const pendingList = withdrawals.filter((w) => w.status === 'PENDING');
  const approvedList = withdrawals.filter((w) => w.status === 'APPROVED');
  const rejectedList = withdrawals.filter((w) => w.status === 'REJECTED');

  const filteredList = withdrawals.filter((w) =>
    filterStatus === 'ALL' ? true : w.status === filterStatus
  );

  const handleOpenModal = (req: WithdrawalRequest, mode: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setActionMode(mode);
    setTxRef(req.transactionRef || `FT26095${req.id.replace(/\D/g, '').padStart(5, '8')}`);
    setAdminNote(
      mode === 'APPROVE'
        ? 'Đã đối soát ví HDV và chuyển khoản ngân hàng 24/7 thành công.'
        : ''
    );
    setFormError('');
  };

  const handleConfirmProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (actionMode === 'APPROVE') {
      if (!txRef.trim()) {
        setFormError('Vui lòng nhập Mã tham chiếu Ủy nhiệm chi (UNC / FT) ngân hàng.');
        return;
      }
      approveWithdrawal(selectedRequest.id, txRef.trim(), adminNote.trim());
      showToast(
        `Đã xác nhận chuyển khoản ${formatMoney(selectedRequest.amount)} (Mã UNC: ${txRef.trim()}).`,
        'success'
      );
      setSelectedRequest(null);
    } else {
      if (!adminNote.trim()) {
        setFormError('Vui lòng nhập lý do từ chối lệnh rút tiền để thông báo cho Hướng dẫn viên.');
        return;
      }
      rejectWithdrawal(selectedRequest.id, adminNote.trim());
      showToast(
        `Đã từ chối lệnh rút ${selectedRequest.id} và hoàn lại ${formatMoney(
          selectedRequest.amount
        )} vào số dư khả dụng của HDV.`,
        'info'
      );
      setSelectedRequest(null);
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#347CCB] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full mb-2">
            <Building2 className="w-3.5 h-3.5" /> Đối soát & Giải ngân Ví HDV • UC.23 & BR-09
          </span>
          <h1 className="text-2xl font-extrabold text-[#1C1917]">
            Duyệt yêu cầu rút tiền Hướng dẫn viên
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Kiểm tra số dư ví, thực hiện chuyển khoản ngân hàng và cập nhật mã Ủy nhiệm chi (UNC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
            Chờ giải ngân: {pendingList.length} (
            {formatMoney(pendingList.reduce((acc, w) => acc + w.amount, 0))})
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            Đã chuyển: {approvedList.length} (
            {formatMoney(approvedList.reduce((acc, w) => acc + w.amount, 0))})
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'ALL', label: `Tất cả lệnh rút (${withdrawals.length})` },
            { key: 'PENDING', label: `Chờ duyệt (${pendingList.length})` },
            { key: 'APPROVED', label: `Đã chuyển khoản (${approvedList.length})` },
            { key: 'REJECTED', label: `Đã từ chối (${rejectedList.length})` },
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <WalletIcon className="w-10 h-10 text-[#78716C] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1C1917]">
              Không có yêu cầu rút tiền nào trong trạng thái này
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                  <th className="py-3.5 px-4">Mã lệnh / Thời gian</th>
                  <th className="py-3.5 px-4">Hướng dẫn viên</th>
                  <th className="py-3.5 px-4">Tài khoản thụ hưởng</th>
                  <th className="py-3.5 px-4 text-right">Số tiền rút</th>
                  <th className="py-3.5 px-4">Trạng thái / Mã UNC</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] text-sm">
                {filteredList.map((wd) => {
                  const guide = getGuideById(wd.guideId);
                  const wallet = getWalletByGuideId(wd.guideId);
                  return (
                    <tr key={wd.id} className="hover:bg-[#F3F1EC]/50 transition-colors">
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-[#1C1917]">{wd.id}</div>
                        <div className="text-xs text-[#78716C] mt-0.5">
                          {formatDateTimeVN(wd.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-[#1C1917]">
                          {guide?.user.fullName || wd.guideId}
                        </div>
                        <div className="text-xs text-[#78716C]">{guide?.user.phone}</div>
                        <div className="text-[11px] text-[#347CCB] font-semibold mt-0.5">
                          Số dư khả dụng còn lại: {formatMoney(wallet.availableBalance)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-[#1C1917]">{wd.bankName}</div>
                        <div className="text-xs font-mono font-bold text-[#1C1917]">
                          STK: {wd.bankAccountNumber}
                        </div>
                        <div className="text-xs text-[#78716C]">{wd.bankAccountHolder}</div>
                      </td>
                      <td className="py-4 px-4 align-top text-right font-extrabold text-base text-[#1C1917] whitespace-nowrap">
                        {formatMoney(wd.amount)}
                      </td>
                      <td className="py-4 px-4 align-top">
                        {wd.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Chờ giải ngân
                          </span>
                        )}
                        {wd.status === 'APPROVED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuyển khoản
                            </span>
                            {wd.transactionRef && (
                              <div className="text-xs font-mono font-bold text-emerald-700 mt-1">
                                UNC: {wd.transactionRef}
                              </div>
                            )}
                          </div>
                        )}
                        {wd.status === 'REJECTED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Đã từ chối (Hoàn ví)
                            </span>
                            {wd.adminNote && (
                              <div className="text-xs text-rose-700 mt-1">{wd.adminNote}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        {wd.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(wd, 'REJECT')}
                            >
                              Từ chối
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenModal(wd, 'APPROVE')}
                              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                            >
                              Xác nhận chuyển khoản
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#78716C]">
                            Đã xử lý {wd.processedAt ? formatDateTimeVN(wd.processedAt) : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Approve / Reject */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={
            actionMode === 'APPROVE'
              ? `Xác nhận giải ngân lệnh ${selectedRequest.id} (UC.23)`
              : `Từ chối lệnh rút tiền ${selectedRequest.id} & Hoàn ví`
          }
        >
          <form onSubmit={handleConfirmProcess} className="space-y-4">
            <div className="bg-[#F3F1EC] border border-[#E7E5E4] rounded-xl p-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Hướng dẫn viên:</span>
                <span className="font-bold text-[#1C1917]">
                  {getGuideById(selectedRequest.guideId)?.user.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-[#1C1917]">{selectedRequest.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Số tài khoản:</span>
                <span className="font-mono font-bold text-[#347CCB]">
                  {selectedRequest.bankAccountNumber} ({selectedRequest.bankAccountHolder})
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-[#E7E5E4] text-sm">
                <span className="font-bold text-[#1C1917]">Số tiền giải ngân:</span>
                <span className="font-extrabold text-emerald-700">
                  {formatMoney(selectedRequest.amount)}
                </span>
              </div>
            </div>

            {actionMode === 'APPROVE' && (
              <Input
                label="Mã giao dịch Ủy nhiệm chi ngân hàng (UNC / FT) *"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="VD: FT2609588219"
                required
              />
            )}

            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                {actionMode === 'APPROVE'
                  ? 'Ghi chú đối soát (Hiển thị trên sao kê HDV)'
                  : 'Lý do từ chối (Bắt buộc — Tiền sẽ hoàn lại ví HDV) *'}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  actionMode === 'APPROVE'
                    ? 'Nhập ghi chú chuyển khoản...'
                    : 'VD: Tên chủ tài khoản không khớp với họ tên trên CCCD KYC...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#347CCB]"
              />
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant={actionMode === 'APPROVE' ? 'primary' : 'danger'}
              >
                {actionMode === 'APPROVE'
                  ? 'Xác nhận Đã chuyển khoản'
                  : 'Từ chối & Hoàn tiền vào ví HDV'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
