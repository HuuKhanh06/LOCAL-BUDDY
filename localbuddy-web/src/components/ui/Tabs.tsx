// components/ui/Tabs.tsx
import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('flex border-b border-[#E4C3CC] overflow-x-auto gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-3 text-[14px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer',
              isActive
                ? 'border-[#1EC1CB] text-[#1A0A0F] bg-[#F6E6EA]/50 rounded-t-[10px]'
                : 'border-transparent text-[#52526B] hover:text-[#1A0A0F] hover:bg-[#F6E6EA]/25 rounded-t-[10px]'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'text-[12px] px-2 py-0.5 rounded-full font-bold tabular-nums',
                  isActive
                    ? 'bg-[#1EC1CB] text-[#1C1C28]' // Chữ navy trên nền cyan!
                    : 'bg-[#F6E6EA] text-[#1A0A0F]'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
