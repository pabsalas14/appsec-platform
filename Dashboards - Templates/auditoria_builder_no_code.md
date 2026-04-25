# Plataforma 100% Builder — Auditoría de Capacidades No-Code

## Visión

Hacer que la plataforma sea **100% configurable, personalizable y parametrizable sin tocar código**: dashboards, módulos, campos, fórmulas, flujos, IA, vistas, navegación, branding, logo, nombre y paleta de colores. Todo gestionable por administradores desde la UI, con control de perfilamiento por rol.

---

## Auditoría: ¿Qué ya es Builder y qué falta?

### ✅ Ya es Builder (Configurable sin código)

| Capacidad | Mecanismo Actual | Dónde |
|-----------|-----------------|-------|
| **Proveedor IA** (Ollama/OpenAI/Anthropic/OpenRouter) | Admin UI → `system_settings` keys `ia.*` | `ia_config.py`, `ia_provider.py` |
| **Modelo, temperatura, max_tokens IA** | Admin UI → JSONB | `ia_config.py` |
| **Flujos de estatus** (qué transiciones están permitidas) | Tabla `flujos_estatus` configurable | `FlujoEstatus` model |
| **Reglas SoD** (quién no puede aprobar lo que creó) | Tabla `regla_sods` configurable | `ReglaSoD` model |
| **SLAs por severidad** | JSONB en `system_settings` | `json_setting.py` |
| **Indicadores y fórmulas** (scoring KPIs) | Tabla `indicadores_formulas` con JSON | `IndicadorFormula` model |
| **Filtros guardados** | Por usuario, compartibles | `FiltroGuardado` model |
| **Visibilidad de widgets por rol** | `dashboard_configs` tabla | ya operativo en frontend |
| **Catálogos CSV** (import/export/plantilla) | `CatalogCsvToolbar` en cada módulo | `csvDownload.ts` |
| **Etapas de release** | Tabla `etapa_releases` | configurable por release |
| **System Settings** (JSONB key/value) | Admin UI CRUD | `SystemSetting` model |
| **Roles y Permisos** | M:N `roles ↔ permissions` | `role.py`, admin UI |
| **Columnas Kanban releases** | `system_settings` key `operacion.config` | `useOperacionConfig.ts` |

### ❌ NO es Builder (Requiere código para cambiar)

| Capacidad | Estado Actual | Impacto |
|-----------|--------------|---------|
| **Crear nuevos dashboards** | Hardcoded en 8 rutas frontend | ⬆ Alto — Builder de dashboards |
| **Layout de dashboards** (reordenar secciones, agregar widgets) | Layout fijo en JSX | ⬆ Alto — react-grid-layout |
| **Crear nuevas vistas/páginas** en módulos | Requiere crear `page.tsx` | ⬆ Alto — Module View Builder |
| **Agregar campos custom a entidades** | Requiere migración SQL + schema | ⬆ Alto — Custom Fields |
| **Fórmulas calculadas** (mostrar campo derivado sin SQL) | `IndicadorFormula` existe pero no renderiza | ⬆ Medio — Formula engine |
| **Ocultar/mostrar columnas** en tablas | No implementado | ⬆ Medio — Column Toggle |
| **Reordenar columnas** por D&D | No implementado | ⬆ Medio — Column D&D |
| **Vistas guardadas** (filtros+columnas+sort como preset) | `FiltroGuardado` solo guarda filtros | ⬆ Medio — Extender modelo |
| **Campos visibles por rol** en formularios/tablas | No implementado | ⬆ Medio — Field Visibility |
| **Prompts IA personalizables** | Hardcoded en `fp_triage_service.py` y `threat_modeling_service.py` | ⬆ Alto — Prompt Builder |
| **Triggers IA** (cuándo ejecutar IA automáticamente) | Hardcoded en endpoints específicos | ⬆ Alto — Automation Rules |
| **Acciones IA** (qué hacer con la respuesta IA) | Hardcoded (clasificar, sugerir) | ⬆ Alto — Action Builder |
| **Navegación sidebar** | Hardcoded en `Sidebar.tsx` | ⬆ Medio — Dynamic Menu |
| **Reportes** | No existe módulo | ⬆ Alto — Report Builder |
| **Notificaciones/alertas configurables** | Modelo existe pero triggers hardcoded | ⬆ Medio — Alert Rules |
| **Workflows multi-paso** (aprobaciones en cadena) | Solo SoD + etapas release | ⬆ Alto — Workflow Engine |

---

## Capas Builder Propuestas (9 Capas)

### Capa 1: Dashboard Builder ✅ (ya propuesto)
> `react-grid-layout` + catálogo de widgets + fuentes de datos + layout JSON

### Capa 2: Module View Builder 🆕
Permitir crear/editar **vistas personalizadas** dentro de cualquier módulo sin código.

```jsonc
// Vista guardada como JSON en DB
{
  "id": "uuid",
  "module": "vulnerabilidads",
  "nombre": "Críticas SLA Vencido",
  "tipo": "table",          // "table" | "kanban" | "calendar" | "cards"
  "columns": [
    { "field": "titulo", "width": 300, "order": 0 },
    { "field": "severidad", "width": 100, "order": 1, "chipColor": true },
    { "field": "estado", "width": 120, "order": 2 },
    { "field": "dias_sla", "width": 80, "order": 3, "formula": "days_until(fecha_limite_sla)" },
    { "field": "responsable.full_name", "width": 150, "order": 4 }
  ],
  "filters": { "severidad": "CRITICA", "sla_status": "vencido" },
  "sort": { "key": "fecha_limite_sla", "dir": "asc" },
  "groupBy": null,
  "pageSize": 25
}
```

**Tipos de vista por módulo**:
- **Tabla** — columnas configurables, sort, filtros, paginación
- **Kanban** — columnas = valores de un campo enum, tarjetas arrastrables
- **Calendario** — basado en un campo fecha del módulo
- **Cards** — vista de tarjetas con KPIs por registro

### Capa 3: Custom Fields 🆕
Agregar campos personalizados a cualquier entidad **sin migración SQL**.

```python
class CustomField(Base):
    __tablename__ = "custom_fields"
    
    id: UUID (PK)
    entity_type: str(100)        # "vulnerabilidad", "service_release", etc.
    field_name: str(100)         # "campo_custom_1"
    label: str(255)              # "Responsable Negocio"
    field_type: str(50)          # "text" | "number" | "date" | "select" | "multiselect" | "user_ref" | "boolean" | "url"
    options: dict|None (JSONB)   # para select: ["Opción A", "Opción B"]
    required: bool = False
    default_value: str|None
    orden: int = 0
    visible_roles: list[str]|None (JSONB)  # null = todos
    created_by: UUID → FK(users.id)

class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"
    
    id: UUID (PK)
    custom_field_id: UUID → FK(custom_fields.id)
    entity_id: UUID              # ID del registro (vulnerabilidad, release, etc.)
    value: dict (JSONB)          # valor flexible
```

El frontend **renderiza automáticamente** los custom fields al final de cada formulario y como columnas opcionales en tablas.

### Capa 4: Formula Engine 🆕
Extender `IndicadorFormula` para que las fórmulas se puedan evaluar dinámicamente como columnas calculadas.

```jsonc
// Fórmula definida por admin
{
  "code": "dias_restantes_sla",
  "formula": "days_between(now(), entity.fecha_limite_sla)",
  "output_type": "number",
  "display": {
    "format": "integer",
    "semaforo": { "green": ">7", "yellow": "3-7", "red": "<3" }
  }
}
```

**Funciones soportadas** (sandbox seguro, sin `eval`):
- `count(entity.relation)` — contar relaciones
- `sum(entity.relation.field)` — sumar campo de relación
- `days_between(date1, date2)` — diferencia en días
- `days_until(date)` — días hasta fecha
- `percentage(a, b)` — a/b × 100
- `if(condition, then, else)` — condicional
- `coalesce(a, b)` — primer no-null

### Capa 5: AI Platform (Registro de Proveedores + Modelos + Automation Builder) 🆕

La IA se divide en **3 sub-capas** para que todo sea plug & play desde la UI:

#### 5A. Registro de Proveedores IA

Catálogo de proveedores dados de alta. El admin registra un proveedor con su API key y endpoint, y queda disponible para toda la plataforma.

```python
class IAProviderRegistry(Base):
    __tablename__ = "ia_provider_registry"
    
    id: UUID (PK)
    nombre: str(100)              # "OpenAI Producción", "Ollama Local", "Anthropic Enterprise"
    tipo: str(50)                 # "openai" | "anthropic" | "ollama" | "openrouter" | "azure_openai" | "google_vertex" | "custom"
    base_url: str(500)            # "https://api.openai.com/v1" o "http://ollama:11434"
    api_key_encrypted: str|None   # cifrado en BD, solo super_admin ve/edita
    headers_extra: dict|None      # headers custom para APIs privadas
    activo: bool = True
    is_default: bool = False      # proveedor por defecto si la regla no especifica
    health_status: str(20)        # "healthy" | "degraded" | "offline" | "unknown"
    last_health_check: datetime|None
    max_requests_per_minute: int|None  # rate limiting
    created_by: UUID → FK(users.id)
    created_at: datetime
```

**UI Admin → Proveedores IA**:
- Lista de proveedores registrados con health badge (🟢/🟡/🔴)
- Botón "+ Nuevo Proveedor" → formulario con tipo, URL, API key
- Botón "Test Conexión" que hace health check en vivo
- Toggle activo/inactivo
- Indicador de uso (llamadas/mes, tokens consumidos)

#### 5B. Catálogo de Modelos

Cada proveedor puede tener múltiples modelos dados de alta. El admin registra qué modelos están disponibles.

```python
class IAModelCatalog(Base):
    __tablename__ = "ia_model_catalog"
    
    id: UUID (PK)
    provider_id: UUID → FK(ia_provider_registry.id)
    code: str(100)                # "gpt-4o", "claude-sonnet-4-20250514", "llama3.1:8b"
    nombre_display: str(255)      # "GPT-4o (rápido)", "Claude Sonnet (análisis profundo)"
    descripcion: str|None         # "Mejor para clasificación de vulns, rápido y económico"
    
    # Capacidades
    max_tokens: int = 4096
    soporta_vision: bool = False   # puede analizar imágenes
    soporta_tools: bool = False    # function calling
    context_window: int = 128000
    
    # Costos (para tracking)
    costo_input_per_1k: float|None    # USD por 1K tokens input
    costo_output_per_1k: float|None   # USD por 1K tokens output
    
    # Configuración default
    temperatura_default: float = 0.3
    activo: bool = True
    es_default: bool = False      # modelo default del proveedor
    
    created_by: UUID → FK(users.id)
```

**UI Admin → Modelos IA**:
- Agrupados por proveedor
- Botón "+ Nuevo Modelo" → seleccionar proveedor, código del modelo, nombre amigable
- Botón "Probar Modelo" → campo de prompt rápido + respuesta en vivo
- Badges: 🏷️ tokens, 💰 costo, ⚡ velocidad
- Para Ollama: botón "Sincronizar modelos disponibles" que llama a `/api/tags`

#### 5C. Reglas de Automatización IA

Ahora las reglas referencian proveedor y modelo del catálogo por dropdown, no por string hardcoded:

```python
class IAAutomationRule(Base):
    __tablename__ = "ia_automation_rules"
    
    id: UUID (PK)
    nombre: str(255)
    activo: bool = True
    
    # ¿CON QUÉ proveedor/modelo? (dropdown del catálogo)
    model_id: UUID → FK(ia_model_catalog.id)   # Seleccionar modelo del catálogo
    temperatura: float = 0.3
    max_tokens: int = 4096
    
    # ¿CUÁNDO se ejecuta?
    trigger_type: str(50)        # "on_create" | "on_update" | "on_schedule" | "manual"
    trigger_entity: str(100)     # "vulnerabilidad", "hallazgo_sast", etc.
    trigger_conditions: dict     # {"fuente": "SAST", "severidad": ["CRITICA", "ALTA"]}
    
    # ¿QUÉ prompt usa?
    prompt_template: str(TEXT)   # "Analiza la vulnerabilidad {{titulo}} con CVSS {{cvss_score}}..."
    system_prompt: str|None
    
    # ¿QUÉ hace con la respuesta?
    action_type: str(50)         # "classify" | "enrich" | "suggest" | "auto_update" | "notify"
    action_config: dict (JSONB)
    
    created_by: UUID → FK(users.id)
```

#### Flujo completo del admin (sin código):

```
1. Admin → Proveedores IA → "+ Nuevo" → Registra "OpenAI Prod" con API key → Test ✅
2. Admin → Modelos IA → "+ Nuevo" → Selecciona "OpenAI Prod" → Agrega "gpt-4o" → Probar con prompt rápido ✅
3. Admin → Modelos IA → "+ Nuevo" → Selecciona "OpenAI Prod" → Agrega "gpt-4o-mini" (económico) ✅
4. Admin → Reglas IA → "+ Nueva Regla":
   - Nombre: "Triage automático SAST"
   - Modelo: [dropdown] → "gpt-4o-mini (económico)"
   - Trigger: Al crear vulnerabilidad con fuente=SAST
   - Prompt: "Clasifica si es falso positivo: {{titulo}}, CWE: {{cwe_id}}..."
   - Acción: Escribir en campo `ia_clasificacion`
   - [Probar con registro existente] → ve respuesta en vivo → ✅ Activar
```

**Ejemplo de reglas configurables desde la UI**:

| Regla | Modelo | Trigger | Prompt | Acción |
|-------|--------|---------|--------|--------|
| Triage SAST | gpt-4o-mini | Al crear vuln SAST | "Clasifica FP: {{titulo}}, CWE: {{cwe_id}}..." | Campo `ia_clasificacion` |
| Amenazas TM | claude-sonnet | Manual en sesión TM | "Sugiere STRIDE para: {{descripcion}}..." | Lista de amenazas |
| Resumen semanal | gpt-4o | Schedule (lunes 8am) | "Resume vulns críticas: {{vulns_semana}}" | Notificación a `ciso` |
| Enriquecer CVE | gpt-4o-mini | Al crear hallazgo tercero | "Busca CVE: {{titulo}}, v{{version}}..." | Campo `cve_id` |
| Análisis código | llama3.1:70b | Manual en repositorio | "Analiza por vulnerabilidades: {{snippet}}" | Crear vulnerabilidad |

**UI del AI Automation Builder**:
1. **Nombre + Activo toggle**
2. **Modelo**: Dropdown con todos los modelos activos del catálogo, agrupados por proveedor
3. **Trigger**: Seleccionar entidad → evento → condiciones (filtros)
4. **Prompt**: Editor con autocompletado de variables `{{campo}}`
5. **Acción**: Clasificar / Enriquecer campo / Sugerir / Auto-actualizar / Notificar
6. **Probar**: Seleccionar registro existente → ejecutar en vivo → ver respuesta → ajustar prompt

### Capa 6: Workflow Engine 🆕
Flujos de aprobación multi-paso configurables (extiende `FlujoEstatus`).

```python
class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"
    
    id: UUID (PK)
    nombre: str(255)
    entity_type: str(100)
    trigger_status: str(100)     # "Cuando el estado cambia a X"
    steps: list[dict] (JSONB)
    # [
    #   {"step": 1, "type": "approval", "approver_role": "lider_programa", "timeout_days": 3},
    #   {"step": 2, "type": "ia_check", "rule_id": "uuid-regla-triage"},
    #   {"step": 3, "type": "notification", "to_roles": ["ciso"], "template": "..."}
    # ]
    activo: bool = True
```

### Capa 7: Report Builder 🆕
Crear reportes personalizados desde la UI.

- Seleccionar fuente(s) de datos
- Arrastrar campos, gráficas, tablas al layout
- Filtros paramétricos (el usuario elige al generar)
- Exportar a PDF/Excel
- Programar envío automático (semanal/mensual)
- Reutilizar el mismo `widget-data/query` del Dashboard Builder

### Capa 8: Navigation Builder 🆕
Sidebar y menú completamente dinámicos.

```python
class NavigationItem(Base):
    __tablename__ = "navigation_items"
    
    id: UUID (PK)
    parent_id: UUID|None → FK(navigation_items.id)
    label: str(100)
    icon: str(64)|None
    route: str(255)|None
    tipo: str(50)           # "link" | "section" | "divider" | "dashboard" | "module"
    target_id: UUID|None    # → custom_dashboards.id o module_views.id
    orden: int
    visible_roles: list[str] (JSONB)
    activo: bool = True
```

### Capa 9: Branding / White-Label Builder 🆕
Personalización total de la identidad visual de la plataforma **desde la UI admin**.

```python
class PlatformBranding(Base):
    __tablename__ = "platform_branding"
    
    id: UUID (PK)
    # Identidad
    platform_name: str(255)          # "APPSEC Command Center" → configurable
    platform_subtitle: str|None       # "Plataforma de Gestión de Seguridad Aplicativa"
    logo_url: str|None                # ruta al logo subido (usa módulo uploads existente)
    logo_dark_url: str|None           # logo para dark mode
    favicon_url: str|None
    
    # Paleta de colores
    color_primary: str(9)            # "#3b82f6" — azul eléctrico
    color_secondary: str(9)|None
    color_accent: str(9)|None
    color_background: str(9)|None     # fondo principal dark
    color_surface: str(9)|None        # cards/panels
    color_danger: str(9)|None         # semáforo rojo
    color_warning: str(9)|None        # semáforo amarillo  
    color_success: str(9)|None        # semáforo verde
    
    # Tipografía
    font_family: str(100)|None        # "Inter" | "Roboto" | "Outfit" etc.
    font_url: str|None                # Google Fonts URL
    
    # Textos configurables
    login_title: str|None             # "Bienvenido a APPSEC"
    login_subtitle: str|None
    footer_text: str|None             # "© 2026 Mi Empresa"
    support_email: str|None
    
    # Feature flags visuales
    show_powered_by: bool = True
    custom_css: str|None (TEXT)       # CSS override avanzado (solo super_admin)
    
    updated_by: UUID → FK(users.id)
    updated_at: datetime
```

**Lo que controla**:
- Nombre de la plataforma en sidebar, header, login, title tag
- Logo en sidebar (colapsado = icono, expandido = logo completo)
- Paleta completa de colores → inyecta CSS variables dinámicamente
- Tipografía → carga Google Font configurada
- Pantalla de login personalizada
- Footer con texto legal configurable
- CSS custom para ajustes finos (solo `super_admin`)

**Perfilamiento**: Solo `admin` y `super_admin` acceden a esta configuración. El `super_admin` tiene acceso adicional al campo `custom_css`.

---

## Capas Adicionales Detectadas en Auditoría (10–11)

### Capa 10: Catalog Builder (Enums Dinámicos) 🆕
Los valores de dropdowns (severidad, estado, tipo de cambio, etc.) están como `CheckConstraint` hardcoded en SQL o strings sueltos. Deben ser **catálogos configurables**.

```python
class DynamicCatalog(Base):
    __tablename__ = "dynamic_catalogs"
    
    id: UUID (PK)
    code: str(100) UNIQUE          # "severidades", "estados_vuln", "tipos_cambio", "criticidades"
    nombre: str(255)               # "Severidades de Vulnerabilidad"
    entity_type: str(100)|None     # aplica a qué entidad, null = global
    editable: bool = True          # false = catálogo del sistema, no modificable

class DynamicCatalogItem(Base):
    __tablename__ = "dynamic_catalog_items"
    
    id: UUID (PK)
    catalog_id: UUID → FK(dynamic_catalogs.id)
    value: str(255)                # "CRITICA"
    label: str(255)                # "Crítica"
    color: str(9)|None             # "#ef4444"
    icon: str(64)|None             # "shield-alert"
    orden: int = 0
    activo: bool = True
    metadata: dict|None (JSONB)    # datos extra (ej: SLA días para severidades)
```

**Impacto**: Todos los dropdowns de la plataforma leen de `dynamic_catalogs` en vez de hardcoded. El admin puede agregar, renombrar, reordenar o desactivar opciones sin tocar código.

### Capa 11: Validation Rules Builder 🆕
Reglas de validación de campos configurables más allá de `required`.

```python
class ValidationRule(Base):
    __tablename__ = "validation_rules"
    
    id: UUID (PK)
    entity_type: str(100)          # "vulnerabilidad"
    field_name: str(100)           # "cvss_score"
    rule_type: str(50)             # "min" | "max" | "regex" | "required_if" | "unique_in_scope" | "depends_on"
    rule_config: dict (JSONB)      # {"min": 0, "max": 10} o {"pattern": "^CVE-\\d{4}-\\d+$"}
    error_message: str(255)        # "CVSS debe estar entre 0 y 10"
    activo: bool = True
```

**Ejemplo**: "El campo `justificacion` es obligatorio cuando `estado` cambia a `Rechazada`" — configurable sin código.

---

## Resumen Final: Mapa Completo 100% Builder

| # | Capa | Estado | Tablas Nuevas | Quién configura |
|---|------|--------|---------------|----------------|
| 1 | **Dashboard Builder** | 🟡 Propuesto | `custom_dashboards`, `custom_dashboard_access` | admin, lider_programa |
| 2 | **Module View Builder** | 🔴 Nuevo | `module_views` | admin, lider_programa |
| 3 | **Custom Fields** | 🔴 Nuevo | `custom_fields`, `custom_field_values` | admin |
| 4 | **Formula Engine** | 🟡 Parcial | Extender `indicadores_formulas` | admin |
| 5 | **AI Platform** | 🔴 Nuevo | `ia_provider_registry`, `ia_model_catalog`, `ia_automation_rules` | admin |
| 6 | **Workflow Engine** | 🟡 Parcial | `workflow_definitions` | admin |
| 7 | **Report Builder** | 🔴 Nuevo | `custom_reports` | admin, lider_programa |
| 8 | **Navigation Builder** | 🔴 Nuevo | `navigation_items` | admin |
| 9 | **Branding / White-Label** | 🔴 Nuevo | `platform_branding` | admin, super_admin (CSS) |
| 10 | **Catalog Builder** | 🔴 Nuevo | `dynamic_catalogs`, `dynamic_catalog_items` | admin |
| 11 | **Validation Rules** | 🔴 Nuevo | `validation_rules` | admin |
| — | **Personalización Tablas** | 🔴 Nuevo | `user_preferences`, `module_field_visibility` | Todos / admin |

**Total tablas nuevas: ~20** (sin contar las 3 de permisos granulares del Prompt 1)

### Control de Acceso por Capa

| Rol | Capas que puede configurar |
|-----|---------------------------|
| `super_admin` | **Todas** (incluye CSS custom y catálogos de sistema) |
| `admin` | Capas 1–11 (excepto CSS custom y catálogos no-editables) |
| `ciso` / `director_subdireccion` | Solo lectura de config |
| `lider_programa` | Capas 1, 2, 7 (crear dashboards, vistas y reportes propios) |
| `responsable_celula` | Crear vistas guardadas propias (self-service tablas) |
| `analista` | Solo personalización de tablas (columnas, filtros propios) |
| `readonly` | Sin acceso a configuración |

### IA — Ahora SÍ es 100% Builder

| Aspecto IA | Estado con las 3 sub-capas |
|-----------|---------------------------|
| Registrar proveedores (OpenAI, Anthropic, Ollama, etc.) | ✅ `ia_provider_registry` |
| Dar de alta modelos por proveedor | ✅ `ia_model_catalog` |
| Probar modelo con prompt rápido | ✅ Botón "Probar Modelo" |
| Configurar CUÁNDO ejecutar IA | ✅ `ia_automation_rules` triggers |
| Escribir prompts con variables `{{campo}}` | ✅ Editor con autocompletado |
| Seleccionar Proveedor X + Modelo X por regla | ✅ Dropdown del catálogo |
| Definir QUÉ hacer con la respuesta | ✅ Action types configurables |
| Probar con registro existente antes de activar | ✅ Dry-run en vivo |

### Lo que YA es Builder (no hay que implementar)

| Capacidad | Ya funciona |
|-----------|-------------|
| Roles y permisos M:N | ✅ |
| Flujos de estatus configurables | ✅ |
| Reglas SoD | ✅ |
| SLAs por severidad | ✅ |
| Indicadores/fórmulas (modelo) | ✅ |
| Filtros guardados compartibles | ✅ |
| Widget visibility por rol | ✅ |
| CSV export/import/plantilla | ✅ |
| Columnas Kanban configurables | ✅ |
| System Settings JSONB | ✅ |
| Herramientas externas con credenciales cifradas | ✅ |

