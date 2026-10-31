import React from 'react';
import styles from './UnderlineTabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface UnderlineTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function UnderlineTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  ariaLabel = 'Navigation Tabs',
}: UnderlineTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${styles.tabList} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span style={{ marginLeft: 6, opacity: 0.85 }}>({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
