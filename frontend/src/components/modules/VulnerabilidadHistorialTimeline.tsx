'use client';

import { HistorialVulnerabilidadSchema, type HistorialVulnerabilidad } from '@/lib/schemas/historial_vulnerabilidad.schema';
import { formatDate } from '@/lib/utils';

function parseEntries(raw: unknown): HistorialVulnerabilidad[] {
  if (!Array.isArray(raw)) return [];
  const out: HistorialVulnerabilidad[] = [];
  for (const row of raw) {
    const r = HistorialVulnerabilidadSchema.safeParse(row);
    if (r.success) out.push(r.data);
  }
  return out;
}

function describe(h: HistorialVulnerabilidad): string {
  const prev = (h.estado_anterior ?? '').trim() || '—';
  const next = (h.estado_nuevo ?? '').trim() || '—';
  if (prev !== '—' || next !== '—') {
    return `Estado: ${prev} → ${next}`;
  }
  if (h.responsable_id) {
    return `Responsable actualizado (${h.responsable_id.slice(0, 8)}…)`;
  }
  return 'Actualización';
}

type Props = {
  raw: unknown;
  isLoading?: boolean;
  compact?: boolean;
};

export function VulnerabilidadHistorialTimeline({ raw, isLoading, compact }: Props) {
  const entries = parseEntries(raw);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Cargando bitácora…</p>;
  }

  if (!entries.length) {
    return (
      <p className={compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>
        Sin movimientos en el historial todavía.
      </p>
    );
  }

  return (
    <ul className={`space-y-3 border-l border-border/80 ${compact ? 'pl-3' : 'pl-4'}`}>
      {entries.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-primary/80" aria-hidden />
          <time className="block text-[11px] text-muted-foreground">{formatDate(h.created_at)}</time>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-foreground`}>{describe(h)}</p>
          {h.comentario ? (
            <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{h.comentario}</p>
          ) : null}
          {h.justificacion ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground italic">Justificación: {h.justificacion}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
