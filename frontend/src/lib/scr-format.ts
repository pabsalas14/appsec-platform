import type { CodeSecurityFinding, CodeSecurityReview } from '@/types';

export const SCR_SEVERITIES = ['CRITICO', 'ALTO', 'MEDIO', 'BAJO'] as const;

export const severityLabels: Record<string, string> = {
  CRITICO: 'Critical',
  critical: 'Critical',
  ALTO: 'High',
  high: 'High',
  MEDIO: 'Medium',
  medium: 'Medium',
  BAJO: 'Low',
  low: 'Low',
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ANALYZING: 'En ejecución',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  DETECTED: 'Abierto',
  IN_REVIEW: 'En revisión',
  IN_CORRECTION: 'En corrección',
  CORRECTED: 'Corregido',
  VERIFIED: 'Certificado',
  FALSE_POSITIVE: 'Falso positivo',
  CLOSED: 'Cerrado',
};

export function statusLabel(status: string | null | undefined) {
  return status ? statusLabels[status] ?? status : 'N/D';
}

export function severityLabel(severity: string | null | undefined) {
  return severity ? severityLabels[severity] ?? severity : 'N/D';
}

export function repoName(url?: string | null) {
  if (!url) return 'N/D';
  const cleaned = url.replace(/\.git$/, '');
  return cleaned.split('/').filter(Boolean).pop() ?? cleaned;
}

export function scanModeLabel(mode: string | null | undefined) {
  const labels: Record<string, string> = {
    PUBLIC_URL: 'URL pública',
    REPO_TOKEN: 'Repositorio privado',
    BRANCH_TARGET: 'Rama específica',
    ORG_BATCH: 'Organización',
  };
  return mode ? labels[mode] ?? mode : 'N/D';
}

export function formatDate(value?: string | null) {
  if (!value) return 'N/D';
  return new Date(value).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function confidencePercent(value?: number | null) {
  if (typeof value !== 'number') return 'N/D';
  return `${Math.round(value * 100)}%`;
}

export function formatDuration(ms?: number | null) {
  if (!ms || ms <= 0) return 'N/D';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${minutes}m ${seconds}s`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatUsd(value?: number | null) {
  if (typeof value !== 'number') return '$0.00';
  return `$${value.toFixed(value > 0 && value < 0.01 ? 4 : 2)}`;
}

export function getConfigString(review: CodeSecurityReview, keys: string[]) {
  const config = review.scr_config;
  if (!config) return null;
  for (const key of keys) {
    const value = config[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

export function severityCounts(findings: CodeSecurityFinding[]) {
  return {
    critical: findings.filter((finding) => finding.severidad === 'CRITICO' || finding.severidad === 'critical').length,
    high: findings.filter((finding) => finding.severidad === 'ALTO' || finding.severidad === 'high').length,
    medium: findings.filter((finding) => finding.severidad === 'MEDIO' || finding.severidad === 'medium').length,
    low: findings.filter((finding) => finding.severidad === 'BAJO' || finding.severidad === 'low').length,
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
