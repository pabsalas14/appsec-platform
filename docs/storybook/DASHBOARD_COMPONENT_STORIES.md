# Storybook Components D2-D4

Guía de historias objetivo para validar visualmente componentes críticos de dashboards D2-D4.

## Alcance

- `frontend/src/components/charts/SemaforoSla.tsx`
- `frontend/src/components/charts/HistoricoMensualGrid.tsx`
- `frontend/src/components/charts/GaugeChart.tsx`
- `frontend/src/components/charts/DrilldownBreadcrumb.tsx`

## Historias mínimas requeridas

### SemaforoSla

- `DefaultHorizontal`: 3 estados (`ok`, `warning`, `critical`) con porcentajes.
- `VerticalNoPercent`: layout vertical sin porcentaje.
- `SlateTheme`: apariencia `slate` para dashboard ejecutivo oscuro.
- `ZeroData`: conteos en cero para validar estado vacío.

### HistoricoMensualGrid

- `FullYearMixed`: 12 meses con valores heterogéneos.
- `AllZero`: grilla vacía controlada.
- `HighDensity`: valores altos para contraste visual.

### GaugeChart

- `LowRisk`: valor 25.
- `MediumRisk`: valor 60.
- `HighRisk`: valor 90.
- `SmallSize`: render compacto para tarjetas.

### DrilldownBreadcrumb

- `ThreeLevels`: Dirección > Subdirección > Gerencia.
- `DeepHierarchy`: 7 niveles completos de drill-down.
- `SingleLevel`: estado base.

## Criterios de aceptación visual

- Los componentes reaccionan correctamente a `dark mode`.
- Los colores de estado son consistentes con tokens del sistema.
- No hay desbordes en viewport móvil (`390x844`).
- Las variantes quedan aptas para ser usadas en `/kitchen-sink`.

## Integración sugerida

1. Inicializar Storybook en `frontend` (`npx storybook@latest init`) cuando se habilite en CI.
2. Agregar historias `.stories.tsx` para los componentes listados.
3. Publicar snapshot visual como parte de QA de dashboards.
