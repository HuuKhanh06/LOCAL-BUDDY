// components/ui/Tabs.tsx
// Tabs chuẩn thiết kế tokens: #EB5B38, #272A2D, #E6E4DC, #347CCB

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
    <div className={clsx('flex border-b border-[var(--lb-border)] overflow-x-auto gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer',
              isActive
                ? 'border-[var(--lb-accent)] text-[var(--lb-text)] bg-[var(--lb-surface-2)] rounded-t-[10px]'
                : 'border-transparent text-[var(--lb-muted)] hover:text-[var(--lb-text)] hover:bg-[var(--lb-surface)] rounded-t-[10px]'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums',
                  isActive
                    ? 'bg-[var(--lb-accent)] text-[var(--lb-on-accent)]'
                    : 'bg-[var(--lb-surface-2)] text-[var(--lb-muted)]'
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
