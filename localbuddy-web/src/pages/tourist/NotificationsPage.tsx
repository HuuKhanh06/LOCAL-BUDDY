// pages/tourist/NotificationsPage.tsx (UC.05: Trung tâm thông báo hệ thống)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/GuideCard';
import { formatDateTime } from '../../utils/time';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useBookingContext();

  const isMatchUser = (n: { userId?: string; type?: string }) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') {
      return n.userId === currentUser.id || n.userId === 'u-admin-1' || n.type === 'BOOKING';
    }
    return n.userId === currentUser.id;
  };

  const userNotifs = notifications.filter(isMatchUser);
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="bg-white border border-[#EAD7C2] rounded-[20px] p-6 flex items-center justify-between flex-wrap gap-4 shadow-xs">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#D12B79]">
            Hệ thống thông báo thời gian thực
          </span>
          <h1 className="text-[24px] sm:text-[26px] font-extrabold text-[#1C1917] mt-1">
            Trung tâm thông báo ({userNotifs.length})
          </h1>
          <p className="text-[13px] text-[#6E6259] mt-1">
            Cập nhật trạng thái đặt lịch, hạn phản hồi 24h, giữ chỗ 15 phút và biến động ví
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => markAllNotificationsAsRead()}
          >
            ✓ Đánh dấu đã đọc tất cả ({unreadCount})
          </Button>
        )}
      </div>

      {userNotifs.length === 0 ? (
        <EmptyState
          title="Bạn chưa có thông báo mới"
          description="Mọi biến động về đơn đặt lịch, tin nhắn và thanh toán sẽ xuất hiện tại đây."
          actionText="Khám phá Hướng dẫn viên Đà Nẵng"
          onAction={() => navigate('/guides')}
        />
      ) : (
        <div className="space-y-3">
          {userNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                if (n.actionUrl) navigate(n.actionUrl);
                else if (n.bookingId) navigate(`/don/${n.bookingId}`);
              }}
              className={`p-5 rounded-[16px] border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-[#EAD7C2] text-[#4B4540] hover:border-[#D12B79]/40'
                  : 'bg-[#FFF9F3] border-[#D12B79]/40 text-[#1C1917] shadow-xs hover:border-[#D12B79]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FEEDDC] text-[#1C1917] flex items-center justify-center text-lg shrink-0">
                  {n.type === 'PAYMENT'
                    ? '💳'
                    : n.type === 'DISPUTE'
                    ? '⚖️'
                    : n.type === 'WALLET'
                    ? '💰'
                    : n.type === 'KYC'
                    ? '🪪'
                    : '🔔'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-[15px] font-bold text-[#1C1917]">
                    {n.title || 'Thông báo hệ thống'}
                  </h3>
                  <p className="text-[14px] text-[#4B4540] leading-relaxed">{n.content}</p>
                  <span className="text-[12px] text-[#78716C] block pt-1">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#D12B79] text-white text-[11px] font-bold shrink-0">
                  Mới
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
