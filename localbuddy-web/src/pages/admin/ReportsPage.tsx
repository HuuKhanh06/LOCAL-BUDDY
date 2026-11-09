import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Award,
  MapPin,
  Download,
} from 'lucide-react';
import { useBookingContext } from '../../context/BookingContext';
import { formatMoney } from '../../utils/money';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const ReportsPage: React.FC = () => {
  const { bookings, allGuides, cancellations, disputes, feeRate, getUserById } =
    useBookingContext();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_7_DAYS'>('ALL');
  const [referenceNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

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
    const dateStamp = '2026-11-08';
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

  // GMV from completed + confirmed bookings
  const totalGmvCompleted = completedPaidBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalGmvPipeline = filteredBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Platform Fee Revenue from completed bookings + retained cancellation/dispute fees
  const feeFromCompleted = completedPaidBookings.reduce(
    (sum, b) => sum + Math.round(b.totalAmount * b.feeRate),
    0
  );
  const feeFromCancellations = cancellations.reduce(
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-[12px] border border-[#E8CED5]" />
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
            <BarChart3 className="w-3.5 h-3.5" /> Báo cáo Thống kê Vận hành • UC.28
          </span>
          <h1 className="text-2xl font-extrabold text-[#1A0A0F]">
            Thống kê Doanh thu GMV & Hiệu suất Đà Nẵng
          </h1>
          <p className="text-sm text-[#525266] mt-0.5">
            Tổng hợp giá trị giao dịch (GMV), doanh thu phí nền tảng ({Math.round(feeRate * 100)}%), tỷ lệ hoàn thành và bảng xếp hạng Hướng dẫn viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex bg-white border border-[#E8CED5] rounded-[12px] p-1">
            {[
              { id: 'ALL' as const, label: 'Tất cả' },
              { id: 'THIS_MONTH' as const, label: '30 ngày qua' },
              { id: 'LAST_7_DAYS' as const, label: '7 ngày qua' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === tab.id
                    ? 'bg-[#1EC1CB] text-[#1C1C28]'
                    : 'text-[#525266] hover:text-[#1A0A0F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Xuất báo cáo đối soát (.CSV)
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1C1C28] text-white rounded-[12px] p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-[#F6E6EA]/75 font-semibold uppercase">
            <span>Tổng GMV Đã tất toán</span>
            <TrendingUp className="w-4 h-4 text-[#1EC1CB]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1EC1CB] mt-2">
            {formatMoney(totalGmvCompleted)}
          </div>
          <div className="text-xs text-[#F6E6EA]/70 mt-1.5">
            Tổng GMV bao gồm đơn đang chạy: <strong>{formatMoney(totalGmvPipeline)}</strong>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#525266] font-bold uppercase">
            <span>Doanh thu Phí nền tảng (F)</span>
            <Award className="w-4 h-4 text-[#1B8A5A]" />
          </div>
          <div className="text-2xl font-extrabold text-[#146C43] mt-2">
            {formatMoney(totalPlatformRevenue)}
          </div>
          <div className="text-xs text-[#525266] mt-1.5">
            Từ đơn hoàn tất ({formatMoney(feeFromCompleted)}) + Phí phạt hủy ({formatMoney(feeFromCancellations)})
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#525266] font-bold uppercase">
            <span>Đơn Hoàn thành / Đang chạy</span>
            <CheckCircle2 className="w-4 h-4 text-[#118B93]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A0A0F] mt-2">
            {completedPaidBookings.length} hoàn tất • {activeConfirmedBookings.length} đang chạy
          </div>
          <div className="text-xs text-[#525266] mt-1.5">
            Tổng số đơn trên hệ thống: <strong>{bookings.length} đơn</strong>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#525266] font-bold uppercase">
            <span>Đơn Hủy & Tranh chấp</span>
            <AlertTriangle className="w-4 h-4 text-[#D9820B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#A62626] mt-2">
            {cancelledBookings.length} hủy • {disputedBookings.length} tranh chấp
          </div>
          <div className="text-xs text-[#525266] mt-1.5">
            Tổng hồ sơ khiếu nại đã ghi nhận: <strong>{disputes.length} hồ sơ</strong>
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar + Top Guides Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-[#1A0A0F]">
            Phân bổ trạng thái Đơn đặt lịch ({bookings.length} đơn)
          </h2>

          <div className="space-y-3 text-xs">
            {[
              {
                label: 'Đã hoàn thành & Tất toán (COMPLETED)',
                count: completedPaidBookings.length,
                color: 'bg-[#1B8A5A]',
              },
              {
                label: 'Đã xác nhận / Đang phục vụ (CONFIRMED)',
                count: bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length,
                color: 'bg-[#1EC1CB]',
              },
              {
                label: 'Chờ HDV duyệt / Chờ đặt cọc 15p',
                count: bookings.filter(
                  (b) => b.bookingStatus === 'PENDING' || b.bookingStatus === 'WAITING_PAYMENT'
                ).length,
                color: 'bg-[#D9820B]',
              },
              {
                label: 'Đang tranh chấp đóng băng (DISPUTED)',
                count: disputedBookings.length,
                color: 'bg-[#C93B3B]',
              },
              {
                label: 'Đã hủy (CANCELLED)',
                count: cancelledBookings.length,
                color: 'bg-[#6E7085]',
              },
            ].map((item, idx) => {
              const pct = bookings.length > 0 ? Math.round((item.count / bookings.length) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-bold text-[#1C1C28]">
                    <span>{item.label}</span>
                    <span>
                      {item.count} đơn ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4F5F8] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E8CED5] text-xs text-[#525266] space-y-1">
            <div className="font-bold text-[#1A0A0F]">Điểm nóng du lịch Đà Nẵng:</div>
            <p>
              Phố cổ Hội An, Bán đảo Sơn Trà, Cầu Rồng và Bà Nà Hills chiếm hơn 82% tổng số giờ đặt lịch theo giờ trên LocalBuddy.
            </p>
          </div>
        </div>

        {/* Top Guides Table */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1A0A0F]">
              Bảng xếp hạng Hướng dẫn viên tiêu biểu tại Đà Nẵng
            </h2>
            <span className="text-xs font-semibold text-[#525266]">
              Tổng số: {allGuides.length} HDV
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                  <th className="py-3 px-3">Hạng / Hướng dẫn viên</th>
                  <th className="py-3 px-3">Khu vực chính</th>
                  <th className="py-3 px-3 text-right">Đơn giá / giờ</th>
                  <th className="py-3 px-3 text-center">Đánh giá</th>
                  <th className="py-3 px-3 text-right">Số chuyến hoàn tất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CED5] text-sm">
                {guideStats.map((item, idx) => (
                  <tr key={item.user.id} className="hover:bg-[#FDF7F9]/60">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#F6E6EA] text-[#1A0A0F] text-xs font-extrabold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <img
                          src={item.profile.avatarUrl}
                          alt={item.user.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-[#E8CED5]"
                        />
                        <div>
                          <div className="font-extrabold text-[#1A0A0F]">{item.user.fullName}</div>
                          <div className="text-[11px] text-[#525266]">
                            KYC: {item.profile.kycStatus}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-[#525266]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#118B93] shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {item.profile.areas.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#1C1C28]">
                      {formatMoney(item.profile.hourlyRate)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#1A0A0F] text-xs">
                        <Star className="w-3.5 h-3.5 fill-[#D9820B] text-[#D9820B]" />
                        {item.profile.avgRating > 0 ? item.profile.avgRating.toFixed(1) : 'Mới'} (
                        {item.profile.totalReviews})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-[#146C43]">
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
      <div className="bg-white rounded-[12px] border border-[#E8CED5] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1A0A0F] flex items-center gap-2">
            <XCircle className="w-5 h-5 text-[#C93B3B]" /> Nhật ký đối soát Hủy đơn & Phạt cọc theo ΔT (`CANCELLATION_RECORD`)
          </h2>
          <span className="text-xs font-bold text-[#525266]">{cancellations.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDF7F9] border-b border-[#E8CED5] text-[11px] font-bold uppercase tracking-wider text-[#525266]">
                <th className="py-3 px-3">Mã Hủy / Đơn</th>
                <th className="py-3 px-3">Phân loại hủy</th>
                <th className="py-3 px-3">Độ trễ ΔT & Mức phạt</th>
                <th className="py-3 px-3 text-right">Hoàn khách</th>
                <th className="py-3 px-3 text-right">Phí sàn giữ</th>
                <th className="py-3 px-3 text-right">Bồi thường HDV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8CED5] text-xs">
              {cancellations.map((c) => (
                <tr key={c.id} className="hover:bg-[#FDF7F9]/60">
                  <td className="py-3 px-3 font-bold text-[#1C1C28]">
                    {c.id} • Đơn {c.bookingId}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#1A0A0F]">{c.cancellationType}</div>
                    <div className="text-[#525266] line-clamp-1">{c.reason}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    ΔT = {c.deltaHours}h • Phạt {Math.round(c.penaltyRate * 100)}% cọc
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#118B93]">
                    {formatMoney(c.refundToTourist)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1A0A0F]">
                    {formatMoney(c.platformFeeRetained)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#146C43]">
                    {formatMoney(c.paidToGuide)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
