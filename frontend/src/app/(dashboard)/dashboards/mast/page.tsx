'use client';

import { useMemo, useState } from 'react';
import { Bug, Activity, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
} from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardVulnerabilities } from '@/hooks/useAppDashboardPanels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ENGINE_COLORS: Record<string, string> = {
  SAST: '#3b82f6',
  DAST: '#ef4444',
  SCA: '#a855f7',
  CDS: '#10b981',
  MDA: '#f59e0b',
  MAST: '#ec4899',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICA: '#dc2626',
  ALTA: '#ea580c',
  MEDIA: '#ca8a04',
  BAJA: '#2563eb',
  INFORMATIVA: '#6b7280',
};

export default function ConcentradoMotoresPage() {
  const { data, isLoading } = useDashboardVulnerabilities({ path: '' });
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const engines = data?.summary?.by_engine || [];
  const allVulns = data?.vulnerabilities;

  const filteredVulns = useMemo(() => {
    let result = allVulns || [];
    if (selectedEngine) {
      result = result.filter((v) => v.motor === selectedEngine);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.titulo.toLowerCase().includes(q) ||
          v.motor.toLowerCase().includes(q) ||
          v.severidad.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allVulns, selectedEngine, searchQuery]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Concentrado por Motor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de descubrimiento y remediación por tecnología de análisis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : engines.map((eng) => {
              const color = ENGINE_COLORS[eng.motor] || '#888';
              const isSelected = selectedEngine === eng.motor;
              return (
                <button
                  key={eng.motor}
                  type="button"
                  onClick={() => setSelectedEngine(isSelected ? null : eng.motor)}
                  className={cn(
                    "glass-hover flex flex-col text-left border-b-4 p-4 rounded-xl transition-all",
                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-muted/10"
                  )}
                  style={{ borderBottomColor: color }}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${color}20`, color }}>
                        {eng.motor.substring(0, 2)}
                      </div>
                      <span className="font-bold">{eng.motor}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold tabular-nums tracking-tight mt-1">{eng.count.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {eng.trend >= 0 ? '+' : ''}{eng.trend}% vs ciclo ant.
                  </div>
                </button>
              );
            })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Detalle de Hallazgos
            {selectedEngine && <Badge variant="outline">Filtro: {selectedEngine}</Badge>}
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="h-9 pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Motor</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead className="max-w-[400px]">Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detección</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Cargando datos...
                    </TableCell>
                  </TableRow>
                ) : filteredVulns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No se encontraron hallazgos.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVulns.slice(0, 50).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-xs font-mono">{v.id.split('-')[0]}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ color: ENGINE_COLORS[v.motor], borderColor: `${ENGINE_COLORS[v.motor]}40` }}>
                          {v.motor}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: `${SEVERITY_COLORS[v.severidad] || '#888'}20`,
                            color: SEVERITY_COLORS[v.severidad] || '#888',
                            borderColor: 'transparent'
                          }}
                        >
                          {v.severidad}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate text-sm" title={v.titulo}>
                        {v.titulo}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{v.estado}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {v.fecha_deteccion ? new Date(v.fecha_deteccion).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Mostrando hasta 50 resultados.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
