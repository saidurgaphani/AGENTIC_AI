'use client';

import {
  Activity,
  AlertTriangle,
  Bot,
  Layers,
  FileCheck2,
  History,
} from 'lucide-react';

export type PlannerTabId =
  | 'overview'
  | 'disruptions'
  | 'recovery'
  | 'decisions';

interface PlannerTabsNavProps {
  activeTab: PlannerTabId;
  onTabChange: (tab: PlannerTabId) => void;
  pendingReviewsCount?: number;
  activeDisruptionsCount?: number;
}

export function PlannerTabsNav({
  activeTab,
  onTabChange,
  pendingReviewsCount = 0,
  activeDisruptionsCount = 1,
}: PlannerTabsNavProps) {
  const tabs = [
    {
      id: 'overview' as PlannerTabId,
      label: 'Overview',
      icon: Activity,
      badge: null,
    },
    {
      id: 'disruptions' as PlannerTabId,
      label: 'Disruptions',
      icon: AlertTriangle,
      badge: activeDisruptionsCount > 0 ? `${activeDisruptionsCount} ACTIVE` : null,
      badgeColor: 'bg-[#fff100] text-[#000000]',
    },
    {
      id: 'recovery' as PlannerTabId,
      label: 'Recovery Plans',
      icon: Layers,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} PENDING` : 'READY',
      badgeColor: pendingReviewsCount > 0 ? 'bg-[#fff100] text-[#000000]' : 'bg-[#d1ffca] text-[#000000]',
    },
    {
      id: 'decisions' as PlannerTabId,
      label: 'Decisions',
      icon: History,
      badge: null,
    },
  ];

  return (
    <nav className="w-full border-b border-[#c6c6c6] bg-[#ffffff] px-6 lg:px-12 py-2 overflow-x-auto">
      <div className="max-w-[1400px] mx-auto flex items-center gap-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-[#000000] text-[#ffffff] shadow-sm font-bold'
                  : 'text-[#444444] hover:text-[#000000] hover:bg-[#f3f3f3]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive ? 'bg-[#ffffff] text-[#000000]' : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
