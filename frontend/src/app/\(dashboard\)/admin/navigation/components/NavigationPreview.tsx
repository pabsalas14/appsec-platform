'use client';

import React from 'react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  visible: boolean;
  required_role?: string;
  children?: NavigationItem[];
}

interface NavigationPreviewProps {
  items: NavigationItem[];
  userRole: string;
}

export default function NavigationPreview({ items, userRole }: NavigationPreviewProps) {
  const filterByRole = (item: NavigationItem): boolean => {
    if (!item.visible) return false;
    if (item.required_role && item.required_role !== userRole) return false;
    return true;
  };

  const renderItems = (items: NavigationItem[], depth = 0) => {
    return items
      .filter(filterByRole)
      .map((item) => (
        <div key={item.id}>
          <a
            href={item.href}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
          >
            {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
            <span>{item.label}</span>
          </a>
          {item.children && item.children.length > 0 && (
            <div>{renderItems(item.children, depth + 1)}</div>
          )}
        </div>
      ));
  };

  const filteredItems = items.filter(filterByRole);

  return (
    <nav className="space-y-1 text-sm">
      {filteredItems.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">
          No hay elementos visibles para el rol "{userRole}"
        </p>
      ) : (
        renderItems(filteredItems)
      )}
    </nav>
  );
}
