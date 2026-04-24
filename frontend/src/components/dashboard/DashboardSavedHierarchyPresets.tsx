'use client';

import { BookMarked, Loader2, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
} from '@/components/ui';
import { useCreateFiltroGuardado, useDeleteFiltroGuardado, useFiltrosGuardados } from '@/hooks/useFiltrosGuardados';
import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';
import { hierarchyFromParametros, parametrosFromHierarchy } from '@/lib/dashboardHierarchyPresets';
import { extractErrorMessage } from '@/lib/utils';

type DashboardSavedHierarchyPresetsProps = {
  modulo: string;
  currentFilters: HierarchyFilters;
  onApply: (f: HierarchyFilters) => void;
};

export function DashboardSavedHierarchyPresets({
  modulo,
  currentFilters,
  onApply,
}: DashboardSavedHierarchyPresetsProps) {
  const { data: all, isLoading } = useFiltrosGuardados();
  const createMut = useCreateFiltroGuardado();
  const deleteMut = useDeleteFiltroGuardado();
  const [selectedId, setSelectedId] = useState<string>('');
  const [name, setName] = useState('');
  const [compartido, setCompartido] = useState(false);

  const presets = useMemo(
    () => (all ?? []).filter((f) => f.modulo === modulo).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [all, modulo],
  );

  const options = useMemo(
    () => [{ value: '', label: 'Cargar preset…' }, ...presets.map((p) => ({ value: p.id, label: p.nombre }))],
    [presets],
  );

  const onLoad = (id: string) => {
    setSelectedId(id);
    if (!id) return;
    const row = presets.find((p) => p.id === id);
    if (!row) return;
    onApply(hierarchyFromParametros(row.parametros as Record<string, unknown>));
    toast.success('Filtro aplicado');
  };

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Indica un nombre para el preset');
      return;
    }
    const params = parametrosFromHierarchy(currentFilters);
    if (Object.keys(params).length === 0) {
      toast.error('Elige al menos un nivel (subdirección, gerencia, etc.)');
      return;
    }
    createMut.mutate(
      { nombre: trimmed, modulo, parametros: params, compartido },
      {
        onSuccess: () => {
          toast.success('Preset guardado');
          setName('');
          setCompartido(false);
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'No se pudo guardar')),
      },
    );
  };

  const onDelete = () => {
    if (!selectedId) {
      toast.error('Selecciona un preset en el desplegable');
      return;
    }
    deleteMut.mutate(selectedId, {
      onSuccess: () => {
        toast.success('Preset eliminado');
        setSelectedId('');
      },
      onError: (e) => toast.error(extractErrorMessage(e, 'No se pudo eliminar')),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando presets…
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-card/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <BookMarked className="h-4 w-4 text-primary" />
        Presets guardados
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1">
          <Select
            label="Cargar"
            value={selectedId}
            onChange={(e) => onLoad(e.target.value)}
            options={options}
            placeholder="Cargar preset…"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onDelete}
          disabled={!selectedId || deleteMut.isPending}
        >
          {deleteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Eliminar
        </Button>
      </div>
      <div className="grid gap-2 border-t border-border/50 pt-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="preset-name" className="text-xs text-muted-foreground">
            Guardar selección actual
          </Label>
          <Input
            id="preset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del preset"
            maxLength={255}
            className="mt-1"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={compartido}
              onChange={(e) => setCompartido(e.target.checked)}
            />
            Compartido
          </label>
        </div>
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={onSave}
          disabled={createMut.isPending}
        >
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar como preset
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          Los parámetros se guardan en el servidor; este navegador sigue sincronizando el estado en localStorage.
        </p>
      </div>
    </div>
  );
}
