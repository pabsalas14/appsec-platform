# Mapeo formal Dashboards BRD 1–9 (diferido)

**Estado:** *borrador / backlog de producto* — no bloquea el cierre de fases **E, G, H** ni la auditoría de huecos en [`AUDITORIA_HUECOS_Y_ORDEN.md`](AUDITORIA_HUECOS_Y_ORDEN.md).  
**Cuándo retomar:** después de completar el orden de implementación acordado para E–G–H y cierres de fases ya trabajadas (C/D/F y P7–P12 según matriz).

En ese momento se completará: tabla 1–9 con **rutas reales**, **endpoints**, **criterio BRD §13.3 por fila** (tarjetas, tablas, tendencias, heatmaps), y checklist de aceptación de negocio.

## Referencia rápida (no sustituye el mapeo completo)

| # BRD | Ruta UI (aprox.) | Endpoint agregado (aprox.) |
|-------|------------------|----------------------------|
| 1 | `/dashboards/executive` | `GET /dashboard/executive` |
| 2 | `/dashboards/team` | `GET /dashboard/team` |
| 3 | `/dashboards/programs` | `GET /dashboard/programs` |
| 4 | `/dashboards/program-detail` | `GET /dashboard/program-detail` |
| 5 | `/dashboards/vulnerabilities` | `GET /dashboard/vulnerabilities` |
| 6–7 | `/dashboards/releases` | `GET /dashboard/releases-table`, `releases-kanban` |
| 8 | `/dashboards/initiatives` | `GET /dashboard/initiatives` |
| 9 | `/dashboards/emerging-themes` | `GET /dashboard/emerging-themes` |
| *Extra* | `/dashboards/hub` | — (no sustituye D5–D9) |

*Última copia alineada con [`ANALISIS_FASES_E_G_H.md` §5 (histórico)]; al activar este documento, validar en código y actualizar `MATRIZ_COBERTURA_BRD`.*
