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
            <Building2 className="w-3.5 h-3.5" /> Đối soát & Giải ngân Ví HDV • UC.23 & BR-09
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Duyệt yêu cầu rút tiền Hướng dẫn viên
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Kiểm tra số dư ví, thực hiện chuyển khoản ngân hàng và cập nhật mã Ủy nhiệm chi (UNC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-[10px] bg-[#FFF5E5] border border-[#F8D39A] text-xs font-bold text-[#9A5B06]">
            Chờ giải ngân: {pendingList.length} (
            {formatMoney(pendingList.reduce((acc, w) => acc + w.amount, 0))})
          </span>
          <span className="px-3 py-1.5 rounded-[10px] bg-[#E6F7F0] border border-[#B2E5D0] text-xs font-bold text-[#146C43]">
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
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <WalletIcon className="w-10 h-10 text-[#6E7085] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1A0A0F]">
              Không có yêu cầu rút tiền nào trong trạng thái này
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                  <th className="py-3.5 px-4">Mã lệnh / Thời gian</th>
                  <th className="py-3.5 px-4">Hướng dẫn viên</th>
                  <th className="py-3.5 px-4">Tài khoản thụ hưởng</th>
                  <th className="py-3.5 px-4 text-right">Số tiền rút</th>
                  <th className="py-3.5 px-4">Trạng thái / Mã UNC</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CED5] text-sm">
                {filteredList.map((wd) => {
                  const guide = getGuideById(wd.guideId);
                  const wallet = getWalletByGuideId(wd.guideId);
                  return (
                    <tr key={wd.id} className="hover:bg-[#FDF7F9]/60 transition-colors">
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-[#1C1C28]">{wd.id}</div>
                        <div className="text-xs text-[#6E7085] mt-0.5">
                          {formatDateTimeVN(wd.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-[#1A0A0F]">
                          {guide?.user.fullName || wd.guideId}
                        </div>
                        <div className="text-xs text-[#525266]">{guide?.user.phone}</div>
                        <div className="text-[11px] text-[#118B93] font-semibold mt-0.5">
                          Số dư khả dụng còn lại: {formatMoney(wallet.availableBalance)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-[#1C1C28]">{wd.bankName}</div>
                        <div className="text-xs font-mono font-bold text-[#1A0A0F]">
                          STK: {wd.bankAccountNumber}
                        </div>
                        <div className="text-xs text-[#525266]">{wd.bankAccountHolder}</div>
                      </td>
                      <td className="py-4 px-4 align-top text-right font-extrabold text-base text-[#1A0A0F] whitespace-nowrap">
                        {formatMoney(wd.amount)}
                      </td>
                      <td className="py-4 px-4 align-top">
                        {wd.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF5E5] text-[#9A5B06] border border-[#F8D39A]">
                            <Clock className="w-3.5 h-3.5" /> Chờ giải ngân
                          </span>
                        )}
                        {wd.status === 'APPROVED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#146C43] border border-[#B2E5D0]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuyển khoản
                            </span>
                            {wd.transactionRef && (
                              <div className="text-xs font-mono font-bold text-[#146C43] mt-1">
                                UNC: {wd.transactionRef}
                              </div>
                            )}
                          </div>
                        )}
                        {wd.status === 'REJECTED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDECEC] text-[#A62626] border border-[#F5B5B5]">
                              <XCircle className="w-3.5 h-3.5" /> Đã từ chối (Hoàn ví)
                            </span>
                            {wd.adminNote && (
                              <div className="text-xs text-[#A62626] mt-1">{wd.adminNote}</div>
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
                          <span className="text-xs text-[#6E7085]">
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
            <div className="bg-[#FDF7F9] border border-[#E8CED5] rounded-[10px] p-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#525266]">Hướng dẫn viên:</span>
                <span className="font-bold text-[#1A0A0F]">
                  {getGuideById(selectedRequest.guideId)?.user.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525266]">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-[#1C1C28]">{selectedRequest.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525266]">Số tài khoản:</span>
                <span className="font-mono font-bold text-[#118B93]">
                  {selectedRequest.bankAccountNumber} ({selectedRequest.bankAccountHolder})
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-[#E8CED5] text-sm">
                <span className="font-bold text-[#1A0A0F]">Số tiền giải ngân:</span>
                <span className="font-extrabold text-[#146C43]">
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
              <label className="block text-xs font-bold text-[#1C1C28] mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#D4C0C6] text-sm text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1EC1CB]"
              />
            </div>

            {formError && (
              <div className="p-3 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-semibold text-[#A62626] flex items-center gap-1.5">
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
