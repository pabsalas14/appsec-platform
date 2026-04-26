'use client';

import { MiniSparkline } from './MiniSparkline';

const glow: Record<string, string> = {
  ok: 'shadow-[0_0_20px_rgba(52,211,153,0.2)] border-emerald-500/35',
  warning: 'shadow-[0_0_20px_rgba(251,191,36,0.18)] border-amber-500/40',
  critical: 'shadow-[0_0_24px_rgba(244,63,94,0.22)] border-rose-500/40',
};

const line: Record<string, string> = {
  ok: '#34d399',
  warning: '#fbbf24',
  critical: '#fb7185',
};

function syntheticSeries(percentage: number, status: 'ok' | 'warning' | 'critical') {
  const n = 10;
  const target = Math.max(3, Math.min(100, percentage));
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    const wobble = status === 'warning' ? 6 * Math.sin(i * 0.7) : status === 'critical' ? 4 * Math.cos(i * 0.5) : 0;
    return Math.max(0, Math.min(100, target * t * 0.85 + wobble));
  });
}

type Spark = {
  a_tiempo_pct: number[];
  en_riesgo_pct: number[];
  vencido_pct: number[];
};

function seriesForStatus(
  spark: Spark | undefined,
  status: 'ok' | 'warning' | 'critical',
  percentage: number,
): number[] {
  if (!spark) {
    return syntheticSeries(percentage, status);
  }
  const key =
    status === 'ok' ? 'a_tiempo_pct' : status === 'warning' ? 'en_riesgo_pct' : 'vencido_pct';
  const s = spark[key];
  if (s != null && s.length > 0) {
    return s;
  }
  return syntheticSeries(percentage, status);
}

export function SlaExecutiveCards({
  items,
  spark,
}: {
  items: Array<{
    status: 'ok' | 'warning' | 'critical';
    label: string;
    count: number;
    percentage: number;
  }>;
  /** Serie histórica (misma longitud que ventanas de tendencia) — backend `sla_spark`. */
  spark?: Spark;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => {
        const series = seriesForStatus(spark, it.status, it.percentage);
        return (
          <div
            key={it.status}
            className={`rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 ${glow[it.status]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{it.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {it.count}{' '}
                  <span className="text-sm font-medium text-slate-500">({it.percentage}%)</span>
                </p>
              </div>
              <div className="w-24 shrink-0">
                <MiniSparkline values={series} color={line[it.status] ?? '#94a3b8'} height={40} />
              </div>
            </div>
            {spark ? (
              <p className="mt-1 text-[9px] text-slate-500">Evolución % por ventana (criterio D2, snapshot por periodo)</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
