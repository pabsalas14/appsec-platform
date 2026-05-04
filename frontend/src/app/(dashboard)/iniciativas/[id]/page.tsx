'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Target } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import { useHitoIniciativas, useUpdateHitoIniciativa } from '@/hooks/useHitoIniciativas';
import { useIniciativa } from '@/hooks/useIniciativas';
import { logger } from '@/lib/logger';
import { cn, extractErrorMessage } from '@/lib/utils';

const linkBtnBase =
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20';
const linkOutlineSm = cn(
  linkBtnBase,
  'text-sm py-1.5 px-3 rounded-lg border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08]',
);
const linkSecondaryMd = cn(
  linkBtnBase,
  'text-sm py-2 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-foreground hover:bg-white/[0.08]',
);
const linkOutlineMd = cn(
  linkBtnBase,
  'text-sm py-2 px-4 rounded-lg border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08]',
);

function HitoPesosEditor({ iniciativaId }: { iniciativaId: string }) {
  const { data: hitos = [], isLoading } = useHitoIniciativas(iniciativaId);
  const updateMut = useUpdateHitoIniciativa();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts(Object.fromEntries(hitos.map((h) => [h.id, h.peso != null ? String(h.peso) : ''])));
  }, [hitos]);

  const { mixed, allDefined, sum } = useMemo(() => {
    const parsed = hitos.map((h) => {
      const t = drafts[h.id]?.trim() ?? '';
      if (t === '') return null;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 1 || n > 100) return 'invalid' as const;
      return n;
    });
    const nums = parsed.filter((v): v is number => typeof v === 'number');
    const nulls = parsed.filter((v) => v === null).length;
    const someNum = nums.length > 0;
    const allNum = hitos.length > 0 && nums.length === hitos.length;
    const mixed = someNum && nulls > 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return { mixed, allDefined: allNum, sum };
  }, [hitos, drafts]);

  const invalid = useMemo(() => {
    return hitos.some((h) => {
      const t = drafts[h.id]?.trim() ?? '';
      if (t === '') return false;
      const n = Number(t);
      return !Number.isFinite(n) || n < 1 || n > 100;
    });
  }, [hitos, drafts]);

  const savePesos = useCallback(async () => {
    if (invalid) {
      toast.error('Cada peso debe ser un número entre 1 y 100, o vacío.');
      return;
    }
    try {
      for (const h of hitos) {
        const raw = drafts[h.id]?.trim() ?? '';
        const next = raw === '' ? null : Number(raw);
        const prev = h.peso ?? null;
        if (next === prev || (next == null && prev == null)) continue;
        await updateMut.mutateAsync({
          id: h.id,
          peso: next,
        });
      }
      toast.success('Pesos de hitos actualizados');
    } catch (e) {
      logger.error('iniciativa.hitos_peso_save_failed', { err: e });
      toast.error(extractErrorMessage(e, 'No se pudieron guardar los pesos'));
    }
  }, [drafts, hitos, invalid, updateMut]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hitos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay hitos para esta iniciativa.{' '}
        <Link href="/hito_iniciativas" className="text-primary underline-offset-2 hover:underline">
          Crear hitos
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {mixed && (
        <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
          <AlertTitle>Reparto de pesos incompleto</AlertTitle>
          <AlertDescription>
            O todos los hitos tienen peso (recomendado para % que sumen 100) o ninguno (reparto
            equitativo automático). Mezclar ambos puede confundir el cálculo de avance.
          </AlertDescription>
        </Alert>
      )}
      {allDefined && sum !== 100 && (
        <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
          <AlertTitle>Suma de pesos: {sum}% (no es 100%)</AlertTitle>
          <AlertDescription>
            El tablero normaliza los pesos automáticamente, pero se recomienda que sumen 100 para
            reflejar la ponderación deseada (p. ej. 40 + 30 + 30).
          </AlertDescription>
        </Alert>
      )}
      <ul className="space-y-3">
        {hitos.map((h) => (
          <li key={h.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{h.nombre}</p>
              <p className="text-xs text-muted-foreground">{h.estado}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Peso (1–100)</span>
              <Input
                className="w-24 h-9"
                inputMode="numeric"
                value={drafts[h.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [h.id]: e.target.value }))}
                placeholder="—"
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" size="sm" onClick={() => void savePesos()} disabled={updateMut.isPending}>
          {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar pesos
        </Button>
        <Link href="/hito_iniciativas" className={linkSecondaryMd}>
          Editar hitos (fechas y más)
        </Link>
      </div>
    </div>
  );
}

export default function IniciativaDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : undefined;
  const { data: ini, isLoading, error } = useIniciativa(id);

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/iniciativas/registros" className={linkOutlineSm}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Registros
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error || !ini ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontró la iniciativa o no tienes permiso para verla.
          </CardContent>
        </Card>
      ) : (
        <>
          <PageHeader
            title={ini.titulo ?? 'Iniciativa'}
            description={ini.descripcion ?? 'Detalle de iniciativa de seguridad.'}
          >
            <Badge variant="secondary">{ini.estado ?? '—'}</Badge>
          </PageHeader>

          <Tabs defaultValue="detalle" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="programas">Programas y enlaces</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="space-y-6">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Tipo: </span>
                        {ini.tipo ?? '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Inicio: </span>
                        {ini.fecha_inicio ? new Date(ini.fecha_inicio).toLocaleString('es-ES') : '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Fin estimada: </span>
                        {ini.fecha_fin_estimada
                          ? new Date(ini.fecha_fin_estimada).toLocaleString('es-ES')
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href="/hito_iniciativas" className={linkSecondaryMd}>
                      Hitos de iniciativas
                    </Link>
                    <Link href="/dashboards/iniciativas" className={linkOutlineMd}>
                      Dashboard iniciativas
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h2 className="text-base font-semibold">Ponderación de hitos</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Asigna un peso entre 1 y 100 a cada hito. Si todos tienen peso, el avance del mes
                      los pondera (idealmente que sumen 100%).
                    </p>
                  </div>
                  <HitoPesosEditor iniciativaId={ini.id} />
                </CardContent>
              </Card>

              <EntityCustomFieldsCard entityType="iniciativa" entityId={ini.id} />
            </TabsContent>

            <TabsContent value="programas">
              <Card>
                <CardContent className="space-y-4 p-6 text-sm">
                  <p className="text-muted-foreground">
                    Navegación relacional hacia programas anuales por motor y tableros (spec §5).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/programas" className={linkSecondaryMd}>
                      Hub programas e iniciativas
                    </Link>
                    <Link href="/dashboards/programs" className={linkOutlineMd}>
                      Dashboard programas anuales
                    </Link>
                    <Link href="/programa_sasts" className={linkOutlineMd}>
                      Programas SAST
                    </Link>
                    <Link href="/programa_dasts" className={linkOutlineMd}>
                      Programas DAST
                    </Link>
                    <Link href="/programa_threat_modelings" className={linkOutlineMd}>
                      Threat modeling
                    </Link>
                    <Link href="/iniciativas/registros" className={linkOutlineMd}>
                      Registro de iniciativas
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageWrapper>
  );
}
