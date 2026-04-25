'use client';

import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';

export default function DashboardsGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-0">
      <div className="px-6 pt-2">
        <DashboardBreadcrumbs />
      </div>
      {children}
    </div>
  );
}
