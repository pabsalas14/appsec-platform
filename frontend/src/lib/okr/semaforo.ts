export type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

export const OKR_SEMAFORO_UMBRAL = {
  verde: 85,
  amarillo: 70,
} as const;

export function getSemaforoColor(score: number | null | undefined): SemaforoColor {
  const safeScore = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  if (safeScore >= OKR_SEMAFORO_UMBRAL.verde) return 'verde';
  if (safeScore >= OKR_SEMAFORO_UMBRAL.amarillo) return 'amarillo';
  return 'rojo';
}

export function getSemaforoLabel(score: number | null | undefined): string {
  const color = getSemaforoColor(score);
  if (color === 'verde') return 'Verde';
  if (color === 'amarillo') return 'Amarillo';
  return 'Rojo';
}

export function getSemaforoBadgeClass(score: number | null | undefined): string {
  const color = getSemaforoColor(score);
  if (color === 'verde') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (color === 'amarillo') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

export function getSemaforoProgressClass(score: number | null | undefined): string {
  const color = getSemaforoColor(score);
  if (color === 'verde') return '[&>div]:bg-emerald-500';
  if (color === 'amarillo') return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}
