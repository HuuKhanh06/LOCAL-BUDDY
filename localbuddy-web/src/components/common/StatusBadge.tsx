// components/common/StatusBadge.tsx & PaymentBadge.tsx
// Phối màu ngữ nghĩa hài hòa với Burgundy (#1A0A0F), Blush (#F6E6EA), Navy (#1C1C28), Cyan (#1EC1CB)

import React from 'react';
import { clsx } from 'clsx';
import { BookingStatus, PaymentStatus } from '../../types';
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/statusLabels';

export const StatusBadge: React.FC<{ status: BookingStatus; className?: string }> = ({
  status,
  className,
}) => {
  const config: Record<BookingStatus, { bg: string; text: string; border: string; icon: string }> = {
    PENDING: {
      bg: 'bg-[#FEF1DC]',
      text: 'text-[#8C4A08]',
      border: 'border-[#F8CA84]',
      icon: '⏳',
    },
    WAITING_PAYMENT: {
      bg: 'bg-[#FEF1DC]',
      text: 'text-[#8C4A08]',
      border: 'border-[#F8CA84]',
      icon: '⏱',
    },
    CONFIRMED: {
      bg: 'bg-[#1EC1CB]',
      text: 'text-[#1C1C28]', // Chữ navy trên nền cyan!
      border: 'border-[#18A7B0]',
      icon: '✓',
    },
    COMPLETED: {
      bg: 'bg-[#E3F7EF]',
      text: 'text-[#0F6E4B]',
      border: 'border-[#99E2C4]',
      icon: '✓✓',
    },
    DISPUTED: {
      bg: 'bg-[#FCE8EB]',
      text: 'text-[#A61B2B]',
      border: 'border-[#F5B2BA]',
      icon: '⚠️',
    },
    CANCELLED: {
      bg: 'bg-[#F6E6EA]',
      text: 'text-[#1A0A0F]',
      border: 'border-[#E4C3CC]',
      icon: '✕',
    },
  };

  const item = config[status] || config.PENDING;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border tracking-wide',
        item.bg,
        item.text,
        item.border,
        className
      )}
    >
      <span>{item.icon}</span>
      <span>{BOOKING_STATUS_LABELS[status] || status}</span>
    </span>
  );
};

export const PaymentBadge: React.FC<{ status: PaymentStatus; className?: string }> = ({
  status,
  className,
}) => {
  const config: Record<PaymentStatus, { border: string; text: string; bg: string }> = {
    UNPAID: {
      border: 'border-[#E4C3CC]',
      text: 'text-[#52526B]',
      bg: 'bg-white',
    },
    WAITING_DEPOSIT: {
      border: 'border-[#F8CA84]',
      text: 'text-[#8C4A08]',
      bg: 'bg-[#FEF1DC]/40',
    },
    DEPOSITED: {
      border: 'border-[#1EC1CB]',
      text: 'text-[#1C1C28]',
      bg: 'bg-[#E5F8F9]',
    },
    WAITING_FINAL: {
      border: 'border-[#F8CA84]',
      text: 'text-[#8C4A08]',
      bg: 'bg-[#FEF1DC]/40',
    },
    PAID: {
      border: 'border-[#99E2C4]',
      text: 'text-[#0F6E4B]',
      bg: 'bg-[#E3F7EF]',
    },
    WAITING_REFUND: {
      border: 'border-[#F8CA84]',
      text: 'text-[#8C4A08]',
      bg: 'bg-[#FEF1DC]/40',
    },
    REFUNDED: {
      border: 'border-[#E4C3CC]',
      text: 'text-[#1A0A0F]',
      bg: 'bg-[#F6E6EA]',
    },
    WAITING_RECONCILE: {
      border: 'border-[#F8CA84]',
      text: 'text-[#8C4A08]',
      bg: 'bg-[#FEF1DC]',
    },
  };

  const item = config[status] || config.UNPAID;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border',
        item.bg,
        item.border,
        item.text,
        className
      )}
    >
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  );
};
