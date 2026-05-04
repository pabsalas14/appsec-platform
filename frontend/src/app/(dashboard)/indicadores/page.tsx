'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LineChart, RefreshCw, Info } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Button,
  Card,
  CardContent,
  PageHeader,
  PageWrapper,
  Badge,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
} from '@/components/ui';
import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';

type FormulaRow = {
  id: string;
  code: string;
  nombre: string;
  motor: string;
  periodicidad: string;
};

type CalcRow = { code: string; nombre: string; value: number; status: string };

const ALL_MOTORS = '__all__';

export default function IndicadoresPage() {
  const searchParams = useSearchParams();
  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [madurez, setMadurez] = useState<{ score: number; max: number } | null>(null);
  const [calcs, setCalcs] = useState<Record<string, CalcRow | null>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [motor, setMotor] = useState<string>(ALL_MOTORS);

  const [manualCode, setManualCode] = useState('');
  const [manualPeriod, setManualPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [manualVal, setManualVal] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const [trendCode, setTrendCode] = useState('');
  const [trendSeries, setTrendSeries] = useState<{ period: string; value: number; manual: boolean }[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const loadFormulas = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [fr, m] = await Promise.all([
        api.get<{ data: FormulaRow[] }>('/indicadores_formulas'),
        api.get<{ data: { score: number; max: number } }>('/madurez/summary'),
      ]);
      setFormulas(fr.data?.data ?? []);
      setMadurez(m.data?.data ?? null);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Error al cargar indicadores'));
      logger.error('indicadores.load', { e });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFormulas();
  }, [loadFormulas]);

  useEffect(() => {
    const m = searchParams.get('motor')?.trim();
    if (m) setMotor(m);
  }, [searchParams]);

  const motors = useMemo(() => {
    const s = new Set((formulas ?? []).map((f) => (f.motor || 'General').trim() || 'General'));
    return Array.from(s).sort();
  }, [formulas]);

  const filtered = useMemo(() => {
    if (motor === ALL_MOTORS) return formulas;
    return formulas.filter((f) => (f.motor || 'General') === motor);
  }, [formulas, motor]);

  const filteredKey = useMemo(() => filtered.map((f) => f.code).join(','), [filtered]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!manualCode || !filtered.some((f) => f.code === manualCode)) {
      setManualCode(filtered[0].code);
    }
    if (!trendCode || !filtered.some((f) => f.code === trendCode)) {
      setTrendCode(filtered[0].code);
    }
  }, [filteredKey, filtered, manualCode, trendCode]);

  useEffect(() => {
    if (!trendCode) return;
    let cancelled = false;
    (async () => {
      setTrendLoading(true);
      try {
        const r = await api.get<{
          data: { series?: { period: string; value: number; manual: boolean }[] };
        }>(`/indicadores/${encodeURIComponent(trendCode)}/trend?months=12`);
        if (cancelled) return;
        setTrendSeries(r.data?.data?.series ?? []);
      } catch (e) {
        if (!cancelled) {
          logger.error('indicadores.trend', { e });
          setTrendSeries([]);
        }
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trendCode]);

  useEffect(() => {
    if (filtered.length === 0) return;
    let cancelled = false;
    (async () => {
      setCalculating(true);
      setErr(null);
      try {
        const results = await Promise.all(
          filtered.map((f) =>
            api
              .get<{ data: CalcRow }>(`/indicadores/${encodeURIComponent(f.code)}/calculate`)
              .then((r) => r.data?.data ?? null)
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        setCalcs((prev) => {
          const n = { ...prev };
          filtered.forEach((f, i) => {
            n[f.code] = results[i];
          });
          return n;
        });
      } catch (e) {
        if (!cancelled) {
          setErr(extractErrorMessage(e, 'Error al evaluar indicadores'));
          logger.error('indicadores.autocalc', { e });
        }
      } finally {
        if (!cancelled) setCalculating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filteredKey, filtered]);

  const noFormulasAtAll = !loading && formulas.length === 0;
  const noFormulasForMotor = !loading && formulas.length > 0 && filtered.length === 0;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Indicadores (KPIs)"
        description="Indicadores tipo 1: valor en tiempo real por fórmula. Filtra por motor. Tipo 2 (captura manual) e histórico 12M: pestañas inferiores."
      >
        <Link
          href="/indicadores_formulas"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]"
        >
          Definir fórmulas
        </Link>
      </PageHeader>

      <div
        className="mb-4 flex gap-2 rounded-lg border border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground"
        role="note"
      >
        <Info className="h-4 w-4 shrink-0 text-foreground" />
        <p>
          Códigos desde <span className="font-mono text-xs">indicadores_formulas</span> (sustituye placeholders por
          instancias reales, p. ej. SAST-001, vía admin/seed). Sin botones &quot;Calcular&quot; para tipo 1.
        </p>
      </div>

      {err ? <p className="text-destructive text-sm mb-2">{err}</p> : null}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <LineChart className="h-5 w-5 shrink-0 text-primary" />
          {madurez ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Score de madurez (resumen)</p>
              <p className="text-2xl font-semibold">
                {madurez.score} / {madurez.max}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              No hay resumen de madurez disponible (API sin datos o sin configurar). El score global aparece cuando{' '}
              <span className="font-mono text-xs">/madurez/summary</span> responde correctamente.
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadFormulas()}
            className="ml-auto shrink-0"
            disabled={loading}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refrescar datos
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full min-w-[200px] max-w-sm">
          <Select
            label="Motor"
            value={motor}
            onChange={(e) => setMotor(e.target.value)}
            options={[
              { value: ALL_MOTORS, label: 'Todos los motores' },
              ...motors.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
        {calculating ? (
          <span className="text-sm text-muted-foreground">Evaluando fórmulas…</span>
        ) : null}
      </div>

      <Tabs defaultValue="auto" className="space-y-4">
        <TabsList>
          <TabsTrigger value="auto">Indicadores automáticos (tipo 1)</TabsTrigger>
          <TabsTrigger value="manual">Captura manual (tipo 2)</TabsTrigger>
          <TabsTrigger value="history">Histórico 12 meses</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground">Cargando fórmulas…</p>
          ) : noFormulasAtAll ? (
            <Card className="border-dashed">
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm font-medium text-foreground">Aún no hay fórmulas de indicadores</p>
                <p className="text-sm text-muted-foreground">
                  Crea fórmulas en el catálogo para ver valores calculados aquí. Los códigos deben existir en{' '}
                  <span className="font-mono text-xs">indicadores_formulas</span>.
                </p>
                <Link
                  href="/indicadores_formulas"
                  className="inline-flex w-fit items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Ir a fórmulas de indicadores
                </Link>
              </CardContent>
            </Card>
          ) : noFormulasForMotor ? (
            <p className="text-muted-foreground">
              No hay fórmulas para el motor seleccionado. Cambia el filtro o añade una fórmula con ese motor en{' '}
              <Link href="/indicadores_formulas" className="font-medium text-primary underline-offset-4 hover:underline">
                Fórmulas de indicadores
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((f) => {
                const c = calcs[f.code];
                return (
                  <li key={f.id}>
                    <Card>
                      <CardContent className="pt-4 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm">{f.code}</span>
                        <span className="text-xs text-muted-foreground">({f.motor || '—'})</span>
                        <span className="text-sm flex-1">{f.nombre}</span>
                        {c ? (
                          <span className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Valor</span>
                            <strong>{typeof c.value === 'number' ? c.value.toFixed(2) : c.value}</strong>
                            <Badge
                              variant={
                                c.status === 'green' ? 'success' : c.status === 'yellow' ? 'severity' : 'default'
                              }
                            >
                              {c.status}
                            </Badge>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay indicadores en el motor seleccionado.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Captura manual por <span className="font-mono">(código, YYYY-MM)</span>. Se guarda vía{' '}
                    <span className="font-mono">PUT /indicadores/&#123;code&#125;/manual/&#123;periodo&#125;</span>.
                  </p>
                  <div className="grid max-w-xl gap-3">
                    <Select
                      label="Indicador"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      options={filtered.map((f) => ({ value: f.code, label: `${f.code} — ${f.nombre}` }))}
                    />
                    <Input
                      label="Periodo (YYYY-MM)"
                      value={manualPeriod}
                      onChange={(e) => setManualPeriod(e.target.value)}
                      placeholder="2026-04"
                    />
                    <Input
                      label="Valor numérico"
                      type="number"
                      step="any"
                      value={manualVal}
                      onChange={(e) => setManualVal(e.target.value)}
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground" htmlFor="manual-notes">
                        Notas (opcional)
                      </label>
                      <textarea
                        id="manual-notes"
                        className="min-h-[72px] w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={manualSaving || !manualCode || !manualPeriod}
                      onClick={async () => {
                        const v = parseFloat(manualVal);
                        if (Number.isNaN(v)) {
                          toast.error('Valor numérico inválido');
                          return;
                        }
                        setManualSaving(true);
                        try {
                          await api.put(`/indicadores/${encodeURIComponent(manualCode)}/manual/${encodeURIComponent(manualPeriod)}`, {
                            valor: v,
                            notas: manualNotes.trim() || null,
                          });
                          toast.success('Valor guardado');
                          logger.info('indicadores.manual.save', { code: manualCode, period: manualPeriod });
                          void loadFormulas();
                        } catch (e) {
                          toast.error(extractErrorMessage(e, 'No se pudo guardar'));
                          logger.error('indicadores.manual.save.failed', { e });
                        } finally {
                          setManualSaving(false);
                        }
                      }}
                    >
                      {manualSaving ? 'Guardando…' : 'Guardar captura'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay indicadores en el motor seleccionado.</p>
              ) : (
                <>
                  <div className="max-w-xs">
                    <Select
                      label="Indicador para serie 12M"
                      value={trendCode}
                      onChange={(e) => setTrendCode(e.target.value)}
                      options={filtered.map((f) => ({ value: f.code, label: `${f.code} — ${f.nombre}` }))}
                    />
                  </div>
                  {trendLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando serie…</p>
                  ) : trendSeries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin datos de serie.</p>
                  ) : (
                    <div className="h-72 w-full max-w-4xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={trendSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                        </RechartsLine>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
