"use client";

import { DashboardSavedHierarchyPresets } from '@/components/dashboard/DashboardSavedHierarchyPresets';
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';

type Props = {
  title?: string;
  filters: HierarchyFilters;
  onChange: (key: keyof HierarchyFilters, value: string) => void;
  onClear: () => void;
  /** Si se indica, muestra presets de FiltroGuardado para este módulo (drill-down JSON). */
  savedModulo?: string;
  onApplyFilters?: (f: HierarchyFilters) => void;
};

export function HierarchyFiltersBar({
  title = 'Drill-down organizacional',
  filters,
  onChange,
  onClear,
  savedModulo,
  onApplyFilters,
}: Props) {
  const { data: subdireccions } = useSubdireccions();
  const { data: gerencias } = useGerencias();
  const { data: organizacions } = useOrganizacions();
  const { data: celulas } = useCelulas();

  const gerenciasFiltered = (gerencias ?? []).filter(
    (x) => !filters.subdireccion_id || x.subdireccion_id === filters.subdireccion_id
  );
  const organizacionsFiltered = (organizacions ?? []).filter(
    (x) => !filters.gerencia_id || x.gerencia_id === filters.gerencia_id
  );
  const celulasFiltered = (celulas ?? []).filter(
    (x) => !filters.organizacion_id || x.organizacion_id === filters.organizacion_id
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedModulo && onApplyFilters && (
          <DashboardSavedHierarchyPresets
            modulo={savedModulo}
            currentFilters={filters}
            onApply={onApplyFilters}
          />
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Subdirección"
            value={filters.subdireccion_id ?? ''}
            onChange={(e) => onChange('subdireccion_id', e.target.value)}
            options={(subdireccions ?? []).map((s) => ({ value: s.id, label: s.nombre }))}
            placeholder="Todas"
          />
          <Select
            label="Gerencia"
            value={filters.gerencia_id ?? ''}
            onChange={(e) => onChange('gerencia_id', e.target.value)}
            options={gerenciasFiltered.map((g) => ({ value: g.id, label: g.nombre }))}
            placeholder="Todas"
          />
          <Select
            label="Organización"
            value={filters.organizacion_id ?? ''}
            onChange={(e) => onChange('organizacion_id', e.target.value)}
            options={organizacionsFiltered.map((o) => ({ value: o.id, label: o.nombre }))}
            placeholder="Todas"
          />
          <Select
            label="Célula"
            value={filters.celula_id ?? ''}
            onChange={(e) => onChange('celula_id', e.target.value)}
            options={celulasFiltered.map((c) => ({ value: c.id, label: c.nombre }))}
            placeholder="Todas"
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
