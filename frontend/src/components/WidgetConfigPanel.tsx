'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Widget } from '@/schemas/dashboard-schema';
import { Palette, Database, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const WIDGET_TYPES = [
  { value: 'kpi_card', label: 'KPI Card' },
  { value: 'gauge_chart', label: 'Gauge Chart' },
  { value: 'semaforo_sla', label: 'Semáforo SLA' },
  { value: 'bar_chart', label: 'Bar Chart' },
  { value: 'line_chart', label: 'Line Chart' },
  { value: 'area_chart', label: 'Area Chart' },
  { value: 'ranking_bar', label: 'Horizontal Ranking' },
  { value: 'historic_grid', label: 'Histórico Mensual' },
  { value: 'data_table', label: 'Data Table' },
  { value: 'heatmap', label: 'Heatmap' },
];

const DATA_SOURCES = [
  { value: 'vulnerabilidades', label: 'Vulnerabilidades' },
  { value: 'liberaciones', label: 'Liberaciones' },
  { value: 'programas', label: 'Programas' },
  { value: 'amenazas_tm', label: 'Amenazas (Threat Modeling)' },
  { value: 'auditorias', label: 'Auditorías' },
  { value: 'iniciativas', label: 'Iniciativas' },
  { value: 'temas_emergentes', label: 'Temas Emergentes' },
  { value: 'equipo', label: 'Equipo' },
];

const METRICS = {
  vulnerabilidades: ['count', 'criticas', 'altas', 'sla_vencido', 'promedio_dias_abierto'],
  liberaciones: ['count', 'en_progreso', 'completadas', 'dias_promedio'],
  programas: ['progreso_promedio', 'completadas', 'en_riesgo'],
  auditorias: ['count', 'hallazgos', 'pendientes'],
  iniciativas: ['count', 'progreso_promedio', 'en_riesgo'],
  equipo: ['analistas_activos', 'carga_promedio', 'completadas'],
};

interface WidgetConfigPanelProps {
  widget: Widget;
  onUpdate: (widget: Widget) => void;
  onClose: () => void;
}

export const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({
  widget,
  onUpdate,
  onClose,
}) => {
  const [config, setConfig] = useState(widget);
  const [activeTab, setActiveTab] = useState('basic');

  const handleTitleChange = (title: string) => {
    setConfig({
      ...config,
      config: { ...config.config, title },
    });
  };

  const handleTypeChange = (type: string) => {
    setConfig({
      ...config,
      type: type as Widget['type'],
    });
  };

  const handleDataSourceChange = (dataSource: string) => {
    setConfig({
      ...config,
      config: {
        ...config.config,
        dataSource,
        metric: undefined, // Reset metric when changing data source
      },
    });
  };

  const handleMetricChange = (metric: string) => {
    setConfig({
      ...config,
      config: { ...config.config, metric },
    });
  };

  const handleDisplayChange = (key: string, value: unknown) => {
    setConfig({
      ...config,
      config: {
        ...config.config,
        display: {
          ...config.config.display,
          [key]: value,
        },
      },
    });
  };

  const handleFilterChange = (filterKey: string, filterValue: unknown) => {
    setConfig({
      ...config,
      config: {
        ...config.config,
        filters: {
          ...(config.config.filters || {}),
          [filterKey]: filterValue,
        },
      },
    });
  };

  const handleSave = () => {
    onUpdate(config);
    onClose();
  };

  const availableMetrics = METRICS[config.config.dataSource as keyof typeof METRICS] || [];

  return (
    <Card className="h-full flex flex-col border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Configurar Widget</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2 text-xs">
              <Settings className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 text-xs">
              <Database className="h-4 w-4" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2 text-xs">
              <Palette className="h-4 w-4" />
              Display
            </TabsTrigger>
          </TabsList>

          {/* TAB: BÁSICO */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Título</Label>
              <Input
                value={config.config.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nombre del widget"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tipo de Widget</Label>
              <Select value={config.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map((wt) => (
                    <SelectItem key={wt.value} value={wt.value}>
                      {wt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Visible</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={config.visible}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, visible: checked as boolean })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {config.visible ? 'Visible' : 'Oculto'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Posición en Grid
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">X:</span> {config.layout.x}
                </div>
                <div>
                  <span className="text-muted-foreground">Y:</span> {config.layout.y}
                </div>
                <div>
                  <span className="text-muted-foreground">Ancho:</span> {config.layout.w}
                </div>
                <div>
                  <span className="text-muted-foreground">Alto:</span> {config.layout.h}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: DATOS */}
          <TabsContent value="data" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Fuente de Datos</Label>
              <Select value={config.config.dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map((ds) => (
                    <SelectItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableMetrics.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Métrica</Label>
                <Select
                  value={config.config.metric || ''}
                  onValueChange={handleMetricChange}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric} value={metric}>
                        {metric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Filtros Rápidos</Label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!config.config.filters?.['severidad']}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('severidad', ['CRITICA', 'ALTA']);
                      } else {
                        const newFilters = { ...config.config.filters };
                        delete newFilters['severidad'];
                        setConfig({
                          ...config,
                          config: { ...config.config, filters: newFilters },
                        });
                      }
                    }}
                  />
                  <span>Por Severidad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!config.config.filters?.['estado']}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange('estado', ['Abierta']);
                      } else {
                        const newFilters = { ...config.config.filters };
                        delete newFilters['estado'];
                        setConfig({
                          ...config,
                          config: { ...config.config, filters: newFilters },
                        });
                      }
                    }}
                  />
                  <span>Por Estado</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: DISPLAY */}
          <TabsContent value="display" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Color</Label>
              <div className="flex gap-2">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-8 w-8 rounded border-2 transition-all',
                      config.config.display?.color === color
                        ? 'border-foreground'
                        : 'border-border'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleDisplayChange('color', color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Icono (opcional)</Label>
              <Input
                value={config.config.display?.icon || ''}
                onChange={(e) => handleDisplayChange('icon', e.target.value)}
                placeholder="shield-alert, trending-up, etc."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={config.config.display?.showTrend || false}
                  onCheckedChange={(checked) =>
                    handleDisplayChange('showTrend', checked)
                  }
                />
                <Label className="text-xs font-semibold cursor-pointer">
                  Mostrar Tendencia
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tipo de Gráfico (si aplica)</Label>
              <Select
                value={config.config.display?.chartType || ''}
                onValueChange={(value) => handleDisplayChange('chartType', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="line">Línea</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="pie">Pastel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <div className="border-t pt-4 flex gap-2">
        <Button onClick={handleSave} className="flex-1" size="sm">
          Guardar
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1" size="sm">
          Cancelar
        </Button>
      </div>
    </Card>
  );
};
