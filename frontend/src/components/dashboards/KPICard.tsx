'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  icon?: React.ReactNode;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  color = 'default',
  icon,
  loading,
}: KPICardProps) {
  const colorClasses = {
    default: 'text-foreground',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded w-24" />
        ) : (
          <>
            <div className={cn('text-3xl font-bold', colorClasses[color])}>{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {trend === 'up' ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Mejora</span>
                  </>
                ) : trend === 'down' ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Empeora</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Estable</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
