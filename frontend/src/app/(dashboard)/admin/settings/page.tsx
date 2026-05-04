"use client";

import { Info, Loader2, Save, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollapsibleNavSection,
  Input,
  PageWrapper,
  PremiumPageHeader,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  premiumShellCardClass,
} from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { cn } from '@/lib/utils';
import type { SystemSetting } from '@/types';

type Draft = Record<string, unknown>;

/** Claves que también tienen formulario guiado en Admin → Operación (BRD). */
const OPERACION_KEYS = new Set([
  'flujo.transiciones_liberacion',
  'kanban.liberacion',
  'catalogo.estatus_vulnerabilidad',
  'periodo.freeze',
  'programas.ciclo_vida',
  'kpis.ciclo_vida',
]);

const CATEGORY_LABEL: Record<string, string> = {
  app: 'Plataforma',
  features: 'Funcionalidad',
  sla: 'SLA vulnerabilidades',
  catalogo: 'Catálogos',
  flujo: 'Flujos de liberación',
  kanban: 'Kanban',
  madurez: 'Madurez',
  reporte: 'Reportes',
  periodo: 'Periodo',
  programas: 'Programas',
  kpis: 'KPIs',
  otros: 'Otros',
};

const CATEGORY_ORDER = [
  'app',
  'features',
  'sla',
  'catalogo',
  'flujo',
  'kanban',
  'periodo',
  'programas',
  'kpis',
  'madurez',
  'reporte',
  'otros',
];

const SLA_POR_MOTOR_SEVERIDADES = ['critica', 'alta', 'media', 'baja'] as const;

function SlaPorMotorGridEditor({
  jsonText,
  onJsonChange,
}: {
  jsonText: string;
  onJsonChange: (next: string) => void;
}) {
  const [newMotor, setNewMotor] = useState('');
  let grid: Record<string, Record<string, number>>;
  try {
    const raw = JSON.parse(jsonText || '{}');
    grid = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, Record<string, number>>) : {};
  } catch {
    return (
      <p className="text-sm text-destructive">
        JSON inválido: corrige el texto o restaura el valor original.
      </p>
    );
  }

  const motors = Object.keys(grid).sort((a, b) => a.localeCompare(b));

  const setCell = (motor: string, sev: string, raw: string) => {
    const nextGrid = { ...grid, [motor]: { ...(grid[motor] ?? {}) } };
    if (raw.trim() === '') {
      delete nextGrid[motor][sev];
      if (Object.keys(nextGrid[motor]).length === 0) delete nextGrid[motor];
    } else {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0 && n <= 3650) {
        nextGrid[motor][sev] = Math.floor(n);
      }
    }
    onJsonChange(JSON.stringify(nextGrid, null, 2));
  };

  const addMotor = (motor: string) => {
    const m = motor.trim().toUpperCase();
    if (!m) return;
    const next = { ...grid, [m]: { critica: 7, alta: 30, media: 60, baja: 90 } };
    onJsonChange(JSON.stringify(next, null, 2));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Días de SLA por motor de hallazgo (`fuente`) y severidad. Se aplica al crear o importar
        vulnerabilidades; tiene prioridad sobre `sla.severidades`.
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-2 font-medium">Motor</th>
              {SLA_POR_MOTOR_SEVERIDADES.map((s) => (
                <th key={s} className="p-2 font-medium capitalize">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {motors.map((motor) => (
              <tr key={motor} className="border-t border-white/[0.06]">
                <td className="p-2 font-mono font-medium">{motor}</td>
                {SLA_POR_MOTOR_SEVERIDADES.map((sev) => (
                  <td key={sev} className="p-1">
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      className="h-8 border-white/[0.08] bg-background/80 font-mono text-xs"
                      value={grid[motor]?.[sev] ?? ''}
                      onChange={(e) => setCell(motor, sev, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="Nuevo motor (ej. SAST)"
          className="max-w-xs border-white/[0.08] bg-background/80"
          value={newMotor}
          onChange={(e) => setNewMotor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            addMotor(newMotor);
            setNewMotor('');
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/[0.12]"
          onClick={() => {
            addMotor(newMotor);
            setNewMotor('');
          }}
        >
          Añadir motor
        </Button>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Editor JSON crudo</summary>
        <textarea
          className="mt-2 min-h-[100px] w-full rounded-lg border border-white/[0.08] bg-background/80 px-3 py-2 font-mono leading-relaxed shadow-inner"
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          spellCheck={false}
        />
      </details>
    </div>
  );
}

function categoryFromKey(key: string): string {
  const i = key.indexOf('.');
  return i === -1 ? 'otros' : key.slice(0, i);
}

function humanLabel(key: string): string {
  const tail = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
  return tail
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    const fa = ia === -1 ? 100 + a.localeCompare(b) : ia;
    const fb = ib === -1 ? 100 : ib;
    if (fa !== fb) return fa - fb;
    return a.localeCompare(b);
  });
}

function renderEditor(setting: SystemSetting, value: unknown, onChange: (v: unknown) => void) {
  if (setting.key === 'sla.por_motor' && typeof value === 'string') {
    return (
      <SlaPorMotorGridEditor jsonText={value} onJsonChange={(next) => onChange(next)} />
    );
  }
  if (
    (setting.value !== null && typeof setting.value === 'object') ||
    (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('[')))
  ) {
    return (
      <textarea
        className="min-h-[140px] w-full rounded-lg border border-white/[0.08] bg-background/80 px-3 py-2 font-mono text-xs leading-relaxed shadow-inner"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    );
  }
  if (typeof setting.value === 'boolean' || typeof value === 'boolean') {
    return <Switch checked={Boolean(value)} onCheckedChange={onChange} />;
  }
  if (typeof setting.value === 'number') {
    return (
      <Input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="border-white/[0.08] bg-background/80"
      />
    );
  }
  if (setting.key === 'app.default_theme') {
    return (
      <Select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Oscuro' },
          { value: 'system', label: 'Sistema' },
        ]}
      />
    );
  }
  return (
    <Input
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="border-white/[0.08] bg-background/80"
    />
  );
}

function normalizeDraftValue(setting: SystemSetting, draftValue: unknown): unknown {
  if (setting.value !== null && typeof setting.value === 'object') {
    if (typeof draftValue !== 'string') return draftValue;
    try {
      return JSON.parse(draftValue);
    } catch {
      throw new Error('JSON inválido');
    }
  }
  return draftValue;
}

export default function AdminSettingsPage() {
  const { data, isLoading } = useSystemSettings();
  const upsert = useUpsertSystemSetting();
  const [draft, setDraft] = useState<Draft>({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('all');

  const hasUnsavedChanges = useMemo(() => {
    if (!data?.length) return false;
    return data.some((setting) => {
      const original =
        setting.value !== null && typeof setting.value === 'object'
          ? JSON.stringify(setting.value, null, 2)
          : setting.value;
      return draft[setting.key] !== original;
    });
  }, [data, draft]);

  const unsavedCount = useMemo(() => {
    if (!data?.length) return 0;
    let n = 0;
    for (const setting of data) {
      const original =
        setting.value !== null && typeof setting.value === 'object'
          ? JSON.stringify(setting.value, null, 2)
          : setting.value;
      if (draft[setting.key] !== original) n += 1;
    }
    return n;
  }, [data, draft]);

  const { confirmIfNeeded } = useUnsavedChanges({ enabled: hasUnsavedChanges });

  useEffect(() => {
    if (!data) return;
    const initial: Draft = {};
    for (const row of data) {
      initial[row.key] =
        row.value !== null && typeof row.value === 'object' ? JSON.stringify(row.value, null, 2) : row.value;
    }
    setDraft(initial);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data?.length) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (s) =>
        s.key.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        humanLabel(s.key).toLowerCase().includes(q),
    );
  }, [data, search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of filtered) {
      set.add(categoryFromKey(s.key));
    }
    return sortCategories(Array.from(set));
  }, [filtered]);

  const byCategory = useMemo(() => {
    const m = new Map<string, SystemSetting[]>();
    for (const s of filtered) {
      const c = categoryFromKey(s.key);
      const arr = m.get(c) ?? [];
      arr.push(s);
      m.set(c, arr);
    }
    for (const [_k, arr] of m) {
      arr.sort((a, b) => a.key.localeCompare(b.key));
    }
    return m;
  }, [filtered]);

  const onSave = async (setting: SystemSetting) => {
    try {
      const value = normalizeDraftValue(setting, draft[setting.key]);
      await upsert.mutateAsync({ key: setting.key, value });
      toast.success(`Guardado: ${setting.key}`);
    } catch (e) {
      const msg = e instanceof Error && e.message === 'JSON inválido' ? 'JSON inválido' : `No se pudo guardar ${setting.key}`;
      toast.error(msg);
    }
  };

  const renderCard = (setting: SystemSetting) => {
    const original =
      setting.value !== null && typeof setting.value === 'object'
        ? JSON.stringify(setting.value, null, 2)
        : setting.value;
    const dirty = draft[setting.key] !== original;
    const inOperacion = OPERACION_KEYS.has(setting.key);

    return (
      <Card key={setting.key} className={cn(premiumShellCardClass, dirty && 'ring-1 ring-amber-500/40')}>
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base font-semibold leading-snug">{humanLabel(setting.key)}</CardTitle>
              <p className="break-all font-mono text-[11px] text-muted-foreground">{setting.key}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {dirty ? (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                  Sin guardar
                </Badge>
              ) : null}
              {inOperacion ? (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  También en Operación
                </Badge>
              ) : null}
            </div>
          </div>
          {setting.description ? (
            <CardDescription className="text-xs leading-relaxed">{setting.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>{renderEditor(setting, draft[setting.key], (v) => setDraft((d) => ({ ...d, [setting.key]: v })))}</div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!confirmIfNeeded()) return;
                  setDraft((d) => ({ ...d, [setting.key]: original }));
                }}
              >
                Descartar
              </Button>
            )}
            <Button size="sm" disabled={!dirty || upsert.isPending} onClick={() => onSave(setting)}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGrid = (settings: SystemSetting[]) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">{settings.map((s) => renderCard(s))}</div>
  );

  return (
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Administración"
        icon={Settings}
        title="Configuración del sistema"
        description="Parámetros persistidos en base de datos; los cambios aplican en caliente. Usa pestañas y búsqueda para localizar claves. JSON grande: validar antes de guardar."
        action={
          unsavedCount > 0 ? (
            <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
              {unsavedCount} cambio(s) pendiente(s)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Todo guardado
            </Badge>
          )
        }
      />

      <Alert className="border-primary/20 bg-primary/[0.06]">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">¿Operación BRD vs esta pantalla?</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          Parte de estas claves (liberaciones, Kanban, estatus de vulnerabilidad, congelación de periodo, ciclos) se pueden
          editar también en{' '}
          <Link href="/admin/operacion" className="font-medium text-primary underline-offset-4 hover:underline">
            Admin → Operación (BRD)
          </Link>{' '}
          con el mismo guardado en backend. Aquí tienes la vista técnica completa y búsqueda global; allí, formularios
          enfocados en el negocio.
        </AlertDescription>
      </Alert>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por clave, descripción o etiqueta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn('border-white/[0.08] bg-card/40 pl-10 backdrop-blur-sm', 'h-11')}
          aria-label="Buscar configuración"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-card/30 py-20 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-auto min-h-10 w-max flex-wrap justify-start gap-1 bg-white/[0.04] p-1.5">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todas ({filtered.length})
              </TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
                  {CATEGORY_LABEL[cat] ?? cat} ({byCategory.get(cat)?.length ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0 space-y-6 outline-none">
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
                No hay coincidencias. Ajusta la búsqueda.
              </p>
            ) : (
              categories.map((cat, idx) => (
                <CollapsibleNavSection
                  key={cat}
                  title={`${CATEGORY_LABEL[cat] ?? cat} (${byCategory.get(cat)?.length ?? 0})`}
                  defaultOpen={idx === 0}
                >
                  {renderGrid(byCategory.get(cat) ?? [])}
                </CollapsibleNavSection>
              ))
            )}
          </TabsContent>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0 outline-none">
              {(byCategory.get(cat)?.length ?? 0) === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
                  Sin resultados en esta categoría con el filtro actual.
                </p>
              ) : (
                renderGrid(byCategory.get(cat) ?? [])
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </PageWrapper>
  );
}
