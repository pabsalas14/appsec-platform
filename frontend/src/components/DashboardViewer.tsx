'use client';

import React, { useMemo } from 'react';
import GridLayout from 'react-grid-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Widget } from '@/schemas/dashboard-schema';
import { useWidgetData } from '@/hooks/useWidgetData';
import {
  GaugeChart,
  SemaforoSla,
  HistoricoMensualGrid,
  HorizontalBarRanking,
  AreaLineChart,
  type SemaforoItem,
} from '@/components/charts';
import type { ChartDataPoint } from '@/components/charts/AreaLineChart';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardViewerProps {
  widgets: Widget[];
  cols?: number;
  rowHeight?: number;
  isLoading?: boolean;
}

interface WidgetRenderProps {
  widget: Widget;
}

const WidgetRenderer: React.FC<WidgetRenderProps> = ({ widget }) => {
  const { data, isLoading, error } = useWidgetData(
    {
      dataSource: widget.config.dataSource,
      metric: widget.config.metric,
      filters: widget.config.filters,
      limit: 100,
    },
    widget.visible
  );

  if (!widget.visible) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm truncate">{widget.config.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Error cargando datos</span>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {/* KPI Card */}
            {widget.type === 'kpi_card' && (
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {typeof data?.summary?.total === 'number'
                    ? data.summary.total.toLocaleString()
                    : '—'}
                </div>
                {data?.summary?.trend &&
                  typeof data.summary.trend === 'object' &&
                  data.summary.trend !== null && (
                  <div
                    className={
                      (data.summary.trend as { direction?: string }).direction === 'up'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {(data.summary.trend as { direction?: string }).direction === 'up' ? '↑' : '↓'}{' '}
                    {(data.summary.trend as { percentage?: number }).percentage ?? 0}%
                  </div>
                )}
              </div>
            )}

            {/* Gauge Chart */}
            {widget.type === 'gauge_chart' && (
              <GaugeChart
                value={typeof data?.summary?.percentage === 'number' ? data.summary.percentage : 0}
                label={widget.config.metric}
                size="md"
              />
            )}

            {/* Semáforo SLA */}
            {widget.type === 'semaforo_sla' && Array.isArray(data?.summary?.items) && (
              <SemaforoSla
                items={data.summary.items.map(
                  (item: {
                    status?: string;
                    label?: string;
                    count?: number;
                    percentage?: number;
                  }): SemaforoItem => {
                    const s = item.status;
                    const status: SemaforoItem['status'] =
                      s === 'ok' || s === 'warning' || s === 'critical' ? s : 'ok';
                    return {
                      status,
                      label: item.label || '',
                      count: item.count || 0,
                      percentage: item.percentage,
                    };
                  })}
              />
            )}

            {/* Horizontal Ranking */}
            {widget.type === 'ranking_bar' && Array.isArray(data?.summary?.items) && (
              <HorizontalBarRanking
                data={data.summary.items.map((item: { label?: string; value?: number; color?: string }) => ({
                  label: item.label || '',
                  value: item.value || 0,
                  color: item.color,
                }))}
                limit={5}
              />
            )}

            {/* Area Line Chart */}
            {widget.type === 'area_chart' && Array.isArray(data?.data) && (
              <AreaLineChart
                data={
                  data.data.map((d: Record<string, string | number | undefined>) => ({
                    name: String(d.name ?? d.date ?? ''),
                    ...d,
                  })) as ChartDataPoint[]
                }
                series={[
                  {
                    key: 'value',
                    name: widget.config.metric || 'Valor',
                    color: widget.config.display?.color || '#3b82f6',
                    type: 'area',
                  },
                ]}
                height={250}
              />
            )}

            {/* Histórico Mensual */}
            {widget.type === 'historic_grid' && Array.isArray(data?.summary?.months) && (
              <HistoricoMensualGrid
                months={data.summary.months.map(
                  (m: { month?: string | number; value?: number; color?: string }) => ({
                    month: typeof m.month === 'number' ? m.month : Number(m.month) || 1,
                    value: m.value || 0,
                    color: m.color,
                  })
                )}
              />
            )}

            {/* Data Table */}
            {widget.type === 'data_table' && Array.isArray(data?.data) && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(data.data[0] || {}).map((key) => (
                        <th key={key} className="px-2 py-1 text-left text-xs font-semibold">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.slice(0, 5).map((row: Record<string, unknown>, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} className="px-2 py-1 text-xs">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.total && data.total > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{data.total - 5} filas más
                  </p>
                )}
              </div>
            )}

            {/* Bar Chart placeholder */}
            {widget.type === 'bar_chart' && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Bar Chart (datos: {data?.data?.length || 0} items)
              </div>
            )}

            {/* Line Chart placeholder */}
            {widget.type === 'line_chart' && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Line Chart (datos: {data?.data?.length || 0} items)
              </div>
            )}

            {/* Heatmap placeholder */}
            {widget.type === 'heatmap' && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Heatmap (datos: {data?.data?.length || 0} items)
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardViewer: React.FC<DashboardViewerProps> = ({
  widgets,
  cols = 12,
  rowHeight = 80,
  isLoading,
}) => {
  const layoutArray = useMemo(
    () =>
      widgets.map((widget) => ({
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
        minW: widget.layout.minW || 2,
        minH: widget.layout.minH || 2,
        static: true, // Read-only
      })),
    [widgets]
  );

  return (
    <GridLayout
      className="bg-muted/20 rounded-lg p-4"
      layout={layoutArray}
      cols={cols}
      rowHeight={rowHeight}
      width={1200}
      isDraggable={false}
      isResizable={false}
      compactType="vertical"
      preventCollision={false}
      useCSSTransforms={true}
    >
      {widgets.map((widget) => (
        <div key={widget.id}>
          {isLoading ? (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ) : (
            <WidgetRenderer widget={widget} />
          )}
        </div>
      ))}
    </GridLayout>
  );
};
