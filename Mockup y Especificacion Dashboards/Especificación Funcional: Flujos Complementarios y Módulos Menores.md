# Especificación Funcional: Flujos Complementarios y Módulos Menores

Este documento complementa la "Especificación Maestra AppSec" y los mockups interactivos, detallando los flujos operativos y módulos menores que no requieren un prototipo HTML dedicado, pero que son esenciales para el funcionamiento integral de la plataforma.

---

## 1. Módulo de Inventario de Repositorios (Activos)

### 1.1 Objetivo
Mantener un catálogo centralizado de todos los activos de software (repositorios de código, aplicaciones, APIs, contenedores) que están sujetos a revisión de seguridad.

### 1.2 Estructura de Datos (Campos Clave)
- **ID Activo:** Identificador único (ej. `APP-001`).
- **Nombre:** Nombre del repositorio o aplicación.
- **Tipo:** Web, Móvil (iOS/Android), API, Microservicio, Infraestructura.
- **Criticidad de Negocio:** Alta, Media, Baja (Determina los SLAs de remediación).
- **Célula Responsable:** Enlace al Nivel 7 de la Organización.
- **Tecnologías:** Etiquetas (ej. `Java`, `Spring Boot`, `React`).
- **URL Repositorio:** Enlace a GitHub/Bitbucket.

### 1.3 Flujo de Sincronización
El inventario no debe llenarse manualmente. La plataforma debe incluir un "Job de Sincronización" que se conecte vía API a los repositorios de código (ej. GitHub Enterprise) y a la CMDB (Configuration Management Database) de la empresa para auto-descubrir y actualizar los activos diariamente.

---

## 2. Módulo de Planes de Remediación

### 2.1 Objetivo
Permitir a los analistas agrupar múltiples vulnerabilidades bajo un mismo "Plan de Trabajo" para gestionarlas como un proyecto único, especialmente útil para refactorizaciones grandes o actualizaciones de frameworks.

### 2.2 Flujo Operativo
1. **Creación:** Desde la "Tabla de Vulnerabilidades", el analista selecciona 5 hallazgos relacionados (ej. 5 inyecciones SQL en el mismo módulo) y hace clic en "Agrupar en Plan".
2. **Configuración del Plan:**
   - **Nombre del Plan:** Ej. "Refactorización de Consultas SQL en Módulo de Pagos".
   - **Fecha Compromiso:** Una nueva fecha límite que sobreescribe temporalmente los SLAs individuales de las vulnerabilidades agrupadas.
   - **Justificación:** Por qué se requiere más tiempo del SLA estándar.
3. **Aprobación:** Si la "Fecha Compromiso" excede el SLA original, el plan entra en estatus "Pendiente de Aprobación" y notifica al BISO o al Líder de AppSec.
4. **Ejecución:** Una vez aprobado, las vulnerabilidades agrupadas cambian su estatus a "En Plan de Remediación". Cuando el plan se marca como "Completado", todas las vulnerabilidades hijas se marcan como "Solventadas".

---

## 3. Centro de Notificaciones In-App

### 3.1 Objetivo
Mantener a los usuarios informados sobre eventos críticos sin depender exclusivamente del correo electrónico.

### 3.2 Tipos de Alertas (Triggers)
- **SLA en Riesgo:** "La vulnerabilidad SAST-0042 vence en 3 días." (Dirigido al Responsable).
- **SLA Vencido (Escalamiento):** "La vulnerabilidad SAST-0042 ha vencido." (Dirigido al Responsable y a su Jefe directo según el árbol organizacional).
- **Nueva Asignación:** "Se te han asignado 5 nuevas vulnerabilidades críticas."
- **Q-Review Pendiente:** "Tienes 3 evaluaciones de OKRs pendientes de revisar." (Dirigido a Líderes).
- **Plan Aprobado/Rechazado:** "Tu plan de remediación ha sido aprobado."

### 3.3 Interfaz de Usuario
- Un ícono de campana en la barra superior (Topbar) con un contador numérico rojo.
- Al hacer clic, se despliega un panel flotante con la lista de notificaciones ordenadas cronológicamente.
- Cada notificación es clickeable y redirige al usuario directamente al registro correspondiente (ej. abre el drawer de la vulnerabilidad).

---

## 4. Flujo de Solicitud de Excepciones (Riesgo Aceptado)

### 4.1 Objetivo
Gestionar los casos donde una vulnerabilidad no puede ser remediada por motivos técnicos o de negocio, y el riesgo debe ser asumido formalmente por la dirección.

### 4.2 Flujo Operativo
1. **Solicitud:** Desde el drawer de una vulnerabilidad, el analista hace clic en "Solicitar Excepción".
2. **Formulario de Justificación:**
   - **Motivo:** Limitación técnica, Dependencia de terceros, Falso Positivo del motor.
   - **Fecha de Expiración:** Las excepciones no son eternas. Se debe definir una fecha (ej. 6 meses) tras la cual la vulnerabilidad volverá a estar activa.
   - **Controles Compensatorios:** Qué medidas se están tomando para mitigar el riesgo mientras tanto (ej. "Se agregó una regla en el WAF").
3. **Aprobación Multinivel:**
   - Severidad Baja/Media: Aprobación del BISO o Líder AppSec.
   - Severidad Alta/Crítica: Aprobación obligatoria del Director del área (Nivel 2 de la Organización).
4. **Estatus Final:** Si se aprueba, la vulnerabilidad cambia a "Riesgo Aceptado" y deja de afectar negativamente el Score de Desempeño hasta su fecha de expiración.

---

## 5. Módulo de Auditorías (Hallazgos Externos)

### 5.1 Objetivo
Registrar y dar seguimiento a los hallazgos de seguridad reportados por entidades externas (ej. CNBV, Auditoría Interna, Firmas de Pentesting Externo).

### 5.2 Diferencia con Vulnerabilidades Regulares
A diferencia de los hallazgos de SAST/DAST que se descubren continuamente en el pipeline, los hallazgos de auditoría son eventos discretos y formales.
- Tienen un "Oficio" o "Reporte" asociado.
- Los SLAs de remediación suelen ser dictados por el regulador, no por la matriz interna de la empresa.
- Las penalizaciones en el Motor de Scoring por incumplir un hallazgo de auditoría son mucho más severas (peso mayor).

### 5.3 Interfaz
- Utiliza la misma estructura de la "Tabla de Vulnerabilidades", pero filtrada bajo el motor "Auditoría Externa".
- El drawer de detalle incluye campos adicionales: `Entidad Auditora`, `Número de Oficio`, `Multa Potencial`.
