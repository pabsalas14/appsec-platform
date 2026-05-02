# Especificación de Construcción: Bloque 2 - Vulnerabilidades por Motor

Este documento define a nivel de construcción el módulo de Gestión de Vulnerabilidades de la plataforma AppSec. Describe la tabla unificada, los formularios de captura específicos por motor (SAST, SCA, CDS, DAST, MAST), la lógica de importación y el flujo de excepciones.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_MotorEscaneo` | SAST, SCA, CDS, DAST, MAST, MDA, Terceros | Identifica el origen del hallazgo. |
| `Cat_SeveridadVuln` | Crítica, Alta, Media, Baja, Informativa | Define el nivel de riesgo y el SLA de remediación. |
| `Cat_EstatusVuln` | Nuevo, En Revisión, Confirmado, En Remediación, Resuelto, Falso Positivo, Riesgo Aceptado | Controla el ciclo de vida del hallazgo. |
| `Cat_ClasificacionOWASP` | A01:2021-Broken Access Control, A02:2021-Cryptographic Failures, etc. | Clasifica la vulnerabilidad según el estándar OWASP Top 10. |
| `Cat_TipoExcepcion` | Temporal, Definitiva (Aceptación de Riesgo) | Clasifica el tipo de justificación de negocio. |

---

## 2. Pantalla 1: Tabla Unificada de Vulnerabilidades

**Ubicación en Menú:** `Vulnerabilidades > Concentrado`

### 2.1 Vista Principal (DataGrid)
- **Componente:** DataGrid de alto rendimiento con paginación del lado del servidor.
- **Columnas Visibles por Defecto:**
  - ID (Texto, ej. `VULN-1024`).
  - Motor (Badge con color, lee de `Cat_MotorEscaneo`).
  - Vulnerabilidad (Texto, nombre del hallazgo).
  - Severidad (Badge con color, lee de `Cat_SeveridadVuln`).
  - Estatus (Badge con color, lee de `Cat_EstatusVuln`).
  - Repositorio / Activo (Texto con hipervínculo al inventario).
  - Célula Responsable (Texto).
  - Fecha Detección (Fecha).
  - SLA Vencido (Icono de alerta rojo si `Fecha Detección + SLA < Hoy` y Estatus no es Resuelto/Falso Positivo/Riesgo Aceptado).
- **Filtros Superiores (Contextuales):**
  - Motor (Dropdown múltiple).
  - Severidad (Dropdown múltiple).
  - Estatus (Dropdown múltiple).
  - Célula Responsable (Buscador con autocompletado).
  - Rango de Fechas de Detección (Datepicker).
  - SLA Vencido (Toggle: Sí/No).
- **Botones Principales:**
  - `+ Nueva Vulnerabilidad` (Abre modal para seleccionar motor y luego el drawer de captura manual).
  - `Importar Escaneo` (Abre modal de importación masiva).
  - `Exportar CSV` (Descarga los registros filtrados actualmente).

---

## 3. Formularios de Captura Manual por Motor (Drawer Lateral)

**Trigger:** Clic en `+ Nueva Vulnerabilidad` -> Seleccionar Motor en el modal -> Abre el Drawer Lateral.

### 3.1 Formulario SAST (Static Application Security Testing)
- **Campo 1: Repositorio**
  - Tipo: Buscador con autocompletado (Apunta a la tabla de Inventario de Repositorios).
  - Obligatorio: Sí.
  - Comportamiento: Al seleccionar, auto-llena los campos ocultos de Célula, Organización, Gerencia y Subdirección (Lógica de Herencia Automática).
- **Campo 2: Rama (Branch)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Nombre de la Vulnerabilidad (Query)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 4: Severidad**
  - Tipo: Dropdown (Lee de `Cat_SeveridadVuln`).
  - Obligatorio: Sí.
- **Campo 5: Ruta del Archivo (File Path)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 6: Línea de Código**
  - Tipo: Number Input.
  - Obligatorio: Sí.
- **Campo 7: Fragmento de Código (Snippet)**
  - Tipo: Textarea (Formato código).
  - Obligatorio: No.
- **Campo 8: Similarity ID**
  - Tipo: Text Input.
  - Obligatorio: No. (Usado para deduplicación).

### 3.2 Formulario SCA (Software Composition Analysis)
- **Campo 1: Repositorio** (Buscador, Obligatorio, hereda jerarquía).
- **Campo 2: Rama (Branch)** (Text Input, Obligatorio).
- **Campo 3: Nombre de la Dependencia (Package)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 4: Versión Actual**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 5: Versión Segura (Remediada)**
  - Tipo: Text Input.
  - Obligatorio: No.
- **Campo 6: CVE ID**
  - Tipo: Text Input (ej. `CVE-2021-44228`).
  - Obligatorio: Sí.
- **Campo 7: Severidad** (Dropdown, Obligatorio).
- **Campo 8: CVSS Score**
  - Tipo: Number Input (0.0 a 10.0).
  - Obligatorio: No.

### 3.3 Formulario CDS (Container Dependency Scanning)
- **Campo 1: Repositorio** (Buscador, Obligatorio, hereda jerarquía).
- **Campo 2: Nombre de la Imagen Docker**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Tag / Hash de la Imagen**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 4: Paquete Vulnerable (OS Package)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 5: CVE ID** (Text Input, Obligatorio).
- **Campo 6: Severidad** (Dropdown, Obligatorio).

### 3.4 Formulario DAST (Dynamic Application Security Testing)
- **Campo 1: Activo Web (URL)**
  - Tipo: Buscador con autocompletado (Apunta a la tabla de Inventario de Activos Web).
  - Obligatorio: Sí.
  - Comportamiento: Al seleccionar, auto-llena los campos ocultos de Célula, Gerencia y Subdirección.
- **Campo 2: Nombre de la Vulnerabilidad** (Text Input, Obligatorio).
- **Campo 3: Severidad** (Dropdown, Obligatorio).
- **Campo 4: URL Específica Afectada (Endpoint)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 5: Método HTTP**
  - Tipo: Dropdown (GET, POST, PUT, DELETE, PATCH).
  - Obligatorio: Sí.
- **Campo 6: Parámetro Vulnerable**
  - Tipo: Text Input.
  - Obligatorio: No.
- **Campo 7: Request Payload (Petición)**
  - Tipo: Textarea.
  - Obligatorio: No.
- **Campo 8: Response Payload (Respuesta)**
  - Tipo: Textarea.
  - Obligatorio: No.

### 3.5 Formulario MAST (Mobile Application Security Testing)
- **Campo 1: Repositorio** (Buscador, Obligatorio, hereda jerarquía).
- **Campo 2: Sistema Operativo**
  - Tipo: Dropdown (iOS, Android).
  - Obligatorio: Sí.
- **Campo 3: Nombre de la Vulnerabilidad** (Text Input, Obligatorio).
- **Campo 4: Severidad** (Dropdown, Obligatorio).
- **Campo 5: Componente Afectado (Activity, Intent, Clase)**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 6: Descripción Técnica**
  - Tipo: Textarea.
  - Obligatorio: Sí.

**Botón Guardar (Común para todos los formularios):**
- **Acción:** `POST /api/v1/vulnerabilidades`.
- **Validaciones:** Verifica campos obligatorios.
- **Resultado:** Inserta el registro con `Estatus = Nuevo`, `Fecha Detección = Hoy`, calcula la `Fecha Vencimiento SLA` sumando los días configurados para la severidad y el motor, cierra el drawer y recarga la tabla.

---

## 4. Lógica de Importación Masiva (CSV)

**Trigger:** Clic en `Importar Escaneo`.

**Paso 1: Modal de Selección**
- El usuario selecciona el **Motor** (SAST, SCA, CDS, DAST) desde un dropdown.
- El sistema muestra un botón `Descargar Template CSV` específico para el motor seleccionado.

**Paso 2: Carga de Archivo**
- El usuario sube el archivo CSV.
- El sistema lee las cabeceras y valida que coincidan exactamente con el template del motor seleccionado.

**Paso 3: Lógica de Match y Deduplicación (Backend)**
- Por cada fila del CSV, el sistema busca si la vulnerabilidad ya existe en la base de datos.
- **Llave de Deduplicación SAST:** `Repositorio` + `Rama` + `Similarity ID` (o `Ruta del Archivo` + `Línea` si no hay Similarity ID).
- **Llave de Deduplicación SCA:** `Repositorio` + `Rama` + `Nombre de la Dependencia` + `CVE ID`.
- **Llave de Deduplicación DAST:** `Activo Web` + `Nombre de la Vulnerabilidad` + `URL Específica Afectada`.
- **Si existe (Match):**
  - Actualiza la `Fecha Última Detección = Hoy`.
  - Si el estatus anterior era `Resuelto`, lo cambia a `Nuevo` y marca el flag `Reincidente = True`.
- **Si no existe (Nuevo):**
  - Inserta un nuevo registro.
  - Ejecuta la **Lógica de Herencia Automática** (descrita en el Bloque 1) para mapear el Repositorio/Activo Web a su Célula, Gerencia y Subdirección.

**Paso 4: Resultado**
- Muestra un modal de resumen: "Importación completada. X registros nuevos, Y registros actualizados, Z errores (repositorios no encontrados en inventario)".

---

## 5. Flujo de Excepciones y Aceptación de Riesgo

Este flujo permite justificar por qué una vulnerabilidad no se remediará dentro del SLA establecido.

**Trigger:** Clic en el botón `Solicitar Excepción` dentro del Drawer de Detalle de una vulnerabilidad existente.

### 5.1 Formulario de Solicitud (Modal)
- **Campo 1: Tipo de Excepción**
  - Tipo: Dropdown (Lee de `Cat_TipoExcepcion`: Temporal, Definitiva).
  - Obligatorio: Sí.
- **Campo 2: Justificación de Negocio / Técnica**
  - Tipo: Textarea.
  - Obligatorio: Sí.
- **Campo 3: Fecha de Expiración**
  - Tipo: Datepicker.
  - Obligatorio: Sí (Solo si Tipo = Temporal).
  - Validación: No puede ser mayor a 6 meses desde hoy.
- **Campo 4: Plan de Mitigación Compensatorio**
  - Tipo: Textarea.
  - Obligatorio: Sí.
- **Campo 5: Aprobador Solicitado**
  - Tipo: Buscador con autocompletado (Usuarios con rol "Director" o "CISO").
  - Obligatorio: Sí.

**Botón: Enviar Solicitud**
- **Acción:** Cambia el estatus de la vulnerabilidad a `En Revisión de Excepción`.
- **Resultado:** Dispara una notificación In-App y un correo electrónico al Aprobador Solicitado.

### 5.2 Flujo de Aprobación (Vista del Aprobador)
- El Aprobador entra al detalle de la vulnerabilidad desde su centro de notificaciones.
- Ve la información técnica del hallazgo y los datos de la solicitud de excepción en modo solo lectura.
- **Botón: Aprobar Excepción**
  - **Acción:** Cambia el estatus de la vulnerabilidad a `Riesgo Aceptado` (si es definitiva) o mantiene el estatus original pero pausa el reloj del SLA hasta la `Fecha de Expiración` (si es temporal).
  - **Resultado:** Registra en la bitácora de auditoría: "Excepción aprobada por [Nombre del Aprobador] el [Fecha]". Dispara notificación al solicitante.
- **Botón: Rechazar Excepción**
  - **Acción:** Abre un modal para ingresar `Motivo de Rechazo` (Textarea, Obligatorio).
  - **Resultado:** Devuelve la vulnerabilidad a su estatus original. El reloj del SLA sigue corriendo. Dispara notificación al solicitante con el motivo de rechazo.
