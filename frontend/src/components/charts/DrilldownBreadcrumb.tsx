'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  level: number;
  id?: string;
}

interface DrilldownBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (level: number) => void;
  className?: string;
}

export const DrilldownBreadcrumb: React.FC<DrilldownBreadcrumbProps> = ({
  items,
  onNavigate,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {items.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(items.length - 2)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </Button>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        {items.map((item, idx) => (
          <React.Fragment key={`${item.level}-${item.id}`}>
            <button
              onClick={() => onNavigate(item.level)}
              className={cn(
                'px-2 py-1 rounded text-sm transition-colors',
                idx === items.length - 1
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
            {idx < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
