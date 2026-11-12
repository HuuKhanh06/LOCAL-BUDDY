import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Calculator,
  Building2,
  AlertCircle,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDateTimeVN } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { WalletTxType } from '../../types';

export const WalletPage: React.FC = () => {
  const {
    currentUser,
    getGuideById,
    getWalletByGuideId,
    walletTransactions,
    withdrawals,
    bookings,
    feeRate,
    requestWithdrawal,
  } = useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals' | 'simulator'>('ledger');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const guideId = currentUser?.role === 'guide' ? currentUser.id : 'u-guide-1';
  const guideData = getGuideById(guideId);
  const wallet = getWalletByGuideId(guideId);

  const [amountInput, setAmountInput] = useState('');
  const [bankName, setBankName] = useState(guideData?.profile.bankName || 'Vietcombank – CN Đà Nẵng');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    guideData?.profile.bankAccountNumber || '0041000389214'
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    guideData?.profile.bankAccountHolder || 'NGUYEN HUU KHANH'
  );
  const [withdrawError, setWithdrawError] = useState('');

  // Simulator state for BR-13 formula preview
  const [simTotalAmount, setSimTotalAmount] = useState<number>(1000000);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [guideId]);

  const myTransactions = walletTransactions.filter((t) => t.guideId === guideId);
  const myWithdrawals = withdrawals.filter((w) => w.guideId === guideId);

  // Calculate pending reconciliation from bookings in WAITING_FINAL or WAITING_RECONCILE
  const pendingBookings = bookings.filter(
    (b) =>
      b.guideId === guideId &&
      (b.bookingStatus === 'CONFIRMED' ||
        (b.bookingStatus === 'COMPLETED' && b.paymentStatus !== 'PAID'))
  );

  const handleOpenWithdraw = () => {
    setWithdrawError('');
    setAmountInput(wallet.availableBalance >= 200000 ? String(Math.min(500000, wallet.availableBalance)) : '200000');
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    const numAmount = Number(amountInput);

    if (!Number.isFinite(numAmount) || numAmount < 200000) {
      setWithdrawError('Số tiền rút tối thiểu là 200.000 ₫.');
      return;
    }
    if (numAmount > wallet.availableBalance) {
      setWithdrawError(
        `Số tiền rút vượt quá số dư khả dụng hiện tại (${formatMoney(wallet.availableBalance)}).`
      );
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
      setWithdrawError('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng nhận tiền.');
      return;
    }

    const res = requestWithdrawal(numAmount, {
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim().toUpperCase(),
    });

    if (res.ok) {
      showToast(res.message, 'success');
      setIsWithdrawModalOpen(false);
      setActiveTab('withdrawals');
    } else {
      setWithdrawError(res.message);
      showToast(res.message, 'error');
    }
  };

  const getTxBadge = (type: WalletTxType) => {
    switch (type) {
      case 'SETTLEMENT_ONLINE':
        return {
          label: 'Quyết toán Online 70%',
          cls: 'bg-[#E6F7F0] text-[#146C43] border-[#B2E5D0]',
        };
      case 'SETTLEMENT_CASH':
        return {
          label: 'Quyết toán Tiền mặt 70%: ',
          cls: 'bg-[#E6F9FA] text-[#118B93] border-[#1EC1CB]/40',
        };
      case 'CANCEL_COMPENSATION':
        return {
          label: 'Bồi thường hủy muộn: +(Phạt - F)',
          cls: 'bg-[#FFF5E5] text-[#9A5B06] border-[#F8D39A]',
        };
      case 'DISPUTE_SETTLEMENT':
        return {
          label: 'Phán quyết tranh chấp: +(Cọc - F)',
          cls: 'bg-[#F6E6EA] text-[#1A0A0F] border-[#E8CED5]',
        };
      case 'WITHDRAWAL_PAYOUT':
        return {
          label: 'Rút tiền về ngân hàng',
          cls: 'bg-[#F4F5F8] text-[#1C1C28] border-[#E2E4EC]',
        };
    }
  };

  // Simulator calculations
  const simDeposit = Math.round(simTotalAmount * 0.3);
  const simBalance70 = simTotalAmount - simDeposit;
  const simFee = Math.round(simTotalAmount * feeRate);
  const simOnlineWalletCredit = simTotalAmount - simFee; // +(G - F)
  const simCashWalletCredit = simDeposit - simFee; // 

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-white rounded-[12px] border border-[#E8CED5]" />
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
            <WalletIcon className="w-3.5 h-3.5" /> Quản lý Ví & Đối soát 
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Ví Hướng dẫn viên & Lịch sử quyết toán
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Theo dõi số dư khả dụng, công thức quyết toán minh bạch và gửi yêu cầu rút tiền về ngân hàng.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenWithdraw}
          disabled={wallet.availableBalance < 200000}
          icon={<ArrowUpRight className="w-4 h-4" />}
        >
          Yêu cầu rút tiền (Tối thiểu 200.000 ₫)
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1C1C28] text-white rounded-[12px] p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F6E6EA]/75">
              Số dư khả dụng (Có thể rút)
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#1EC1CB]/20 flex items-center justify-center text-[#1EC1CB]">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1EC1CB] tracking-tight">
            {formatMoney(wallet.availableBalance)}
          </div>
          <p className="text-xs text-[#F6E6EA]/75 mt-2">
            {wallet.availableBalance >= 200000
              ? 'Đủ điều kiện rút tiền về ngân hàng (≥ 200.000 ₫)'
              : `Cần thêm ${formatMoney(200000 - wallet.availableBalance)} để đạt mức rút tối thiểu 200.000 ₫`}
          </p>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#525266]">
              Đang chờ đối soát / Lệnh rút chờ duyệt
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#FFF5E5] flex items-center justify-center text-[#D9820B]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A0A0F]">
            {formatMoney(wallet.pendingBalance)}
          </div>
          <p className="text-xs text-[#525266] mt-2">
            Đang có <strong>{pendingBookings.length}</strong> chuyến đi chờ tất toán &{' '}
            <strong>{myWithdrawals.filter((w) => w.status === 'PENDING').length}</strong> lệnh rút chờ Admin
          </p>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#525266]">
              Tổng tiền đã rút thành công
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#E6F7F0] flex items-center justify-center text-[#1B8A5A]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1B8A5A]">
            {formatMoney(wallet.totalWithdrawn)}
          </div>
          <p className="text-xs text-[#525266] mt-2">
            Tài khoản nhận: <strong>{bankName}</strong> ({bankAccountNumber})
          </p>
        </div>
      </div>

      {/* Transparent Formula Explanation Banner  */}
      <div className="bg-[#FDF7F9] border border-[#E8CED5] rounded-[12px] p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1A0A0F] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1C1C28] space-y-1.5 leading-relaxed">
            <div className="font-bold text-sm text-[#1A0A0F]">
              Quy tắc quyết toán Ví HDV minh bạch (Tỷ lệ phí sàn hiện hành: {Math.round(feeRate * 100)}%)
            </div>
            <p>
              Giả sử Tổng tiền chuyến đi là <strong>G</strong>, Tiền cọc 30% sàn đã thu hộ là{' '}
              <strong>D = 30% × G</strong>, và Phí dịch vụ nền tảng là{' '}
              <strong>F = G × {Math.round(feeRate * 100)}%</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-[#E8CED5]">
                <div className="font-bold text-[#146C43]">
                  1. Khách trả 70% cuối qua cổng ONLINE 
                </div>
                <div className="mt-1">
                  Khách thanh toán 100% trực tuyến → Hệ thống khấu trừ phí sàn →{' '}
                  <strong>Cộng doanh thu vào ví HDV</strong>.
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E8CED5]">
                <div className="font-bold text-[#118B93]">
                  2. Khách trả 70% cuối bằng TIỀN MẶT cho HDV 
                </div>
                <div className="mt-1">
                  HDV đã cầm trực tiếp 70% tiền mặt → Sàn lấy cọc 30% (D) trừ phí sàn F →{' '}
                  <strong>Cộng phần dư vào ví HDV: </strong>. Tổng thực nhận vẫn đúng bằng{' '}
                  <strong>G - F</strong>!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8CED5] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#1EC1CB] text-[#1C1C28] shadow-xs'
              : 'bg-white text-[#525266] hover:bg-[#F6E6EA]/60 border border-[#E8CED5]'
          }`}
        >
          Sổ cái biến động số dư ({myTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'withdrawals'
              ? 'bg-[#1EC1CB] text-[#1C1C28] shadow-xs'
              : 'bg-white text-[#525266] hover:bg-[#F6E6EA]/60 border border-[#E8CED5]'
          }`}
        >
          Lịch sử yêu cầu rút tiền ({myWithdrawals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'bg-[#1EC1CB] text-[#1C1C28] shadow-xs'
              : 'bg-white text-[#525266] hover:bg-[#F6E6EA]/60 border border-[#E8CED5]'
          }`}
        >
          <Calculator className="w-4 h-4" /> Bảng tính thử doanh thu HDV
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-[12px] border border-[#E8CED5] shadow-xs overflow-hidden">
          {myTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <WalletIcon className="w-10 h-10 text-[#6E7085] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1A0A0F]">Chưa có biến động số dư nào</h3>
              <p className="text-sm text-[#525266] mt-1">
                Khi hoàn thành chuyến đi hoặc nhận tiền bồi thường hủy lịch, giao dịch sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                    <th className="py-3.5 px-4">Mã GD / Thời gian</th>
                    <th className="py-3.5 px-4">Phân loại nghiệp vụ</th>
                    <th className="py-3.5 px-4">Nội dung & Công thức đối soát</th>
                    <th className="py-3.5 px-4 text-right">Biến động</th>
                    <th className="py-3.5 px-4 text-right">Số dư sau GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8CED5] text-sm">
                  {myTransactions.map((tx) => {
                    const badge = getTxBadge(tx.type);
                    const isPositive = tx.amount >= 0;
                    return (
                      <tr key={tx.id} className="hover:bg-[#FDF7F9]/60 transition-colors">
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="font-bold text-[#1C1C28]">{tx.id}</div>
                          <div className="text-xs text-[#6E7085] mt-0.5">
                            {formatDateTimeVN(tx.createdAt)}
                          </div>
                          {tx.bookingId && (
                            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F4F5F8] text-[#1C1C28]">
                              Đơn: {tx.bookingId}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-medium text-[#1C1C28]">{tx.description}</div>
                          {tx.formulaNote && (
                            <div className="text-xs text-[#525266] bg-[#F6E6EA]/50 border border-[#E8CED5] rounded-lg px-2.5 py-1.5 mt-1.5 font-mono">
                              Công thức: {tx.formulaNote}
                            </div>
                          )}
                        </td>
                        <td
                          className={`py-4 px-4 align-top text-right font-extrabold whitespace-nowrap ${
                            isPositive ? 'text-[#146C43]' : 'text-[#C93B3B]'
                          }`}
                        >
                          {isPositive ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                        </td>
                        <td className="py-4 px-4 align-top text-right font-bold text-[#1C1C28] whitespace-nowrap">
                          {formatMoney(tx.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-[12px] border border-[#E8CED5] shadow-xs overflow-hidden">
          {myWithdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-[#6E7085] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1A0A0F]">Chưa có yêu cầu rút tiền nào</h3>
              <p className="text-sm text-[#525266] mt-1 mb-4">
                Bạn có thể gửi yêu cầu rút tiền về tài khoản ngân hàng khi số dư khả dụng đạt từ 200.000 ₫.
              </p>
              <Button
                variant="primary"
                onClick={handleOpenWithdraw}
                disabled={wallet.availableBalance < 200000}
              >
                Tạo lệnh rút tiền ngay
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                    <th className="py-3.5 px-4">Mã lệnh / Ngày tạo</th>
                    <th className="py-3.5 px-4">Ngân hàng thụ hưởng</th>
                    <th className="py-3.5 px-4 text-right">Số tiền rút</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Mã tham chiếu / Ghi chú Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8CED5] text-sm">
                  {myWithdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-[#FDF7F9]/60 transition-colors">
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-[#1C1C28]">{wd.id}</div>
                        <div className="text-xs text-[#6E7085] mt-0.5">
                          {formatDateTimeVN(wd.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-[#1A0A0F]">{wd.bankName}</div>
                        <div className="text-xs text-[#525266]">
                          STK: <strong>{wd.bankAccountNumber}</strong> • {wd.bankAccountHolder}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right font-extrabold text-[#1A0A0F]">
                        {formatMoney(wd.amount)}
                      </td>
                      <td className="py-4 px-4 align-top">
                        {wd.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF5E5] text-[#9A5B06] border border-[#F8D39A]">
                            <Clock className="w-3.5 h-3.5" /> Chờ Admin duyệt
                          </span>
                        )}
                        {wd.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#146C43] border border-[#B2E5D0]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuyển khoản
                          </span>
                        )}
                        {wd.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDECEC] text-[#A62626] border border-[#F5B5B5]">
                            <XCircle className="w-3.5 h-3.5" /> Từ chối (Đã hoàn ví)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-xs text-[#525266]">
                        {wd.transactionRef && (
                          <div className="font-mono font-bold text-[#146C43] mb-1">
                            UNC: {wd.transactionRef}
                          </div>
                        )}
                        <div>{wd.adminNote || 'Đang trong hàng đợi đối soát ngân hàng'}</div>
                        {wd.processedAt && (
                          <div className="text-[11px] text-[#6E7085] mt-0.5">
                            Xử lý lúc: {formatDateTimeVN(wd.processedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8CED5] pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#1A0A0F]">
                Mô phỏng đối soát doanh thu chuyến đi 
              </h3>
              <p className="text-xs text-[#525266]">
                Nhập tổng giá trị đơn đặt lịch để so sánh dòng tiền giữa Thanh toán Online và Tiền mặt.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-xs font-bold text-[#1C1C28] mb-1">
                Tổng giá trị đơn G (VNĐ)
              </label>
              <input
                type="number"
                min={80000}
                step={50000}
                value={simTotalAmount}
                onChange={(e) => setSimTotalAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2 rounded-[10px] border border-[#D4C0C6] text-sm font-bold text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1EC1CB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Case A: Online */}
            <div className="rounded-[12px] border-2 border-[#1B8A5A]/30 bg-[#E6F7F0]/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-[#E6F7F0] text-[#146C43]">
                  Phương án A: Khách trả 70% cuối ONLINE 
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#525266]">1. Khách đặt cọc 30%:</span>
                  <span className="font-bold text-[#1C1C28]">{formatMoney(simDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525266]">2. Khách trả nốt 70% Online cho Sàn:</span>
                  <span className="font-bold text-[#1C1C28]">{formatMoney(simBalance70)}</span>
                </div>
                <div className="flex justify-between text-[#C93B3B]">
                  <span>3. Khấu trừ phí nền tảng F ({Math.round(feeRate * 100)}% × G):</span>
                  <span className="font-bold">-{formatMoney(simFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#B2E5D0] flex justify-between items-center">
                  <span className="font-bold text-[#146C43]">Cộng vào Ví HDV:</span>
                  <span className="text-lg font-extrabold text-[#146C43]">
                    +{formatMoney(simOnlineWalletCredit)}
                  </span>
                </div>
                <div className="text-xs text-[#525266] pt-1">
                  Tổng thực nhận của HDV: <strong>{formatMoney(simOnlineWalletCredit)}</strong> (100% nằm trong Ví)
                </div>
              </div>
            </div>

            {/* Case B: Cash */}
            <div className="rounded-[12px] border-2 border-[#1EC1CB]/50 bg-[#E6F9FA]/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-[#E6F9FA] text-[#118B93]">
                  Phương án B: Khách trả 70% cuối TIỀN MẶT 
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#525266]">1. Khách đặt cọc 30%:</span>
                  <span className="font-bold text-[#1C1C28]">{formatMoney(simDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525266]">2. HDV thu trực tiếp 70% Tiền mặt:</span>
                  <span className="font-bold text-[#118B93]">+{formatMoney(simBalance70)} (Tiền mặt)</span>
                </div>
                <div className="flex justify-between text-[#C93B3B]">
                  <span>3. Sàn khấu trừ phí F ({Math.round(feeRate * 100)}% × G) từ cọc D:</span>
                  <span className="font-bold">-{formatMoney(simFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#1EC1CB]/40 flex justify-between items-center">
                  <span className="font-bold text-[#118B93]">Cộng phần dư vào Ví HDV :</span>
                  <span className="text-lg font-extrabold text-[#118B93]">
                    +{formatMoney(simCashWalletCredit)}
                  </span>
                </div>
                <div className="text-xs text-[#525266] pt-1">
                  Tổng thực nhận của HDV: {formatMoney(simBalance70)} (tiền mặt) +{' '}
                  {formatMoney(simCashWalletCredit)} (ví) ={' '}
                  <strong>{formatMoney(simBalance70 + simCashWalletCredit)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Tạo yêu cầu rút tiền về ngân hàng "
      >
        <form onSubmit={handleConfirmWithdraw} className="space-y-4">
          <div className="bg-[#F6E6EA]/70 border border-[#E8CED5] rounded-[10px] p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#525266]">Số dư khả dụng hiện tại</div>
              <div className="text-lg font-extrabold text-[#1A0A0F]">
                {formatMoney(wallet.availableBalance)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAmountInput(String(wallet.availableBalance))}
              className="px-3 py-1.5 rounded-lg bg-[#1EC1CB] text-[#1C1C28] text-xs font-bold hover:bg-[#17A6AF] cursor-pointer"
            >
              Rút tối đa
            </button>
          </div>

          <Input
            label="Số tiền muốn rút (VNĐ) *"
            type="number"
            min={200000}
            max={wallet.availableBalance}
            step={50000}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            helperText="Tối thiểu 200.000 ₫ / lần."
            required
          />

          <Input
            label="Tên ngân hàng & Chi nhánh *"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="VD: Vietcombank – CN Đà Nẵng"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Số tài khoản *"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="VD: 0041000389214"
              required
            />
            <Input
              label="Chủ tài khoản (In hoa không dấu) *"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN HUU KHANH"
              required
            />
          </div>

          {withdrawError && (
            <div className="p-3 rounded-[10px] bg-[#FDECEC] border border-[#F5B5B5] text-xs font-semibold text-[#A62626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          <div className="bg-[#FFF5E5] border border-[#F8D39A] rounded-[10px] p-3 text-xs text-[#9A5B06] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Sau khi gửi yêu cầu, số tiền sẽ tạm khóa khỏi Số dư khả dụng để chờ Admin đối soát và chuyển khoản . Nếu lệnh bị từ chối, tiền sẽ được hoàn lại 100% vào ví của bạn.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Xác nhận rút {formatMoney(Number(amountInput) || 0)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
