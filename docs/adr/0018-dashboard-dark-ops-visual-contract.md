# ADR-0018: Contrato visual «dark ops» para dashboards AppSec

- Status: accepted
- Date: 2026-05-02

## Context

Varios tableros de alto contenido (`/dashboards/kanban`, vulnerabilidades, liberaciones, temas emergentes) usaban **hex literales** para fondos y bordes, separados del shell shadcn/tema. Eso generaba dos «lenguajes» visuales y dificultaba mantener contraste y coherencia en claro/oscuro (ADR-0008 cubre el shell; no el contrato específico de dashboards densos).

## Decision

1. **Tokens CSS** en `frontend/src/app/globals.css`: `--dashboard-canvas`, `--dashboard-surface`, `--dashboard-elevated`, `--dashboard-border`, `--dashboard-accent`, `--dashboard-muted`, `--dashboard-on-strong`, definidos en `:root` y `.dark`, más utilidades `.dashboard-kpi-value` y `.dashboard-section-label`.
2. **Tailwind** (`tailwind.config.js`): colores `dashboard.*` como `hsl(var(--dashboard-*) / <alpha-value>)` para opacidades coherentes.
3. **Gráficos Recharts**: el hook `useDashboardChartTheme` lee las mismas variables vía `getComputedStyle` y alinea grid, ejes y tooltip con el tema activo (`next-themes`).
4. **Superficie UI**: las páginas de dashboards migradas sustituyen `bg-[#…]` / `border-[#…]` por clases `bg-dashboard-*`, `border-dashboard-*`, `text-dashboard-on-strong`, etc. Los **colores semánticos de datos** (severidad, motor, series apiladas) pueden permanecer como hex o tokens de chart cuando representan **codificación de datos**, no cromática de layout.
5. **Tipografía**: jerarquía preferente `text-xs` / `text-sm` y `dashboard-section-label` para etiquetas de sección; KPIs pueden usar `.dashboard-kpi-value` donde aplique.

## Consequences

- Los dashboards AppSec «premium» quedan **alineados al tema** sin copiar valores RGB en cada archivo.
- Cambiar la paleta globalmente implica editar variables CSS una vez.
- Nuevos tableros densos deben seguir este contrato en lugar de introducir nuevos hex de layout.

## Alternatives considered

- **Solo `muted` / `card` del tema**: rechazado — no bastaba para la densidad y el contraste pretendidos en tableros tipo SOC sin saturar los tokens genéricos.
- **Un tema Tailwind aparte por ruta**: rechazado — más complejidad de build y duplicación frente a variables CSS.
