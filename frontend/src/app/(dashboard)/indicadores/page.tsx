'use client';

import { LineChart, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button, Card, CardContent, PageHeader, PageWrapper, Badge } from '@/components/ui';
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

export default function IndicadoresPage() {
  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [madurez, setMadurez] = useState<{ score: number; max: number } | null>(null);
  const [calcs, setCalcs] = useState<Record<string, CalcRow | null>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
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
    void load();
  }, [load]);

  const evaluateOne = async (code: string) => {
    try {
      const r = await api.get<{ data: CalcRow }>(`/indicadores/${encodeURIComponent(code)}/calculate`);
      setCalcs((c) => ({ ...c, [code]: r.data?.data ?? null }));
    } catch (e) {
      logger.error('indicadores.calculate', { code, e });
      setErr(extractErrorMessage(e, 'Error al calcular'));
    }
  };

  const evaluateAll = async () => {
    for (const f of formulas) {
      await evaluateOne(f.code);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Indicadores (BRD §12.1)"
        description="Fórmulas y valores calculados. Madurez (§12.2) en resumen."
      />
      {err ? <p className="text-destructive text-sm mb-2">{err}</p> : null}
      {madurez ? (
        <Card className="mb-4">
          <CardContent className="pt-4 flex items-center gap-3">
            <LineChart className="h-5 w-5" />
            <div>
              <p className="text-sm text-muted-foreground">Score de madurez (E2)</p>
              <p className="text-2xl font-semibold">
                {madurez.score} / {madurez.max}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refrescar
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => void evaluateAll()} disabled={loading || formulas.length === 0} variant="primary">
          Calcular todos
        </Button>
        <Button onClick={() => void load()} variant="secondary" size="sm">
          Recargar fórmulas
        </Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        <ul className="space-y-2">
          {formulas.map((f) => {
            const c = calcs[f.code];
            return (
              <li key={f.id}>
                <Card>
                  <CardContent className="pt-4 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{f.code}</span>
                    <span className="text-sm flex-1">{f.nombre}</span>
                    <Button size="sm" variant="outline" onClick={() => void evaluateOne(f.code)}>
                      Calcular
                    </Button>
                    {c ? (
                      <span className="flex items-center gap-2 text-sm">
                        valor <strong>{c.value}</strong>
                        <Badge
                          variant={
                            c.status === 'green' ? 'success' : c.status === 'yellow' ? 'severity' : 'default'
                          }
                        >
                          {c.status}
                        </Badge>
                      </span>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageWrapper>
  );
}
