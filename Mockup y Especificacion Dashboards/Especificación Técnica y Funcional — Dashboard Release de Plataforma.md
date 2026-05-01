# Especificación Técnica y Funcional — Dashboard Release de Plataforma

**Versión:** 1.0  
**Módulo:** Administración › Release de Plataforma  
**Acceso:** Solo Admin y Jefe de AppSec

---

## 1. Propósito

Proveer visibilidad completa sobre el ciclo de vida de la propia plataforma AppSec: versiones liberadas, funcionalidades entregadas, bugs corregidos, roadmap del sprint actual y estadísticas de calidad del software. Es el dashboard de "meta-gestión" de la herramienta.

---

## 2. Estructura General de la Pantalla

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Breadcrumb | Changelog Completo | Exportar              │
├─────────────────────────────────────────────────────────────────┤
│ BANNER DE VERSIÓN ACTUAL: Versión + Nombre + Fecha + Stats      │
├─────────────────────────────────────────────────────────────────┤
│ KPI ROW (5 tarjetas): Total Releases | Funcionalidades |        │
│ Correcciones | Próximo Release | En Desarrollo                  │
├─────────────────────────────────────────────────────────────────┤
│ ROADMAP KANBAN (4 columnas): Planificado | En Desarrollo |      │
│ En QA | Listo para Liberar                                      │
├──────────────────────────────┬──────────────────────────────────┤
│ Gráfica: Historial de        │ Estadísticas del Año             │
│ Releases (barras horizontales│ (mini-stats)                     │
│ por versión)                 │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│ CHANGELOG DETALLADO (acordeón por versión)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Topbar

**Posición:** Barra superior fija, altura 44px.

**Elementos:**
- **Breadcrumb:** `Inicio › Release de Plataforma`.
- **Botón Changelog Completo:** Abre un modal con el historial completo de todas las versiones desde el inicio de la plataforma.
- **Botón Exportar:** Descarga el changelog del año en PDF o CSV.

---

## 4. Banner de Versión Actual

**Posición:** Sección destacada debajo del topbar, fondo con gradiente oscuro.

**Contenido:**
- **Badge de Versión:** Número de versión actual (ej. `v2.4.1`) en verde con fondo oscuro.
- **Nombre del Release:** Nombre descriptivo de la versión.
- **Fecha de Liberación:** Fecha en que se liberó a producción.
- **Estadísticas del Release:** 4 contadores en la parte derecha: Nuevas Funciones (verde), Mejoras (azul), Correcciones (amarillo), Bugs Críticos (rojo). Si Bugs Críticos > 0, el número parpadea en rojo.

---

## 5. KPI Cards

Fila de 5 tarjetas. Cada tarjeta es clickeable y abre el Panel de Drill-down correspondiente.

| Tarjeta | Descripción | Color |
|---|---|---|
| Total Releases | Count de versiones liberadas en el año | Azul |
| Funcionalidades | Count de funcionalidades entregadas en el año | Verde |
| Correcciones | Count de bug fixes en el año | Amarillo |
| Próximo Release | Número de versión y fecha del próximo release | Morado |
| En Desarrollo | Count de features actualmente en desarrollo | Naranja |

---

## 6. Roadmap Kanban

**Posición:** Sección debajo de los KPIs, ancho completo.

El roadmap muestra el estado del sprint actual en 4 columnas:

| Columna | Color | Descripción |
|---|---|---|
| **Planificado** | Azul | Features aprobadas para el próximo release pero no iniciadas |
| **En Desarrollo** | Amarillo | Features en construcción activa |
| **En QA / Testing** | Morado | Features terminadas en proceso de pruebas |
| **Listo para Liberar** | Verde | Features aprobadas por QA, esperando el release |

**Tarjetas del Roadmap:**
- Título de la funcionalidad.
- Tipo: Nueva Función / Mejora / Corrección.
- Versión Target.

**Interacción:** Clic en cualquier tarjeta → Abre el Drawer de Detalle de la Feature con descripción completa, módulo afectado, tipo y versión target.

---

## 7. Gráfica: Historial de Releases

**Tipo:** Bar chart horizontal.
**Posición:** Fila de gráficas, columna izquierda (2/3 del ancho).
**Eje Y:** Versiones (de más reciente a más antigua).
**Eje X:** Número de cambios.
**Series:** Nuevas Funciones (verde), Mejoras (azul), Correcciones (amarillo).
**Interacción:** Clic en cualquier barra → Abre el acordeón de esa versión en el Changelog.

---

## 8. Estadísticas del Año

**Tipo:** Lista de métricas clave.
**Posición:** Fila de gráficas, columna derecha (1/3 del ancho).

| Métrica | Descripción |
|---|---|
| Total Releases | Count del año |
| Funcionalidades entregadas | Count total de features |
| Bug fixes | Count total de correcciones |
| Incidentes en producción | Count de incidentes causados por releases |
| Tiempo promedio entre releases | Promedio de días entre versiones |
| Uptime de la plataforma | % de disponibilidad del año |

---

## 9. Changelog Detallado (Acordeón)

**Posición:** Sección inferior, ancho completo.

Cada versión se muestra como un elemento de acordeón colapsable:

**Cabecera del acordeón (siempre visible):**
- Número de versión (monospace).
- Nombre descriptivo del release.
- Fecha de liberación.
- Badges de conteo: `X Nuevas`, `X Mejoras`, `X Fixes`.

**Cuerpo del acordeón (al expandir):**
El contenido se organiza en 3 grupos:

**✨ Nuevas Funcionalidades:** Lista de features nuevas, cada una con:
- Ícono de categoría.
- Descripción de la funcionalidad.
- Módulo afectado (en gris debajo de la descripción).

**🔧 Mejoras:** Lista de mejoras a funcionalidades existentes, con el mismo formato.

**🐛 Correcciones:** Lista de bugs corregidos, con el mismo formato.

---

## 10. Drawer de Detalle de Feature

**Activación:** Clic en cualquier tarjeta del Roadmap.
**Posición:** Panel lateral derecho, ancho 520px.

**Contenido:**
- Título de la feature.
- Descripción completa.
- Tipo (Nueva Función / Mejora / Corrección).
- Versión Target.
- Estatus actual (Planificado / En Desarrollo / En QA / Listo).
- Módulo(s) afectado(s).

---

## 11. Reglas de Negocio

1. **Versión Actual:** El banner siempre muestra la versión con la fecha de liberación más reciente en ambiente de producción.
2. **Roadmap:** Solo los usuarios con rol Admin pueden mover tarjetas entre columnas del roadmap.
3. **Changelog Inmutable:** Una vez que una versión es liberada a producción, su changelog no puede ser editado. Solo se pueden agregar notas de post-release.
4. **Incidentes:** Si un release genera un incidente en producción, se registra automáticamente en el contador de "Incidentes en prod." y se vincula al changelog de esa versión.

---

## 12. Permisos por Rol

| Acción | Analista | Coordinador | Jefe | Admin |
|---|---|---|---|---|
| Ver dashboard | ✗ | ✗ | ✓ | ✓ |
| Ver changelog | ✗ | ✗ | ✓ | ✓ |
| Mover tarjetas del roadmap | ✗ | ✗ | ✗ | ✓ |
| Crear/editar features del roadmap | ✗ | ✗ | ✗ | ✓ |
| Exportar | ✗ | ✗ | ✓ | ✓ |
