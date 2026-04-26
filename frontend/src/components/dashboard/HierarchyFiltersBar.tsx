"use client";

import { Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DashboardSavedHierarchyPresets } from '@/components/dashboard/DashboardSavedHierarchyPresets';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
} from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import { useDireccions } from '@/hooks/useDireccions';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';
import { cn } from '@/lib/utils';

const LABELS: Record<keyof HierarchyFilters, string> = {
  direccion_id: 'Dirección',
  subdireccion_id: 'Subdirección',
  gerencia_id: 'Gerencia',
  organizacion_id: 'Organización',
  celula_id: 'Célula',
  repositorio_id: 'Repositorio',
};

type Props = {
  title?: string;
  filters: HierarchyFilters;
  onChange: (key: keyof HierarchyFilters, value: string) => void;
  onClear: () => void;
  savedModulo?: string;
  onApplyFilters?: (f: HierarchyFilters) => void;
  /** Clase en la fila compacta (sin Card envolvente) */
  className?: string;
};

function lookupName(
  id: string,
  list: { id: string; nombre: string }[] | undefined,
): string {
  return list?.find((x) => x.id === id)?.nombre ?? id.slice(0, 8) + '…';
}

/**
 * Filtro jerárquico compacto: chips + panel lateral (drawer) con cascada real.
 * Los presets guardados siguen vía `DashboardSavedHierarchyPresets` + `onApplyFilters`.
 */
export function HierarchyFiltersBar({
  title = 'Filtro organizacional',
  filters,
  onChange,
  onClear,
  savedModulo,
  onApplyFilters,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: subdireccions } = useSubdireccions();
  const { data: direccions } = useDireccions();
  const { data: gerencias } = useGerencias();
  const { data: organizacions } = useOrganizacions();
  const { data: celulas } = useCelulas();
  const { data: repositorios } = useRepositorios();

  const subdireccionsFiltered = (subdireccions ?? []).filter(
    (x) => !filters.direccion_id || x.direccion_id === filters.direccion_id,
  );

  const gerenciasFiltered = (gerencias ?? []).filter(
    (x) => !filters.subdireccion_id || x.subdireccion_id === filters.subdireccion_id,
  );
  const organizacionsFiltered = (organizacions ?? []).filter(
    (x) => !filters.gerencia_id || x.gerencia_id === filters.gerencia_id,
  );
  const celulasFiltered = (celulas ?? []).filter(
    (x) => !filters.organizacion_id || x.organizacion_id === filters.organizacion_id,
  );
  const reposFiltered = (repositorios ?? []).filter(
    (x) => !filters.celula_id || x.celula_id === filters.celula_id,
  );

  const activeChips = useMemo(() => {
    const out: { key: keyof HierarchyFilters; label: string }[] = [];
    (Object.keys(LABELS) as (keyof HierarchyFilters)[]).forEach((key) => {
      const v = filters[key];
      if (!v) return;
      let name: string;
      if (key === 'direccion_id') name = lookupName(v, direccions);
      else if (key === 'subdireccion_id') name = lookupName(v, subdireccions);
      else if (key === 'gerencia_id') name = lookupName(v, gerencias);
      else if (key === 'organizacion_id') name = lookupName(v, organizacions);
      else if (key === 'celula_id') name = lookupName(v, celulas);
      else name = lookupName(v, repositorios);
      out.push({ key, label: `${LABELS[key]}: ${name}` });
    });
    return out;
  }, [filters, direccions, subdireccions, gerencias, organizacions, celulas, repositorios]);

  const applyCascadeClear = (cleared: keyof HierarchyFilters) => {
    const order: (keyof HierarchyFilters)[] = [
      'direccion_id',
      'subdireccion_id',
      'gerencia_id',
      'organizacion_id',
      'celula_id',
      'repositorio_id',
    ];
    const i = order.indexOf(cleared);
    onChange(cleared, '');
    for (let j = i + 1; j < order.length; j += 1) {
      onChange(order[j], '');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeChips.length > 0 ? (
            <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 text-[10px]">
              {activeChips.length}
            </Badge>
          ) : null}
        </Button>
        {activeChips.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground h-8">
            Limpiar todo
          </Button>
        ) : null}
      </div>
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" data-testid="hierarchy-filter-chips">
          {activeChips.map((c) => (
            <Badge
              key={c.key}
              variant="outline"
              className="cursor-default gap-1 pr-0.5 font-normal"
            >
              {c.label}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Quitar ${c.label}`}
                onClick={() => applyCascadeClear(c.key)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent position="right" className="p-0 sm:max-w-md">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-base">{title}</DialogTitle>
            </DialogHeader>
            {savedModulo && onApplyFilters ? (
              <div className="mt-3 border-b border-border pb-3">
                <DashboardSavedHierarchyPresets
                  modulo={savedModulo}
                  currentFilters={filters}
                  onApply={(f) => {
                    onApplyFilters(f);
                    setOpen(false);
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="space-y-3 px-6 py-2">
            <Select
              label="Dirección"
              value={filters.direccion_id ?? ''}
              onChange={(e) => {
                onChange('direccion_id', e.target.value);
                onChange('subdireccion_id', '');
                onChange('gerencia_id', '');
                onChange('organizacion_id', '');
                onChange('celula_id', '');
                onChange('repositorio_id', '');
              }}
              options={(direccions ?? []).map((d) => ({ value: d.id, label: d.nombre }))}
              placeholder="Todas"
            />
            <Select
              label="Subdirección"
              value={filters.subdireccion_id ?? ''}
              onChange={(e) => {
                onChange('subdireccion_id', e.target.value);
                onChange('gerencia_id', '');
                onChange('organizacion_id', '');
                onChange('celula_id', '');
                onChange('repositorio_id', '');
              }}
              options={subdireccionsFiltered.map((s) => ({ value: s.id, label: s.nombre }))}
              placeholder="Todas"
            />
            <Select
              label="Gerencia"
              value={filters.gerencia_id ?? ''}
              onChange={(e) => {
                onChange('gerencia_id', e.target.value);
                onChange('organizacion_id', '');
                onChange('celula_id', '');
                onChange('repositorio_id', '');
              }}
              options={gerenciasFiltered.map((g) => ({ value: g.id, label: g.nombre }))}
              placeholder="Todas"
            />
            <Select
              label="Organización"
              value={filters.organizacion_id ?? ''}
              onChange={(e) => {
                onChange('organizacion_id', e.target.value);
                onChange('celula_id', '');
                onChange('repositorio_id', '');
              }}
              options={organizacionsFiltered.map((o) => ({ value: o.id, label: o.nombre }))}
              placeholder="Todas"
            />
            <Select
              label="Célula"
              value={filters.celula_id ?? ''}
              onChange={(e) => {
                onChange('celula_id', e.target.value);
                onChange('repositorio_id', '');
              }}
              options={celulasFiltered.map((c) => ({ value: c.id, label: c.nombre }))}
              placeholder="Todas"
            />
            <Select
              label="Repositorio"
              value={filters.repositorio_id ?? ''}
              onChange={(e) => onChange('repositorio_id', e.target.value)}
              options={reposFiltered.map((r) => ({ value: r.id, label: r.nombre }))}
              placeholder="Todos"
            />
          </div>
          <DialogFooter className="border-t border-border p-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={onClear}>
              Limpiar
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type CardProps = Props & { cardClassName?: string };

/** Variante con Card (título visible + barra compacta con drawer) */
export function HierarchyFiltersBarCard({ cardClassName, ...props }: CardProps) {
  const t = props.title ?? 'Filtro organizacional';
  return (
    <Card className={cn(cardClassName)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t}</CardTitle>
      </CardHeader>
      <CardContent>
        <HierarchyFiltersBar {...props} title={t} />
      </CardContent>
    </Card>
  );
}
