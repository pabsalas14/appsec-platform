'use client';

import { useCallback, useMemo, useState } from 'react';

import { Button, Input } from '@/components/ui';

const DEFAULT_ORDER = ['SAST', 'DAST', 'SCA', 'CDS', 'MDA'] as const;

type DisplayShape = {
  order: string[];
  labels: Record<string, string>;
  colors: Record<string, string>;
};

function parseDisplay(jsonText: string): DisplayShape | null {
  try {
    const raw = JSON.parse(jsonText || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const order = Array.isArray(raw.order)
      ? raw.order.map((x: unknown) => String(x).trim().toUpperCase()).filter(Boolean)
      : [...DEFAULT_ORDER];
    const labels =
      raw.labels && typeof raw.labels === 'object' && !Array.isArray(raw.labels)
        ? Object.fromEntries(
            Object.entries(raw.labels as Record<string, unknown>).map(([k, v]) => [
              String(k).trim().toUpperCase(),
              typeof v === 'string' ? v : '',
            ]),
          )
        : {};
    const colors =
      raw.colors && typeof raw.colors === 'object' && !Array.isArray(raw.colors)
        ? Object.fromEntries(
            Object.entries(raw.colors as Record<string, unknown>).map(([k, v]) => [
              String(k).trim().toUpperCase(),
              typeof v === 'string' ? v : '',
            ]),
          )
        : {};
    return { order: order.length ? order : [...DEFAULT_ORDER], labels, colors };
  } catch {
    return null;
  }
}

export function AnnualProgramDisplayEditor({
  jsonText,
  onJsonChange,
}: {
  jsonText: string;
  onJsonChange: (next: string) => void;
}) {
  const parsed = useMemo(() => parseDisplay(jsonText), [jsonText]);
  const [newMotor, setNewMotor] = useState('');

  const pushShape = useCallback(
    (next: DisplayShape) => {
      onJsonChange(JSON.stringify(next, null, 2));
    },
    [onJsonChange],
  );

  const motorsOrdered = useMemo(() => {
    if (!parsed) return [...DEFAULT_ORDER];
    const seen = new Set(parsed.order);
    const extra = Object.keys(parsed.labels).filter((k) => !seen.has(k));
    return [...parsed.order, ...extra.sort()];
  }, [parsed]);

  if (!parsed) {
    return (
      <p className="text-sm text-destructive">
        JSON inválido: corrige el texto o restaura el valor por defecto.
      </p>
    );
  }

  const setLabel = (motor: string, label: string) => {
    pushShape({
      ...parsed,
      labels: { ...parsed.labels, [motor]: label },
    });
  };

  const setColor = (motor: string, color: string) => {
    pushShape({
      ...parsed,
      colors: { ...parsed.colors, [motor]: color },
    });
  };

  const move = (motor: string, dir: -1 | 1) => {
    const ix = parsed.order.indexOf(motor);
    if (ix < 0) return;
    const j = ix + dir;
    if (j < 0 || j >= parsed.order.length) return;
    const order = [...parsed.order];
    [order[ix], order[j]] = [order[j], order[ix]];
    pushShape({ ...parsed, order });
  };

  const addMotor = (raw: string) => {
    const m = raw.trim().toUpperCase();
    if (!m || parsed.order.includes(m)) return;
    pushShape({
      ...parsed,
      order: [...parsed.order, m],
      labels: { ...parsed.labels, [m]: parsed.labels[m] ?? m },
      colors: { ...parsed.colors, [m]: parsed.colors[m] ?? '#6b7280' },
    });
  };

  const removeMotor = (motor: string) => {
    pushShape({
      ...parsed,
      order: parsed.order.filter((x) => x !== motor),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Los códigos (SAST, DAST, …) deben coincidir con los motores en datos de vulnerabilidades. Solo cambia textos y
        colores del dashboard.
      </p>
      <div className="space-y-3">
        {motorsOrdered.map((motor) => (
          <div
            key={motor}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-white/[0.08] bg-background/50 p-3"
          >
            <div className="min-w-[72px] font-mono text-xs font-semibold text-primary">{motor}</div>
            <div className="min-w-[200px] flex-1">
              <label className="text-[10px] uppercase text-muted-foreground">Nombre visible</label>
              <Input
                className="mt-0.5 border-white/[0.08] bg-background/80"
                value={parsed.labels[motor] ?? ''}
                onChange={(e) => setLabel(motor, e.target.value)}
              />
            </div>
            <div className="w-[120px]">
              <label className="text-[10px] uppercase text-muted-foreground">Color</label>
              <Input
                type="color"
                className="mt-0.5 h-10 cursor-pointer border-white/[0.08] bg-background/80 p-1"
                value={parsed.colors[motor]?.startsWith('#') ? parsed.colors[motor] : '#6b7280'}
                onChange={(e) => setColor(motor, e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" className="border-white/[0.12]" onClick={() => move(motor, -1)}>
                ↑
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-white/[0.12]" onClick={() => move(motor, 1)}>
                ↓
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeMotor(motor)}>
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="Código motor (ej. SAST)"
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
          Añadir fila
        </Button>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Editor JSON crudo</summary>
        <textarea
          className="mt-2 min-h-[120px] w-full rounded-lg border border-white/[0.08] bg-background/80 px-3 py-2 font-mono leading-relaxed shadow-inner"
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          spellCheck={false}
        />
      </details>
    </div>
  );
}
