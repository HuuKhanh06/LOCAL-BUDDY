// pages/tourist/MyBookingsPage.tsx
// Danh sách đơn đặt lịch của Du khách (Đủ 4 trạng thái: Đang tải, Rỗng, Lỗi, Thành công)

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingContext } from '../../context/BookingContext';
import { BookingCard } from '../../components/common/BookingCard';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/GuideCard';
import { Button } from '../../components/ui/Button';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, currentUser, getGuideById } = useBookingContext();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewStatus, setViewStatus] = useState<'ready' | 'loading' | 'error'>('ready');

  // Phân quyền dữ liệu: Du khách chỉ thấy các đơn do chính mình đặt (b.touristId === currentUser.id)
  const userBookings = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'tourist') {
      return bookings.filter((b) => b.touristId === currentUser.id);
    }
    if (currentUser.role === 'guide') {
      return bookings.filter((b) => b.guideId === currentUser.id);
    }
    return bookings; // Admin có quyền giám sát toàn bộ
  }, [bookings, currentUser]);

  const tabs = [
    { id: 'all', label: 'Tất cả đơn', badge: userBookings.length },
    {
      id: 'PENDING',
      label: 'Chờ HDV phản hồi',
      badge: userBookings.filter((b) => b.bookingStatus === 'PENDING').length || undefined,
    },
    {
      id: 'WAITING_PAYMENT',
      label: 'Chờ đặt cọc 30%',
      badge: userBookings.filter((b) => b.bookingStatus === 'WAITING_PAYMENT').length || undefined,
    },
    {
      id: 'CONFIRMED',
      label: 'Đã xác nhận lịch',
      badge: userBookings.filter((b) => b.bookingStatus === 'CONFIRMED').length || undefined,
    },
    {
      id: 'COMPLETED',
      label: 'Đã hoàn thành',
      badge: userBookings.filter((b) => b.bookingStatus === 'COMPLETED').length || undefined,
    },
    {
      id: 'CANCELLED_DISPUTED',
      label: 'Đã hủy / Khiếu nại',
      badge:
        userBookings.filter(
          (b) => b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'DISPUTED'
        ).length || undefined,
    },
  ];

  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') return userBookings;
    if (activeTab === 'CANCELLED_DISPUTED') {
      return userBookings.filter(
        (b) => b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'DISPUTED'
      );
    }
    return userBookings.filter((b) => b.bookingStatus === activeTab);
  }, [userBookings, activeTab]);

  if (!currentUser) {
    return (
      <div className="py-12 max-w-xl mx-auto px-4 text-center">
        <EmptyState
          title="Vui lòng đăng nhập tài khoản Du khách"
          description="Đăng nhập để xem và quản lý danh sách các chuyến đi do chính bạn đặt tại Đà Nẵng."
          actionText="Đăng nhập ngay"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="bg-[#1C1C28] text-white rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1EC1CB]">
            Quản lý hành trình Đà Nẵng
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1">
            Đơn đặt lịch của tôi
          </h1>
          <p className="text-[14px] text-[#F6E6EA]/85 mt-1">
            Theo dõi thời hạn giữ chỗ 15 phút, thanh toán cọc 30%, xác nhận hoàn thành và tất toán 70%
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-[12px] text-[12px] self-start">
          <span className="px-2 text-[#F6E6EA]/80 font-semibold">Trạng thái UI:</span>
          {(['ready', 'loading', 'error'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setViewStatus(st)}
              className={`px-2.5 py-1 rounded-[8px] font-bold cursor-pointer ${
                viewStatus === st
                  ? 'bg-[#1EC1CB] text-[#1C1C28]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {st === 'ready' ? 'Thành công' : st === 'loading' ? 'Đang tải' : 'Lỗi'}
            </button>
          ))}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {viewStatus === 'error' ? (
        <ErrorState
          message="Không thể tải danh sách đơn đặt lịch từ máy chủ."
          onRetry={() => setViewStatus('ready')}
        />
      ) : viewStatus === 'loading' ? (
        <LoadingState message="Đang đồng bộ danh sách đơn đặt lịch của bạn..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="Chưa có đơn đặt lịch nào trong mục này"
          description="Hãy khám phá các Hướng dẫn viên bản địa tại Đà Nẵng và chọn một khung giờ phù hợp với lịch trình của bạn!"
          actionText="Khám phá HDV Đà Nẵng ngay →"
          onAction={() => navigate('/guides')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBookings.map((b) => {
            const guide = getGuideById(b.guideId);

            let quickAction: React.ReactNode = undefined;
            if (b.bookingStatus === 'WAITING_PAYMENT') {
              quickAction = (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/don/${b.id}/dat-coc`)}
                >
                  💳 Đặt cọc 30% ngay
                </Button>
              );
            } else if (
              b.bookingStatus === 'CONFIRMED' &&
              b.guideRequestedCompletion
            ) {
              quickAction = (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/don/${b.id}`)}
                >
                  ✓ Xác nhận hoàn thành / Khiếu nại
                </Button>
              );
            } else if (
              b.bookingStatus === 'COMPLETED' &&
              b.paymentStatus === 'WAITING_FINAL'
            ) {
              quickAction = (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/don/${b.id}/thanh-toan-70`)}
                >
                  💳 Tất toán 70% còn lại
                </Button>
              );
            } else {
              quickAction = (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/don/${b.id}`)}
                >
                  Xem chi tiết →
                </Button>
              );
            }

            return (
              <BookingCard
                key={b.id}
                booking={b}
                guideName={guide?.user.fullName}
                guideAvatar={guide?.profile.avatarUrl}
                onClick={() => navigate(`/don/${b.id}`)}
                actionButton={quickAction}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
