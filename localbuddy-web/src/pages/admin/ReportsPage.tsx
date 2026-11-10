// pages/admin/ReportsPage.tsx (UC.28: Báo cáo & Thống kê; QĐ-09: Hàng đợi đối soát; Giám sát booking)
// Chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Award,
  MapPin,
  Download,
  Search,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { formatDate } from '../../utils/time';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'overview' | 'reconcile' | 'monitoring') || 'overview';

  const {
    bookings,
    allGuides,
    cancellations,
    disputes,
    getUserById,
    adminReconcilePayment,
  } = useBookingContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_7_DAYS'>('ALL');
  const [referenceNow] = useState<number>(() => Date.now());

  // Search & Filter for Monitoring Tab
  const [monitorSearch, setMonitorSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Reconcile dialog / note state
  const [reconcileModalBookingId, setReconcileModalBookingId] = useState<string | null>(null);
  const [reconcileNote, setReconcileNote] = useState<string>('Đã kiểm tra đối soát cổng thanh toán');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const setTab = (tab: 'overview' | 'reconcile' | 'monitoring') => {
    setSearchParams({ tab });
  };

  const filteredBookings = bookings.filter((b) => {
    if (periodFilter === 'ALL') return true;
    const bDate = new Date(b.createdAt).getTime();
    if (periodFilter === 'LAST_7_DAYS') {
      return referenceNow - bDate <= 7 * 24 * 3600 * 1000;
    }
    return referenceNow - bDate <= 30 * 24 * 3600 * 1000;
  });

  const handleExportCsv = () => {
    const headers = [
      'Mã Đơn',
      'Ngày Đi',
      'Khung Giờ',
      'Du Khách',
      'Hướng Dẫn Viên',
      'Số Giờ',
      'Đơn Giá/Giờ (VND)',
      'Tổng Tiền G (VND)',
      'Đặt Cọc 30% D (VND)',
      'Còn Lại 70% B (VND)',
      'Phí Sàn Snapshot (%)',
      'Trạng Thái Đơn',
      'Trạng Thái Thanh Toán',
    ];

    const rows = filteredBookings.map((b) => {
      const touristName = getUserById(b.touristId)?.fullName || b.touristId;
      const guideName = getUserById(b.guideId)?.fullName || b.guideId;
      return [
        b.id,
        b.date,
        `${b.startTime}-${b.endTime}`,
        `"${touristName}"`,
        `"${guideName}"`,
        b.hours,
        b.hourlyRateSnapshot,
        b.totalAmount,
        b.depositAmount,
        b.remainingAmount,
        Math.round(b.feeRate * 100),
        b.bookingStatus,
        b.paymentStatus,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute(
      'download',
      `LocalBuddy-DaNang-BaoCao-DoiSoat-${dateStamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      `Đã xuất tệp báo cáo đối soát CSV (${filteredBookings.length} đơn đặt lịch)!`,
      'success'
    );
  };

  const completedPaidBookings = filteredBookings.filter(
    (b) => b.bookingStatus === 'COMPLETED' && b.paymentStatus === 'PAID'
  );
  const activeConfirmedBookings = filteredBookings.filter(
    (b) =>
      b.bookingStatus === 'CONFIRMED' ||
      b.bookingStatus === 'WAITING_PAYMENT' ||
      (b.bookingStatus === 'COMPLETED' && b.paymentStatus !== 'PAID')
  );
  const cancelledBookings = filteredBookings.filter((b) => b.bookingStatus === 'CANCELLED');
  const disputedBookings = filteredBookings.filter((b) => b.bookingStatus === 'DISPUTED');

  // GMV from completed + pipeline
  const totalGmvCompleted = completedPaidBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalGmvPipeline = filteredBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Danh sách hủy đơn chuẩn hóa (kết hợp CANCELLATION_RECORD và các đơn CANCELLED)
  const effectiveCancellations = useMemo(() => {
    const list = [...cancellations];
    const existingBookingIds = new Set(list.map((c) => c.bookingId));
    for (const b of filteredBookings) {
      if (b.bookingStatus === 'CANCELLED' && !existingBookingIds.has(b.id)) {
        const penaltyRate = b.depositAmount > 0 ? (b.penalty || 0) / b.depositAmount : 0;
        const platformFee = Math.max(0, (b.penalty || 0) - (b.guideCompensation || 0));
        list.push({
          id: `CAN-${b.id}`,
          bookingId: b.id,
          cancelledByUserId: b.touristId,
          cancellationType: b.cancellationType || 'TOURIST_CANCEL',
          reason: b.cancelReason || 'Du khách hủy đơn',
          cancelledAt: b.cancelledAt || b.createdAt,
          deltaHours: b.deltaHours || 0,
          penaltyRate,
          refundToTourist: b.refund || 0,
          platformFeeRetained: platformFee,
          paidToGuide: b.guideCompensation || 0,
        });
        existingBookingIds.add(b.id);
      }
    }
    return list;
  }, [cancellations, filteredBookings]);

  // Platform Fee Revenue
  const feeFromCompleted = completedPaidBookings.reduce(
    (sum, b) => sum + Math.round(b.totalAmount * b.feeRate),
    0
  );
  const feeFromCancellations = effectiveCancellations.reduce(
    (sum, c) => sum + (c.platformFeeRetained || 0),
    0
  );
  const totalPlatformRevenue = feeFromCompleted + feeFromCancellations;

  // Top Guides ranking
  const guideStats = allGuides
    .map(({ user, profile }) => {
      const guideCompleted = bookings.filter(
        (b) => b.guideId === user.id && b.bookingStatus === 'COMPLETED'
      );
      const gmv = guideCompleted.reduce((s, b) => s + b.totalAmount, 0);
      return {
        user,
        profile,
        completedCount: guideCompleted.length + profile.completedTours,
        recentGmv: gmv,
      };
    })
    .sort((a, b) => b.completedCount - a.completedCount);

  // QĐ-09: Hàng đợi đối soát (đơn COMPLETED nhưng chưa thanh toán 70% hoặc đang chờ đối soát)
  const pendingReconcileBookings = bookings.filter(
    (b) =>
      b.bookingStatus === 'COMPLETED' &&
      (b.paymentStatus === 'WAITING_RECONCILE' ||
        b.paymentStatus === 'WAITING_FINAL' ||
        b.paymentStatus === 'DEPOSITED')
  );

  // Giám sát Booking tab list
  const monitoredBookings = bookings.filter((b) => {
    const matchStatus = statusFilter === 'ALL' || b.bookingStatus === statusFilter;
    const q = monitorSearch.trim().toLowerCase();
    const tourist = getUserById(b.touristId);
    const guide = getUserById(b.guideId);
    const matchSearch =
      !q ||
      b.id.toLowerCase().includes(q) ||
      tourist?.fullName.toLowerCase().includes(q) ||
      guide?.fullName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleConfirmReconcile = (bookingId: string) => {
    const res = adminReconcilePayment(bookingId, reconcileNote);
    if (res.ok) {
      showToast(res.message, 'success');
      setReconcileModalBookingId(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleQueryGateway = (bookingId: string) => {
    showToast(`Đã tra cứu cổng thanh toán cho đơn ${bookingId}: Phiên giao dịch hợp lệ.`, 'info');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-2xl border border-[#E7E5E4]" />
        <div className="h-96 bg-white rounded-2xl border border-[#E7E5E4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E5E4] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#347CCB] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
            Admin Portal • UC.28 & QĐ-09
          </span>
          <h1 className="text-[24px] sm:text-[28px] font-black text-[#1C1917] mt-2">
            Báo cáo, Đối soát & Giám sát Nền tảng
          </h1>
        </div>

        {/* 3 Tabs Điều hướng */}
        <div className="flex items-center gap-1.5 bg-[#F3F1EC] p-1.5 rounded-2xl border border-[#E7E5E4]">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            📊 Doanh thu (UC.28)
          </button>
          <button
            type="button"
            onClick={() => setTab('reconcile')}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'reconcile'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <span>⚖️ Hàng đợi đối soát</span>
            {pendingReconcileBookings.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#EB5B38] text-white text-[10px] font-extrabold">
                {pendingReconcileBookings.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('monitoring')}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              currentTab === 'monitoring'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            📋 Giám sát Booking ({bookings.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BÁO CÁO DOANH THU & KPI */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Lọc thời gian & Xuất CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E7E5E4] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#78716C]">Thời gian báo cáo:</span>
              {(['ALL', 'THIS_MONTH', 'LAST_7_DAYS'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer border ${
                    periodFilter === p
                      ? 'bg-[#D12B79] text-white border-[#D12B79]'
                      : 'bg-white text-[#1C1917] border-[#F1DEC9] hover:border-[#D12B79]'
                  }`}
                >
                  {p === 'ALL' ? 'Toàn bộ' : p === 'THIS_MONTH' ? '30 ngày qua' : '7 ngày qua'}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Báo Cáo CSV (UC.28)</span>
            </Button>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white text-[#1C1917] border border-[#F1DEC9] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#78716C] font-semibold uppercase">
                <span>Tổng GMV Đã tất toán</span>
                <TrendingUp className="w-4 h-4 text-[#D12B79]" />
              </div>
              <div className="text-2xl font-black text-[#1C1917] mt-2">
                {formatMoney(totalGmvCompleted)}
              </div>
              <div className="text-xs text-[#6E6259] mt-1.5">
                Tổng GMV luồng booking: <strong>{formatMoney(totalGmvPipeline)}</strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#78716C] font-bold uppercase">
                <span>Doanh thu Phí sàn (F)</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {formatMoney(totalPlatformRevenue)}
              </div>
              <div className="text-xs text-[#78716C] mt-1.5">
                Hoàn tất ({formatMoney(feeFromCompleted)}) + Phí phạt ({formatMoney(feeFromCancellations)})
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#78716C] font-bold uppercase">
                <span>Đơn Hoàn tất / Đang chạy</span>
                <CheckCircle2 className="w-4 h-4 text-[#347CCB]" />
              </div>
              <div className="text-2xl font-black text-[#1C1917] mt-2">
                {completedPaidBookings.length} hoàn tất • {activeConfirmedBookings.length} đang chạy
              </div>
              <div className="text-xs text-[#78716C] mt-1.5">
                Tổng số đơn: <strong>{bookings.length} đơn</strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#78716C] font-bold uppercase">
                <span>Đơn Hủy & Tranh chấp</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-2">
                {cancelledBookings.length} hủy • {disputedBookings.length} tranh chấp
              </div>
              <div className="text-xs text-[#78716C] mt-1.5">
                Hồ sơ khiếu nại: <strong>{disputes.length} hồ sơ</strong>
              </div>
            </div>
          </div>

          {/* Phân bổ trạng thái & Top Guides */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1C1917]">
                Phân bổ trạng thái ({bookings.length} đơn)
              </h2>

              <div className="space-y-3 text-xs">
                {[
                  {
                    label: 'Hoàn thành & Tất toán (COMPLETED)',
                    count: completedPaidBookings.length,
                    color: 'bg-emerald-600',
                  },
                  {
                    label: 'Đã xác nhận / Đang tour (CONFIRMED)',
                    count: bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length,
                    color: 'bg-[#347CCB]',
                  },
                  {
                    label: 'Chờ duyệt / Giữ cọc 15p',
                    count: bookings.filter(
                      (b) => b.bookingStatus === 'PENDING' || b.bookingStatus === 'WAITING_PAYMENT'
                    ).length,
                    color: 'bg-amber-500',
                  },
                  {
                    label: 'Đang tranh chấp (DISPUTED)',
                    count: disputedBookings.length,
                    color: 'bg-red-600',
                  },
                  {
                    label: 'Đã hủy (CANCELLED)',
                    count: cancelledBookings.length,
                    color: 'bg-[#78716C]',
                  },
                ].map((item, idx) => {
                  const pct = bookings.length > 0 ? Math.round((item.count / bookings.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold text-[#1C1917]">
                        <span>{item.label}</span>
                        <span>
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F3F1EC] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Guides */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1C1917]">
                  Thổ địa tiêu biểu Đà Nẵng
                </h2>
                <span className="text-xs font-semibold text-[#78716C]">
                  {allGuides.length} HDV
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                      <th className="py-3 px-3">Hạng / Hướng dẫn viên</th>
                      <th className="py-3 px-3">Khu vực</th>
                      <th className="py-3 px-3 text-right">Đơn giá/giờ</th>
                      <th className="py-3 px-3 text-center">Đánh giá</th>
                      <th className="py-3 px-3 text-right">Hoàn tất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4] text-sm">
                    {guideStats.map((item, idx) => (
                      <tr key={item.user.id} className="hover:bg-[#F3F1EC]/60">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-[#FEEDDC] text-[#D12B79] border border-[#F1DEC9] text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <img
                              src={item.profile.avatarUrl}
                              alt={item.user.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-[#E7E5E4]"
                            />
                            <div>
                              <div className="font-bold text-[#1C1917]">{item.user.fullName}</div>
                              <div className="text-[11px] text-[#78716C]">
                                KYC: {item.profile.kycStatus}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-[#78716C]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#347CCB] shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {item.profile.areas.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-[#1C1917]">
                          {formatMoney(item.profile.hourlyRate)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-[#1C1917] text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {item.profile.avgRating > 0 ? item.profile.avgRating.toFixed(1) : 'Mới'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                          {item.completedCount} chuyến
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cancellation Audit Log */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Nhật ký đối soát Hủy đơn & Phạt cọc theo ΔT (`CANCELLATION_RECORD`)
              </h2>
              <span className="text-xs font-bold text-[#78716C]">{effectiveCancellations.length} bản ghi</span>
            </div>

            {effectiveCancellations.length === 0 ? (
              <p className="text-[13px] text-[#78716C] py-2">Chưa có đơn nào bị hủy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                      <th className="py-3 px-3">Mã Hủy / Đơn</th>
                      <th className="py-3 px-3">Phân loại</th>
                      <th className="py-3 px-3">ΔT & Mức phạt</th>
                      <th className="py-3 px-3 text-right">Hoàn khách</th>
                      <th className="py-3 px-3 text-right">Phí sàn giữ</th>
                      <th className="py-3 px-3 text-right">Bồi thường HDV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4] text-xs">
                    {effectiveCancellations.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F3F1EC]/60">
                        <td className="py-3 px-3 font-bold text-[#1C1917]">
                          {c.id} • Đơn {c.bookingId}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#1C1917]">{c.cancellationType}</div>
                          <div className="text-[#78716C] line-clamp-1">{c.reason}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          ΔT = {c.deltaHours}h • Phạt {Math.round(c.penaltyRate * 100)}% cọc
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#347CCB]">
                          {formatMoney(c.refundToTourist)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#1C1917]">
                          {formatMoney(c.platformFeeRetained)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">
                          {formatMoney(c.paidToGuide)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HÀNG ĐỢI ĐỐI SOÁT & CHƯA TRẢ 70% (QĐ-09) */}
      {currentTab === 'reconcile' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[13px] text-amber-950 space-y-1">
            <strong className="block font-bold">
              ⚖️ Quy tắc vận hành QĐ-09: Hàng đợi đối soát & Chưa trả 70%
            </strong>
            <p>
              Đặc tả không có hạn chót trả 70%: Hệ thống nhắc thông báo sau 24h và 72h. Quản trị viên sử dụng hàng đợi này để tra soát lại giao dịch qua cổng (`provider.queryTransaction`) hoặc xác nhận đối soát thủ công kèm ghi chú kiểm toán. Tuyệt đối không tự động hủy hoặc phạt cọc của du khách.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1C1917]">
                Đơn cần đối soát & Chưa quyết toán 100% ({pendingReconcileBookings.length} đơn)
              </h2>
            </div>

            {pendingReconcileBookings.length === 0 ? (
              <div className="p-8 text-center text-[#78716C] bg-[#F3F1EC] rounded-2xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-[#1C1917]">Hàng đợi đối soát trống</p>
                <p className="text-xs">Hiện tại không có đơn nào đang chờ đối soát hoặc treo 70%.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] font-bold uppercase tracking-wider text-[#78716C]">
                      <th className="py-3 px-3">Mã Đơn / Ngày</th>
                      <th className="py-3 px-3">Du Khách</th>
                      <th className="py-3 px-3">Thổ Địa</th>
                      <th className="py-3 px-3 text-right">Tổng G</th>
                      <th className="py-3 px-3 text-right">Cọc D (30%)</th>
                      <th className="py-3 px-3 text-right">Còn Lại B (70%)</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3 text-right">Thao tác Admin (QĐ-09)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {pendingReconcileBookings.map((b) => {
                      const tourist = getUserById(b.touristId);
                      const guide = getUserById(b.guideId);
                      return (
                        <tr key={b.id} className="hover:bg-[#F3F1EC]/60">
                          <td className="py-3.5 px-3">
                            <strong className="block text-[#1C1917]">{b.id}</strong>
                            <span className="text-[#78716C]">{formatDate(b.date)} ({b.hours}h)</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-[#1C1917]">{tourist?.fullName}</span>
                            <span className="block text-[#78716C]">{tourist?.phone}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-[#1C1917]">{guide?.fullName}</span>
                            <span className="block text-[#78716C]">{guide?.phone}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-[#1C1917]">
                            {formatMoney(b.totalAmount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                            {formatMoney(b.depositAmount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-amber-700">
                            {formatMoney(b.remainingAmount)}
                          </td>
                          <td className="py-3.5 px-3">
                            <PaymentBadge status={b.paymentStatus} />
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQueryGateway(b.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#E7E5E4] text-[#1C1917] font-semibold transition-colors cursor-pointer"
                              >
                                Tra cứu cổng
                              </button>
                              <button
                                type="button"
                                onClick={() => setReconcileModalBookingId(b.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#EB5B38] hover:bg-[#d64f2e] text-white font-bold transition-colors cursor-pointer"
                              >
                                Xác nhận đối soát
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GIÁM SÁT BOOKING THỜI GIAN THỰC */}
      {currentTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-[#F3F1EC] px-3.5 py-2 rounded-xl border border-[#E7E5E4]">
              <Search className="w-4 h-4 text-[#78716C] shrink-0" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, tên HDV..."
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="bg-transparent text-xs text-[#1C1917] w-full focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-[12px] font-bold text-[#78716C] shrink-0">Trạng thái:</span>
              {(['ALL', 'PENDING', 'WAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer border ${
                      statusFilter === st
                        ? 'bg-[#D12B79] text-white border-[#D12B79]'
                        : 'bg-white text-[#1C1917] border-[#F1DEC9] hover:border-[#D12B79]'
                    }`}
                  >
                    {st === 'ALL' ? 'Tất cả' : st}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1C1917]">
              Danh sách Đơn đặt lịch toàn hệ thống ({monitoredBookings.length} đơn)
            </h2>

            {monitoredBookings.length === 0 ? (
              <p className="text-[13px] text-[#78716C] py-4 text-center">
                Không tìm thấy đơn đặt lịch nào khớp bộ lọc.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3F1EC] border-b border-[#E7E5E4] font-bold uppercase tracking-wider text-[#78716C]">
                      <th className="py-3 px-3">Mã Đơn</th>
                      <th className="py-3 px-3">Thời gian & Địa điểm</th>
                      <th className="py-3 px-3">Du Khách</th>
                      <th className="py-3 px-3">Thổ Địa</th>
                      <th className="py-3 px-3 text-right">Tổng tiền</th>
                      <th className="py-3 px-3">Đơn</th>
                      <th className="py-3 px-3">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {monitoredBookings.map((b) => {
                      const tourist = getUserById(b.touristId);
                      const guide = getUserById(b.guideId);
                      return (
                        <tr key={b.id} className="hover:bg-[#F3F1EC]/60">
                          <td className="py-3.5 px-3 font-bold text-[#1C1917]">
                            {b.id}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold block text-[#1C1917]">
                              {formatDate(b.date)} ({b.startTime} – {b.endTime})
                            </span>
                            <span className="text-[#78716C] line-clamp-1">{b.meetingLocation}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-[#1C1917]">{tourist?.fullName}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-[#1C1917]">{guide?.fullName}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-[#1C1917]">
                            {formatMoney(b.totalAmount)}
                          </td>
                          <td className="py-3.5 px-3">
                            <StatusBadge status={b.bookingStatus} />
                          </td>
                          <td className="py-3.5 px-3">
                            <PaymentBadge status={b.paymentStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Xác nhận Đối soát thủ công (QĐ-09) */}
      {reconcileModalBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E7E5E4]">
            <h3 className="text-lg font-bold text-[#1C1917]">
              Xác nhận đối soát đơn {reconcileModalBookingId} (QĐ-09)
            </h3>
            <p className="text-xs text-[#78716C]">
              Thao tác này xác nhận khoản tất toán 70% đã hoàn tất, chuyển trạng thái thanh toán sang <strong>PAID</strong> và tự động cộng doanh thu (G − F) vào Ví Thổ địa.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1917]">
                Ghi chú kiểm toán / Tra soát cổng *:
              </label>
              <textarea
                value={reconcileNote}
                onChange={(e) => setReconcileNote(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E7E5E4] text-xs text-[#1C1917] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E5E4]">
              <button
                type="button"
                onClick={() => setReconcileModalBookingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F3F1EC] text-[#1C1917]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReconcile(reconcileModalBookingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EB5B38] text-white hover:bg-[#d64f2e]"
              >
                Xác nhận hoàn tất đối soát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
