// components/ui/DesignSystemControls.tsx
// Bộ thành phần dùng chung của Design System LocalBuddy Đà Nẵng:
// Select, DatePicker, TimeSlotPicker, Card, Avatar, Rating, BottomSheet, Skeleton, Tabs, Stepper, Table
// Tuân thủ nghiêm ngặt bảng màu: Burgundy (#1A0A0F), Blush (#F6E6EA), Navy (#1C1C28), Cyan (#1EC1CB - chữ luôn là Navy #1C1C28)

import React from 'react';
import { clsx } from 'clsx';
import { Modal } from './Modal';
import { TimeSlot } from '../common/GuideCard';
import { SlotStatus } from '../../types';

// ---------- 1. Select ----------
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  hint,
  id,
  className,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[14px] font-semibold text-[#1A0A0F]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full px-3.5 min-h-[44px] rounded-[12px] border text-[15px] text-[#1C1C28] bg-white transition-all cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-[#1EC1CB] focus:border-[#1EC1CB]',
          error ? 'border-[#A61B2B] bg-[#FCE8EB]/30' : 'border-[#E4C3CC]',
          'disabled:bg-[#F6E6EA]/50 disabled:text-[#52526B] disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[12px] font-medium text-[#A61B2B]">{error}</span>}
      {hint && !error && <span className="text-[12px] text-[#52526B]">{hint}</span>}
    </div>
  );
};

// ---------- 2. DatePicker ----------
export interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  error?: string;
  hint?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  error,
  hint,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[14px] font-semibold text-[#1A0A0F]">{label}</label>}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || 'Chọn ngày'}
        className={clsx(
          'w-full px-3.5 min-h-[44px] rounded-[12px] border text-[15px] text-[#1C1C28] bg-white transition-all',
          'focus:outline-none focus:ring-2 focus:ring-[#1EC1CB] focus:border-[#1EC1CB]',
          error ? 'border-[#A61B2B] bg-[#FCE8EB]/30' : 'border-[#E4C3CC]'
        )}
      />
      {error && <span className="text-[12px] font-medium text-[#A61B2B]">{error}</span>}
      {hint && !error && <span className="text-[12px] text-[#52526B]">{hint}</span>}
    </div>
  );
};

// ---------- 3. TimeSlotPicker ----------
export interface TimeSlotOption {
  id: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  holdSecondsLeft?: number;
}

export interface TimeSlotPickerProps {
  label?: string;
  slots: TimeSlotOption[];
  selectedSlotId?: string | null;
  onSelect: (slot: TimeSlotOption) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  label,
  slots,
  selectedSlotId,
  onSelect,
}) => {
  return (
    <div className="space-y-2.5">
      {label && <label className="text-[14px] font-bold text-[#1A0A0F] block">{label}</label>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {slots.map((s) => (
          <TimeSlot
            key={s.id}
            startTime={s.startTime}
            endTime={s.endTime}
            status={s.status}
            holdSecondsLeft={s.holdSecondsLeft}
            isSelected={selectedSlotId === s.id}
            onClick={() => onSelect(s)}
          />
        ))}
      </div>
    </div>
  );
};

// ---------- 4. Card ----------
export interface CardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerRight,
  children,
  footer,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-[#E4C3CC] rounded-[12px] shadow-[0_2px_10px_rgba(26,10,15,0.05)] overflow-hidden',
        className
      )}
    >
      {(title || headerRight) && (
        <div className="px-6 py-4 border-b border-[#E4C3CC] bg-[#FBF4F6] flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="text-[17px] font-extrabold text-[#1A0A0F]">{title}</h3>}
            {subtitle && <p className="text-[12px] text-[#52526B] mt-0.5">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3.5 bg-[#FBF4F6] border-t border-[#E4C3CC]">{footer}</div>
      )}
    </div>
  );
};

// ---------- 5. Avatar ----------
export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  roleBadge?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  verified = false,
  roleBadge,
}) => {
  const sizeMap = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }[size];

  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative inline-block shrink-0">
        {src ? (
          <img
            src={src}
            alt={name}
            className={clsx(
              sizeMap,
              'rounded-full object-cover border-2 border-[#1EC1CB] bg-[#F6E6EA]'
            )}
          />
        ) : (
          <div
            className={clsx(
              sizeMap,
              'rounded-full border-2 border-[#1EC1CB] bg-[#1C1C28] text-[#1EC1CB] font-extrabold flex items-center justify-center'
            )}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {verified && (
          <span
            title="Đã xác minh KYC"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1EC1CB] text-[#1C1C28] border-2 border-white flex items-center justify-center text-[10px] font-black"
          >
            ✓
          </span>
        )}
      </div>
      {roleBadge && (
        <div>
          <div className="text-[14px] font-bold text-[#1A0A0F] leading-tight">{name}</div>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#1EC1CB] text-[#1C1C28]">
            {roleBadge}
          </span>
        </div>
      )}
    </div>
  );
};

// ---------- 6. Rating ----------
export interface RatingProps {
  value: number;
  max?: number;
  onChange?: (newValue: number) => void;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  onChange,
  reviewCount,
  size = 'md',
}) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        {stars.map((s) => {
          const active = s <= Math.round(value);
          return onChange ? (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-label={`Chấm ${s} sao`}
              className={clsx(
                'rounded-[8px] font-bold transition-all cursor-pointer border',
                size === 'sm' ? 'w-7 h-7 text-sm' : size === 'lg' ? 'w-11 h-11 text-xl' : 'w-9 h-9 text-base',
                active
                  ? 'bg-[#1EC1CB] text-[#1C1C28] border-[#1C1C28]'
                  : 'bg-[#FBF4F6] text-gray-400 border-[#E4C3CC]'
              )}
            >
              ★
            </button>
          ) : (
            <span
              key={s}
              className={clsx(
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm',
                active ? 'text-[#D9820B]' : 'text-gray-300'
              )}
            >
              ★
            </span>
          );
        })}
      </div>
      <span className="text-[13px] font-extrabold text-[#1A0A0F] tabular-nums">
        {value.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-[12px] text-[#52526B]">({reviewCount} đánh giá)</span>
      )}
    </div>
  );
};

// ---------- 7. BottomSheet ----------
export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = (props) => {
  return <Modal {...props} size="md" />;
};

// ---------- 8. Skeleton ----------
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('animate-pulse bg-[#F6E6EA] rounded-[12px]', className)} />
);

// ---------- 9. Tabs ----------
export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabsProps {
  items?: TabItem[];
  tabs?: TabItem[];
  activeId?: string;
  activeTab?: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  tabs,
  activeId,
  activeTab,
  onChange,
  className,
}) => {
  const list = items || tabs || [];
  const current = activeId ?? activeTab ?? '';
  return (
    <div
      className={clsx(
        'flex flex-wrap gap-1.5 bg-white p-1.5 rounded-[12px] border border-[#E4C3CC]',
        className
      )}
    >
      {list.map((item) => {
        const isActive = item.id === current;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={clsx(
              'px-3.5 py-2 rounded-[10px] text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              isActive
                ? 'bg-[#1EC1CB] text-[#1C1C28] shadow-xs'
                : 'text-[#52526B] hover:text-[#1A0A0F] hover:bg-[#FBF4F6]'
            )}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-extrabold',
                  isActive ? 'bg-[#1C1C28] text-[#1EC1CB]' : 'bg-[#F6E6EA] text-[#1A0A0F]'
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ---------- 10. Stepper ----------
export interface StepItem {
  title: string;
  subtitle?: string;
  status: 'done' | 'current' | 'upcoming';
}

export const Stepper: React.FC<{ steps: StepItem[] }> = ({ steps }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      {steps.map((step, index) => (
        <div
          key={index}
          className={clsx(
            'p-3.5 rounded-[12px] border flex items-start gap-3 transition-all',
            step.status === 'current'
              ? 'bg-[#E5F8F9] border-[#1EC1CB] ring-1 ring-[#1EC1CB]'
              : step.status === 'done'
                ? 'bg-[#E3F7EF]/60 border-[#99E2C4]'
                : 'bg-white border-[#E4C3CC] opacity-75'
          )}
        >
          <div
            className={clsx(
              'w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0',
              step.status === 'current'
                ? 'bg-[#1EC1CB] text-[#1C1C28]'
                : step.status === 'done'
                  ? 'bg-[#0F6E4B] text-white'
                  : 'bg-[#F6E6EA] text-[#1A0A0F]'
            )}
          >
            {step.status === 'done' ? '✓' : index + 1}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-[#1A0A0F]">{step.title}</div>
            {step.subtitle && (
              <div className="text-[11px] text-[#52526B] mt-0.5">{step.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- 11. Table ----------
export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => React.ReactNode;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyText = 'Chưa có dữ liệu',
}: {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: string;
}) {
  return (
    <div className="overflow-x-auto border border-[#E4C3CC] rounded-[12px] bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FDF7F9] border-b border-[#E4C3CC] text-[11px] font-bold uppercase tracking-wider text-[#52526B]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'py-3 px-4',
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4C3CC] text-[13px] text-[#1C1C28]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-[#52526B]">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={rowKey(row, idx)} className="hover:bg-[#FDF7F9]/60 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'py-3.5 px-4',
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    )}
                  >
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
