# ADR-0020 — Sidebar en 11 secciones (Dashboard + Registros)

## Status

Accepted

## Context

La especificación maestra AppSec pide un patrón repetible: **vista de conjunto (dashboard)** + **registros /
captura** por dominio. El menú lateral debe reflejarlo sin duplicar rutas rotas ni mezclar módulos no
relacionados.

## Decision

La constante `SECTIONS` en `frontend/src/components/layout/Sidebar.tsx` se estructura en **once bloques**
numerados en el título visible:

1. Dashboards (ejecutivo, madurez, índice)  
2. Organización e inventario  
3. Gestión de vulnerabilidades (dashboard, registros, importación, planes, excepciones)  
4. Operación y liberaciones  
5. Programas anuales (+ iniciativas, auditorías, servicios regulados)  
6. Desempeño (OKR) con subgrupos Resumen / Registros  
7. Indicadores (KPIs + fórmulas)  
8. Code Security (SCR) — sección propia con 6 ítems  
9. Notificaciones (centro + preferencias)  
10. Administración (panel, operación BRD, roles, settings) — `adminOnly`  
11. Developer (kitchen sink, profile)

Cada ítem es un `href` a una página existente bajo `app/(dashboard)/`.

## Consequences

- Cambios de IA o de producto que añadan módulos deben decidir en qué sección viven y mantener el patrón
  dashboard + registros.
- Las rutas nuevas deben existir antes de enlazarlas (CI/manual: click-through del sidebar).
