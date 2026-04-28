'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';

interface SeverityDistributionProps {
  data: Record<string, number>;
  loading?: boolean;
  title?: string;
}

const severityColors: Record<string, { bg: string; text: string; bar: string }> = {
  CRITICA: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-900 dark:text-red-100', bar: 'bg-red-600' },
  ALTA: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-900 dark:text-orange-100', bar: 'bg-orange-600' },
  MEDIA: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-900 dark:text-yellow-100', bar: 'bg-yellow-600' },
  BAJA: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-900 dark:text-blue-100', bar: 'bg-blue-600' },
  INFORMATIVA: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-900 dark:text-gray-100', bar: 'bg-gray-600' },
};

export function SeverityDistribution({ data, loading, title = 'Distribución por Severidad' }: SeverityDistributionProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const maxValue = total > 0 ? Math.max(...Object.values(data)) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-6 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(data).map(([severity, count]) => {
              const colors = severityColors[severity] || severityColors.INFORMATIVA;
              const percentage = total > 0 ? (count / maxValue) * 100 : 0;

              return (
                <div key={severity} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={colors.bg}>
                      <span className={colors.text}>{severity}</span>
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
