'use client';

import { Loader2, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, PageWrapper, Textarea } from '@/components/ui';
import { useServiceReleaseOperacionConfig, useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';
import type { SystemSetting } from '@/types';

const KEYS = {
  transiciones: 'flujo.transiciones_liberacion',
  kanban: 'kanban.liberacion',
  estatusVuln: 'catalogo.estatus_vulnerabilidad',
} as const;

function findSetting(settings: SystemSetting[] | undefined, key: string): SystemSetting | undefined {
  return settings?.find((s) => s.key === key);
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
}

export default function AdminOperacionPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSystemSettings();
  const upsert = useUpsertSystemSetting();
  const { data: opRead } = useServiceReleaseOperacionConfig();
  const { data: flujoVuln } = useVulnerabilidadFlujoConfig();

  const [transicionesText, setTransicionesText] = useState('');
  const [kanbanText, setKanbanText] = useState('');
  const [estatusVulnText, setEstatusVulnText] = useState('');

  const trS = findSetting(settings, KEYS.transiciones);
  const knS = findSetting(settings, KEYS.kanban);
  const estS = findSetting(settings, KEYS.estatusVuln);

  useEffect(() => {
    if (!trS && !opRead) return;
    if (trS) setTransicionesText(stringify(trS.value));
    else if (opRead) setTransicionesText(JSON.stringify(opRead.transiciones ?? {}, null, 2));
  }, [trS, opRead]);

  useEffect(() => {
    if (!knS && !opRead) return;
    if (knS) setKanbanText(stringify(knS.value));
    else if (opRead) setKanbanText(JSON.stringify(opRead.kanban ?? {}, null, 2));
  }, [knS, opRead]);

  useEffect(() => {
    if (estS) setEstatusVulnText(stringify(estS.value));
    else if (flujoVuln?.estatus?.length) {
      setEstatusVulnText(JSON.stringify(flujoVuln.estatus, null, 2));
    }
  }, [estS, flujoVuln]);

  const saveTransiciones = () => {
    let parsed: unknown;
    try {
      parsed = transicionesText.trim() ? JSON.parse(transicionesText) : {};
    } catch {
      toast.error('JSON inválido (transiciones de liberación).');
      return;
    }
    if (parsed !== null && typeof parsed !== 'object') {
      toast.error('Debe ser un objeto JSON (mapa origen → destinos).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.transiciones,
        value: parsed,
        description: trS?.description,
      },
      {
        onSuccess: () => {
          toast.success('Transiciones de liberación guardadas');
          void qc.invalidateQueries({ queryKey: ['operacion', 'service_releases', 'config'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_transiciones', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  const saveEstatusVuln = () => {
    let parsed: unknown;
    try {
      parsed = estatusVulnText.trim() ? JSON.parse(estatusVulnText) : [];
    } catch {
      toast.error('JSON inválido (catálogo de estatus de vulnerabilidad).');
      return;
    }
    if (!Array.isArray(parsed)) {
      toast.error('Debe ser un array JSON de entradas de estatus (BRD D1).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.estatusVuln,
        value: parsed,
        description: estS?.description ?? 'Catálogo estatus vulnerabilidad (D1): id, label, transiciones, ciclo',
      },
      {
        onSuccess: () => {
          toast.success('Catálogo de estatus (vulnerabilidades) guardado');
          void qc.invalidateQueries({ queryKey: ['vulnerabilidads', 'config', 'flujo'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_estatus_vuln', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  const saveKanban = () => {
    let parsed: unknown;
    try {
      parsed = kanbanText.trim() ? JSON.parse(kanbanText) : {};
    } catch {
      toast.error('JSON inválido (kanban de liberación).');
      return;
    }
    if (parsed !== null && typeof parsed !== 'object') {
      toast.error('Debe ser un objeto JSON (p. ej. columnas_orden).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.kanban,
        value: parsed,
        description: knS?.description,
      },
      {
        onSuccess: () => {
          toast.success('Orden de kanban guardado');
          void qc.invalidateQueries({ queryKey: ['operacion', 'service_releases', 'config'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_kanban', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <p className="text-muted-foreground">Cargando ajustes…</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Operación (liberaciones y flujos)"
        description="C1–C3: `flujo.transiciones_liberacion` y `kanban.liberacion` en almacenamiento; la UI de liberaciones y el dashboard de kanban leen la misma configuración."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transiciones entre estados (service releases)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mapa: estado origen → lista de estados destino. Vacío o ausente = sin validación estricta en el backend.
            Vista efectiva: {opRead ? 'sincronizada' : '—'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            value={transicionesText}
            onChange={(e) => setTransicionesText(e.target.value)}
            spellCheck={false}
            placeholder='{ "Borrador": [ "En Revision de Diseno" ] }'
          />
          <div className="flex justify-end">
            <Button type="button" onClick={saveTransiciones} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar transiciones
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orden de columnas (kanban de liberaciones)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Objeto con `columnas_orden: string[]` (valores de `estado_actual`). Afecta el dashboard de tablero.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={kanbanText}
            onChange={(e) => setKanbanText(e.target.value)}
            spellCheck={false}
            placeholder='{ "columnas_orden": [ "Borrador", "En Revision de Diseno" ] }'
          />
          <div className="flex justify-end">
            <Button type="button" onClick={saveKanban} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar kanban
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo de estatus de vulnerabilidad (D1)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Array en `system_settings` bajo `catalogo.estatus_vulnerabilidad` — cada ítem: `id`, `label`, `transiciones_permitidas`,
            `clasificacion_ciclo`, `es_terminal`. La API expone el mismo esquema en `GET /vulnerabilidads/config/flujo`.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {flujoVuln?.estatus?.length ? (
            <p className="text-xs text-muted-foreground">Resumen: {flujoVuln.estatus.length} estatus activos en lectura.</p>
          ) : null}
          <Textarea
            className="min-h-[240px] font-mono text-xs"
            value={estatusVulnText}
            onChange={(e) => setEstatusVulnText(e.target.value)}
            spellCheck={false}
            placeholder='[ { "id": "Abierta", "label": "Abierta", "transiciones_permitidas": ["En Remediación"] } ]'
          />
          <div className="flex justify-end">
            <Button type="button" onClick={saveEstatusVuln} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar catálogo D1
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
