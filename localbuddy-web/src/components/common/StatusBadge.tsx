// components/common/StatusBadge.tsx
// Chuẩn thiết kế [10]: Trạng thái luôn có icon + chữ, không chỉ màu.
// Huy hiệu: PENDING warning · WAITING_PAYMENT accent · CONFIRMED blue · COMPLETED success · DISPUTED warning + icon cảnh báo · CANCELLED muted.

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
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-warning)]',
      border: 'border-[var(--lb-warning)]',
      icon: '⏳',
    },
    WAITING_PAYMENT: {
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-accent-text)]',
      border: 'border-[var(--lb-accent)]',
      icon: '⏱',
    },
    CONFIRMED: {
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-blue-text)]',
      border: 'border-[var(--lb-blue)]',
      icon: '✓',
    },
    COMPLETED: {
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-success)]',
      border: 'border-[var(--lb-success)]',
      icon: '✓✓',
    },
    DISPUTED: {
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-warning)]',
      border: 'border-[var(--lb-warning)]',
      icon: '⚠️',
    },
    CANCELLED: {
      bg: 'bg-[var(--lb-surface-2)]',
      text: 'text-[var(--lb-muted)]',
      border: 'border-[var(--lb-border)]',
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
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-[var(--lb-surface-2)] border-[var(--lb-border)] text-[var(--lb-muted)]',
        className
      )}
    >
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  );
};
