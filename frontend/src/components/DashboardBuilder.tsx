'use client';

import React, { useState, useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Dashboard, DashboardUpdate, type Widget } from '@/schemas/dashboard-schema';
import { useUpdateDashboard } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardBuilderProps {
  dashboard: Dashboard;
  onSave?: () => void;
  className?: string;
}

const WIDGET_TYPES = [
  'kpi_card',
  'bar_chart',
  'line_chart',
  'donut_gauge',
  'data_table',
  'gauge_chart',
  'semaforo_sla',
  'ranking_bar',
];

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboard,
  onSave,
  className,
}) => {
  const [name, setName] = useState(dashboard.nombre);
  const [description, setDescription] = useState(dashboard.descripcion || '');
  const [layout, setLayout] = useState(dashboard.layout_json);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const updateMutation = useUpdateDashboard(dashboard.id!);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!previewMode) {
        setLayout({
          ...layout,
          widgets: layout.widgets.map((widget) => {
            const newPos = newLayout.find((l) => l.i === widget.id);
            if (newPos) {
              return {
                ...widget,
                layout: {
                  x: newPos.x,
                  y: newPos.y,
                  w: newPos.w,
                  h: newPos.h,
                  minW: widget.layout.minW,
                  minH: widget.layout.minH,
                },
              };
            }
            return widget;
          }),
        });
        setIsDirty(true);
      }
    },
    [layout, previewMode]
  );

  const handleAddWidget = useCallback(() => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: WIDGET_TYPES[0] as Widget['type'],
      layout: { x: 0, y: layout.widgets.length * 2, w: 4, h: 2, minW: 2, minH: 2 },
      config: {
        title: 'Nuevo Widget',
        dataSource: 'vulnerabilidades',
      },
      visible: true,
    };
    setLayout({
      ...layout,
      widgets: [...layout.widgets, newWidget],
    });
    setIsDirty(true);
  }, [layout]);

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      setLayout({
        ...layout,
        widgets: layout.widgets.filter((w) => w.id !== widgetId),
      });
      setIsDirty(true);
    },
    [layout]
  );

  const handleSave = useCallback(async () => {
    try {
      const data: DashboardUpdate = {
        nombre: name,
        descripcion: description || undefined,
        layout_json: layout,
      };
      await updateMutation.mutateAsync(data);
      setIsDirty(false);
      onSave?.();
    } catch (error) {
      logger.error('dashboard.builder.save_failed', { error: String(error) });
    }
  }, [name, description, layout, updateMutation, onSave]);

  const layoutArray = layout.widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    minW: widget.layout.minW,
    minH: widget.layout.minH,
  }));

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Nombre del dashboard"
            className="text-2xl font-bold h-10 mb-2"
            disabled={previewMode}
          />
          <Input
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Descripción (opcional)"
            disabled={previewMode}
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-2"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Editar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Vista Previa
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        {previewMode ? (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground text-center py-8">
              Vista previa - {layout.widgets.length} widgets
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Button
                onClick={handleAddWidget}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Widget
              </Button>
            </div>

            <GridLayout
              className="bg-muted/30 rounded-lg p-4"
              layout={layoutArray}
              onLayoutChange={handleLayoutChange}
              cols={layout.grid.cols}
              rowHeight={layout.grid.rowHeight}
              width={1200}
              isDraggable={!previewMode}
              isResizable={!previewMode}
              compactType={
                layout.grid.compactType === 'both'
                  ? 'vertical'
                  : (layout.grid.compactType as 'vertical' | 'horizontal' | null)
              }
              preventCollision={false}
              useCSSTransforms={true}
            >
              {layout.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Card className="h-full border-0 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm truncate">
                          {widget.config.title}
                        </CardTitle>
                        {!previewMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -m-2"
                            onClick={() => handleRemoveWidget(widget.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {widget.type} • {widget.config.dataSource}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Placeholder widget
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </GridLayout>
          </>
        )}
      </div>
    </div>
  );
};

interface Layout {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  minW?: number;
  minH?: number;
}
