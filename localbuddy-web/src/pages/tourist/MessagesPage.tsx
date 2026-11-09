// pages/tourist/MessagesPage.tsx (UC.15, UC.16: Nhắn tin trao đổi 2 chiều giữa Du khách và Hướng dẫn viên)
// Đính kèm ngữ cảnh đơn đặt lịch ngay trên đầu khung hội thoại (NB-12, ShowAround style)

import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateTime, formatTimeRange } from '../../utils/time';
import { formatMoney } from '../../utils/money';

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    currentUser,
    allUsers,
    allGuides,
    messages,
    bookings,
    sendMessage,
  } = useBookingContext();

  const activeUserId = currentUser?.id || 'u-tourist-1';
  const initialPartnerId =
    searchParams.get('partner') ||
    (currentUser?.role === 'guide' ? 'u-tourist-1' : 'u-guide-1');
  const bookingIdParam = searchParams.get('bookingId') || undefined;

  const [selectedPartnerId, setSelectedPartnerId] =
    useState<string>(initialPartnerId);
  const [draft, setDraft] = useState<string>('');

  // Danh sách đối tác trò chuyện
  const partners = useMemo(() => {
    if (currentUser?.role === 'guide') {
      return allUsers.filter((u) => u.role === 'tourist');
    }
    return allGuides.map((g) => g.user);
  }, [currentUser, allUsers, allGuides]);

  const activePartner = allUsers.find((u) => u.id === selectedPartnerId) || partners[0];

  // Các tin nhắn giữa activeUserId và activePartner
  const conversationMessages = useMemo(() => {
    if (!activePartner) return [];
    return messages.filter(
      (m) =>
        (m.senderId === activeUserId && m.receiverId === activePartner.id) ||
        (m.senderId === activePartner.id && m.receiverId === activeUserId)
    );
  }, [messages, activeUserId, activePartner]);

  // Đơn đặt lịch gần nhất giữa 2 người
  const relatedBooking = useMemo(() => {
    if (bookingIdParam) {
      const b = bookings.find((item) => item.id === bookingIdParam);
      if (b) return b;
    }
    if (!activePartner) return undefined;
    return bookings.find(
      (b) =>
        (b.touristId === activeUserId && b.guideId === activePartner.id) ||
        (b.guideId === activeUserId && b.touristId === activePartner.id)
    );
  }, [bookings, bookingIdParam, activeUserId, activePartner]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !draft.trim()) return;
    const res = sendMessage(activePartner.id, draft, relatedBooking?.id);
    if (res.ok) {
      setDraft('');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-5 py-2">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            UC.15 & UC.16 • Trao đổi lịch trình trực tiếp
          </span>
          <h1 className="text-[24px] font-extrabold text-white mt-0.5">
            Hộp thư tin nhắn Du khách & Hướng dẫn viên
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E4C3CC] rounded-[16px] overflow-hidden shadow-sm min-h-[540px]">
        {/* Danh sách hội thoại bên trái */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E4C3CC] bg-[#FBF4F6] p-4 space-y-2">
          <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#1A0A0F] px-2 pb-2">
            Danh sách liên hệ ({partners.length})
          </h3>
          {partners.map((p) => {
            const isSelected = activePartner?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPartnerId(p.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-[12px] text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1EC1CB] text-[#1C1C28] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#F6E6EA]/60 text-[#1C1C28] border border-[#E4C3CC]/60'
                }`}
              >
                <img
                  src={p.avatarUrl}
                  alt={p.fullName}
                  className="w-11 h-11 rounded-full object-cover border border-[#1C1C28]/20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="block text-[14px] font-extrabold truncate">
                    {p.fullName}
                  </span>
                  <span className="block text-[12px] opacity-80 truncate">
                    {p.role === 'guide' ? '🧭 Hướng dẫn viên Đà Nẵng' : '🧳 Du khách'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Khung chat bên phải */}
        <div className="lg:col-span-8 flex flex-col justify-between p-5">
          {activePartner ? (
            <>
              <div className="space-y-3 border-b border-[#E4C3CC] pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={activePartner.avatarUrl}
                      alt={activePartner.fullName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#1EC1CB]"
                    />
                    <div>
                      <h3 className="text-[16px] font-extrabold text-[#1A0A0F]">
                        {activePartner.fullName}
                      </h3>
                      <span className="text-[12px] text-[#0F6E4B] font-semibold">
                        ● Đang trực tuyến tại Đà Nẵng
                      </span>
                    </div>
                  </div>

                  {activePartner.role === 'guide' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/guides/${activePartner.id}`)}
                    >
                      Xem hồ sơ & Đặt lịch →
                    </Button>
                  )}
                </div>

                {/* Thẻ ngữ cảnh đơn đặt lịch đính kèm (NB-12) */}
                {relatedBooking && (
                  <div
                    onClick={() =>
                      navigate(
                        currentUser?.role === 'guide'
                          ? '/guide/don-va-ca'
                          : `/don/${relatedBooking.id}`
                      )
                    }
                    className="p-3.5 rounded-[12px] bg-[#F6E6EA]/70 border border-[#E4C3CC] flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:border-[#1EC1CB]"
                  >
                    <div className="text-[13px]">
                      <span className="font-extrabold text-[#1A0A0F]">
                        Đơn {relatedBooking.id}:
                      </span>{' '}
                      <span>
                        {formatDate(relatedBooking.date)} (
                        {formatTimeRange(
                          relatedBooking.startTime,
                          relatedBooking.endTime
                        )}
                        ) • Tổng {formatMoney(relatedBooking.totalAmount)}
                      </span>
                    </div>
                    <StatusBadge status={relatedBooking.bookingStatus} />
                  </div>
                )}
              </div>

              {/* Danh sách tin nhắn */}
              <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[340px]">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-10 text-[14px] text-[#52526B]">
                    Hãy gửi lời chào đầu tiên tới <strong>{activePartner.fullName}</strong> để trao đổi lịch trình tham quan Đà Nẵng!
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isMine = msg.senderId === activeUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-[14px] text-[14px] space-y-1 ${
                            isMine
                              ? 'bg-[#1EC1CB] text-[#1C1C28] font-medium rounded-br-xs'
                              : 'bg-[#FBF4F6] text-[#1C1C28] border border-[#E4C3CC] rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <span className="block text-[10px] opacity-70 text-right">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Khung nhập tin nhắn */}
              <form
                onSubmit={handleSend}
                className="pt-3 border-t border-[#E4C3CC] flex gap-2"
              >
                <input
                  type="text"
                  placeholder={`Nhắn tin cho ${activePartner.fullName}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 px-4 min-h-[44px] rounded-[12px] border border-[#E4C3CC] text-[14px] text-[#1C1C28] focus:outline-none focus:border-[#1EC1CB]"
                />
                <Button type="submit" variant="primary">
                  Gửi tin nhắn →
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
