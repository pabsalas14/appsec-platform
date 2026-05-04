'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Colores Recharts alineados a variables `--dashboard-*` (ADR-0018).
 * Las series de datos pueden seguir usando paletas semánticas (motor, severidad).
 */
export function useDashboardChartTheme() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    grid: 'hsl(228 22% 26%)',
    axis: 'hsl(215 16% 47%)',
    tooltipBg: 'hsl(234 32% 8%)',
    tooltipBorder: 'hsl(228 22% 26%)',
    tooltipFg: 'hsl(214 32% 91%)',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const styles = getComputedStyle(document.documentElement);
    const hsl = (name: string, fallback: string) => {
      const raw = styles.getPropertyValue(name).trim();
      return raw ? `hsl(${raw})` : fallback;
    };
    setColors({
      grid: hsl('--dashboard-border', 'hsl(228 22% 26%)'),
      axis: hsl('--dashboard-muted', 'hsl(215 16% 47%)'),
      tooltipBg: hsl('--dashboard-canvas', 'hsl(234 32% 8%)'),
      tooltipBorder: hsl('--dashboard-border', 'hsl(228 22% 26%)'),
      tooltipFg: hsl('--dashboard-on-strong', 'hsl(214 32% 91%)'),
    });
  }, [resolvedTheme]);

  return colors;
}
