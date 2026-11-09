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

  const userNotifs = notifications.filter(
    (n) => !currentUser || n.userId === currentUser.id
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            UC.05 • Thông báo thời gian thực
          </span>
          <h1 className="text-[26px] font-extrabold text-white mt-1">
            Trung tâm thông báo ({userNotifs.length})
          </h1>
          <p className="text-[13px] text-[#F6E6EA]/85 mt-1">
            Cập nhật trạng thái đặt lịch, hạn giữ chỗ 15 phút, đối soát ví và kết quả thẩm định
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
              className={`p-5 rounded-[14px] border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-[#E4C3CC] text-[#52526B]'
                  : 'bg-[#FBF4F6] border-[#1EC1CB] text-[#1C1C28] shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F6E6EA] text-[#1A0A0F] flex items-center justify-center text-lg shrink-0">
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
                  <h3 className="text-[15px] font-extrabold text-[#1A0A0F]">
                    {n.title || 'Thông báo hệ thống'}
                  </h3>
                  <p className="text-[14px] leading-relaxed">{n.content}</p>
                  <span className="text-[12px] text-[#52526B] block pt-1">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1EC1CB] text-[#1C1C28] text-[11px] font-extrabold shrink-0">
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
