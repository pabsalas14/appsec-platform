# AppSec Platform — User Guide

## Table of Contents

1. [Super Admin Guide](#super-admin-guide)
2. [Chief AppSec Guide](#chief-appsec-guide)
3. [Program Leader Guide](#program-leader-guide)
4. [Analyst Guide](#analyst-guide)
5. [Auditor Guide](#auditor-guide)
6. [Common Tasks](#common-tasks)

---

## Super Admin Guide

### Role Description
Super Admin has complete control over the platform including configuration, user management, system settings, and all operational data.

### Key Responsibilities
- Manage users and roles
- Configure system catalogs (severities, program types, regulations)
- Manage SLA configurations
- Define and monitor indicators/metrics
- Configure IA provider integration
- Review audit logs for compliance
- Manage dashboard configurations
- System health monitoring

### Core Tasks

#### 1. User Management
**Navigate to:** Admin Panel → Usuarios

1. Click "Nuevo Usuario"
2. Fill in:
   - Nombre: Full name
   - Email: Work email
   - Username: Login credential
   - Rol: Select from dropdown
   - Habilitado: Toggle active status
3. Click "Crear"
4. System generates temporary password (sent via email)

#### 2. Configure Severities & SLAs
**Navigate to:** Admin Panel → Configuración → Severidades

1. Click "Editar Severidades"
2. Update SLA days for each:
   - CRITICAL: 7 days
   - HIGH: 30 days
   - MEDIUM: 60 days
   - LOW: 90 days
3. Click "Guardar"
4. Change logged to audit trail

#### 3. Manage Catalogs
**Navigate to:** Admin Panel → Catálogos

Available catalogs:
- Tipos de Programa (SAST, DAST, TM, MAST, Source Code)
- Estatus de Vulnerabilidades (OPEN, IN_PROGRESS, REMEDIATED, CLOSED)
- Tipos de Iniciativa (RFI, Proceso, Plataforma, Custom)
- Regulaciones (CNBV, ISO27001, etc.)
- Tecnologías Stack
- Tipos de Auditoría (Interna, Externa)

**To add:** Click "+" button, fill form, click "Guardar"
**To edit:** Click pencil icon, modify, click "Guardar"
**To delete:** Click trash icon (soft delete - reversible)

#### 4. Configure IA Provider
**Navigate to:** Admin Panel → Integraciones → IA

1. Select Provider:
   - **Ollama** (Default, local)
   - **Anthropic** (Claude)
   - **OpenAI** (GPT)
   - **OpenRouter** (Multi-model)

2. Set Configuration:
   - Model: (e.g., "llama3.1:8b" for Ollama, "claude-sonnet-4-6" for Anthropic)
   - Temperature: 0.0-1.0 (lower = more consistent, higher = more creative)
   - Max Tokens: 500-4000
   - Timeout: 10-60 seconds

3. Enable Data Sanitization: Toggle if using paid provider (removes secrets before sending)

4. Click "Probar Conexión" to verify connectivity
   - Status: Healthy / Warning / Error
   - Response time shown

5. Click "Guardar"

**Note:** Configuration change is logged to audit trail

#### 5. Monitor System Health
**Navigate to:** Admin Panel → Salud del Sistema

View:
- Last CSV import (source, result, timestamp)
- Pending jobs (count, type)
- Failed jobs (recent 20, with retry options)
- Database metrics (space used, growth/month)
- API health (avg response time, P95 latency, errors)
- Active users and sessions
- IA integration status
- Anomaly alerts

#### 6. Review Audit Logs
**Navigate to:** Auditoría → Registro de Auditoría

1. Filter by:
   - Entidad (Vulnerabilidad, ServiceRelease, etc.)
   - Acción (CREATE, UPDATE, DELETE, APPROVE)
   - Usuario
   - Fecha
   - Resultado (exitoso/fallido)

2. View details:
   - Timestamp
   - User who made change
   - What changed (before/after diff)
   - Justification (if required)

3. Verify Integrity:
   - Click "Verificar Integridad"
   - System checks hash chain for tampering
   - Result: "Cadena de hash válida" or lists any breaks

---

## Chief AppSec Guide

### Role Description
Chief AppSec has oversight of all programs, vulnerabilities, and security metrics. Can approve critical actions and access all dashboards.

### Key Responsibilities
- Review security metrics and KPIs
- Approve risk exceptions and vulnerability closure
- Manage strategic initiatives
- Generate compliance reports
- Oversight of all programs
- Approve service releases

### Core Tasks

#### 1. Executive Dashboard
**Navigate to:** Dashboards → Ejecutivo

View:
- Total vulnerabilities by severity
- SLA compliance percentage
- Pending releases
- Threat modeling sessions
- Key indicators (XXX-001 through XXX-005)
- KRI0025 (% deficient controls)

**Actions:**
- Click chart segments to drill down by organization
- Drill further by subdirectory → cell
- Click table rows for detailed view
- Export data (CSV, Excel, PDF)

#### 2. Vulnerability Overview
**Navigate to:** Vulnerabilidades → Tabla

1. **Filter by:**
   - Severidad: CRITICAL, HIGH, MEDIUM, LOW
   - Estado: OPEN, IN_PROGRESS, REMEDIATED
   - Motor: SAST, DAST, SCA, TM, MAST
   - SLA: Próximo a vencer, Vencido, OK
   - Asignado a: Select user

2. **Bulk Actions:**
   - Select vulnerabilities (checkbox)
   - Click "Acciones Masivas"
   - Options: Asignar, Cambiar Estado, Aplicar Excepción

3. **Approve Risk Exceptions:**
   - Click vulnerability
   - Click "Solicitar Excepción"
   - Fill: Justificación, Fecha Límite
   - Submit
   - Wait for Chief AppSec approval
   - Once approved, exception tracked and audited

#### 3. Risk Acceptance
**Navigate to:** Vulnerabilidades → Excepciones

1. Click "Aceptar Riesgo"
2. Fill:
   - Vulnerabilidad: Select from list
   - Justificación: Business reason for accepting
   - Propietario: Who's responsible
   - Fecha de Revisión Obligatoria: When to re-evaluate
3. Submit for approval
4. Once approved, logged to audit trail

#### 4. Approve Service Releases
**Navigate to:** Operaciones → Releases

1. View releases in status "SECURITY_VALIDATION" or "APPROVAL"
2. Click release
3. Review:
   - Description
   - Estimated date
   - Associated vulnerabilities
   - Security test results
4. Click "Aprobar" or "Rechazar"
5. Add justificación (required for critical actions)
6. Submit

**Note:** If SoD enabled and approval user = creator, action is blocked

#### 5. Manage Strategic Initiatives
**Navigate to:** Iniciativas

1. **Create Initiative:**
   - Click "Nueva Iniciativa"
   - Fill: Nombre, Descripción, Tipo, Fecha Objetivo
   - Asign milestones
   - Click "Crear"

2. **Update Progress:**
   - Click initiative
   - Click "Actualizar Estado"
   - Update: % completado, Notas
   - Click "Guardar"

3. **View Metrics:**
   - Initiati status dashboard shows:
     - % progress average
     - Count by type
     - Overdue initiatives

#### 6. Compliance Reports
**Navigate to:** Dashboards → CNBV

View:
- KRI0025: % Deficient Controls
- Breakdown by OWASP category
- SLA compliance trend (6-12 months)
- Remediation rate by motor

Export and share with governance team.

---

## Program Leader Guide

### Role Description
Program Leaders manage specific programs (SAST, DAST, Threat Modeling, etc.) and have full control over program data and activities.

### Key Responsibilities
- Create and manage program activities
- Record program findings
- Track program metrics
- Assign vulnerabilities within program
- Provide status updates
- Manage program-level configurations

### Core Tasks

#### 1. Create Program Activity
**Navigate to:** Programas → SAST (or DAST/TM/MAST)

1. Click "Nueva Actividad"
2. Fill:
   - Mes: Select month (e.g., April 2026)
   - Repositorio: Select from list
   - Hallazgos Encontrados: Number of findings discovered
   - Hallazgos Remediados: Number already fixed
3. Click "Crear"

#### 2. Record Monthly Progress
Each month:
1. Navigate to program
2. Click month (e.g., "Abril 2026")
3. View activities and findings
4. If no activity for month, click "Registrar Actividad"
5. Enter metrics
6. System auto-calculates scoring

#### 3. Create Findings
**Navigate to:** Programas → [Program] → [Month] → Hallazgos

1. Click "Nuevo Hallazgo"
2. Fill:
   - Título: Brief description
   - Descripción: Detailed explanation
   - Severidad: CRITICAL, HIGH, MEDIUM, LOW
   - CVSS: 0.0-10.0 (if known)
   - CWE: CWE code
   - OWASP: OWASP category
3. Click "Crear"
4. System automatically creates linked Vulnerabilidad

#### 4. View Program Metrics
**Navigate to:** Dashboards → Programas → [Programa Zoom]

View:
- Monthly activities completed
- Historical trend (12-month chart)
- Finding distribution by severity
- Remediation rate
- SLA compliance

#### 5. Filter and Search
1. Use "Filtros Guardados" dropdown
2. Select pre-saved filter or create new
3. Set filters (month, severity, status)
4. Click "Guardar Filtro" to save for future use
5. Share filter with team (toggle "Compartido")

---

## Analyst Guide

### Role Description
Analysts perform daily operational tasks including vulnerability triage, assignment, status updates, and data entry.

### Key Responsibilities
- Triage vulnerabilities
- Classify false positives
- Assign vulnerabilities
- Update vulnerability status
- Import findings via CSV
- Record audit evidence
- Test IA-assisted triaging

### Core Tasks

#### 1. Daily Vulnerability Triage
**Navigate to:** Vulnerabilidades → Tabla

1. Filter: Estado = "OPEN", Asignado = "Yo"
2. Review each vulnerability
3. Determine priority and remediation effort
4. Assign (if not already assigned):
   - Click vulnerability
   - Click "Asignar"
   - Select developer/team
   - Add comment (optional)
   - Click "Guardar"

#### 2. False Positive Classification (IA-Assisted)
**Navigate to:** Vulnerabilidades → [Vulnerability]

1. Click "Preguntar a IA"
2. Optionally add:
   - Code snippet (first 1000 chars)
   - Repo context
   - Tool name
3. Click "Analizar"
4. IA returns classification:
   - "Probable False Positive" → Can delete/mark as closed
   - "Requires Manual Review" → Leave for further analysis
   - "Confirmed Vulnerability" → Move to remediation
5. Review suggestion
6. Click "Aceptar" or "Modificar"
7. Decision logged to audit trail

#### 3. Update Vulnerability Status
1. Navigate to vulnerability
2. Click "Cambiar Estado"
3. Select new state:
   - OPEN → IN_PROGRESS (assign to developer)
   - IN_PROGRESS → REMEDIATED (evidence provided)
   - REMEDIATED → CLOSED (validated in production)
   - Any → EXCEPTION (if business decision made)
4. If required (per state machine), add Justificación
5. Click "Guardar"

**Note:** Status change logged with user, timestamp, justification

#### 4. Bulk CSV Import
**Navigate to:** Vulnerabilidades → Importar

1. Click "Seleccionar Archivo"
2. Choose CSV file with findings
3. Configure column mapper:
   - System suggests mapping based on headers
   - Correct any mismatches
   - Set required columns: titulo, severidad, motor
4. Click "Vista Previa"
5. Review preview table:
   - Shows first 5-10 rows
   - Highlights duplicate detection (by tool + external_id)
   - Shows validation errors
6. Click "Importar" if correct
   - System auto-deduplicates
   - Assigns to you by default
   - Logged to audit trail with row count, duplicates, errors

#### 5. Request Exception
1. Navigate to vulnerability
2. Click "Solicitar Excepción"
3. Fill:
   - Razón: Business reason for exception
   - Fecha Límite: When to re-evaluate
   - Aprobador: Who approves (usually Chief AppSec)
4. Submit
5. Wait for approval
6. Once approved, exception visible in dashboard

#### 6. Create/Update Threat Modeling Sessions
**Navigate to:** Programas → Threat Modeling → Sesiones

1. Click "Nueva Sesión"
2. Fill:
   - Nombre: Session name (e.g., "TM - Payment Service")
   - Descripción: Context
   - Tecnología Stack: Select (Java, Spring Boot, PostgreSQL, Stripe API)
   - Célula: Select organizational unit
3. Click "Crear"

#### 7. Generate Threats with IA
1. Navigate to threat modeling session
2. Click "Generar Amenazas"
3. System calls IA provider with stack technology
4. Receives STRIDE threats with DREAD scores:
   - Damage (1-10 × 2 weight)
   - Reproducibility (1-10)
   - Exploitability (1-10)
   - Affected Users (1-10)
   - Discoverability (1-10)
   - **Total DREAD** = (D×2) + R + E + A + D (max 60)

5. Review suggestions:
   - STRIDE categories: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
   - Proposed mitigations
6. Modify if needed (adjust scores, remove/add threats)
7. Click "Aprobar Amenazas"
8. Logged to audit trail as approved

#### 8. Record Audit Evidence
**Navigate to:** Auditorías → [Audit] → Evidencias

1. Click "Agregar Evidencia"
2. Upload file (PDF, screenshot, report)
3. System calculates SHA-256 hash automatically
4. Fill: Descripción, Clasificación
5. Click "Guardar"
6. Evidence tied to audit finding
7. Hash used for integrity verification

---

## Auditor Guide

### Role Description
Auditors have read-only access to all data including sensitive audit logs. They provide independent verification and compliance checking.

### Key Responsibilities
- Review audit logs for compliance
- Verify data integrity
- Generate compliance reports
- Monitor control effectiveness
- Track exception approvals

### Core Tasks

#### 1. Access Audit Logs
**Navigate to:** Auditoría → Registro de Auditoría

- You have exclusive read access (no modify)
- Filter by:
  - Entidad: What was modified
  - Acción: CREATE, UPDATE, DELETE, APPROVE, EXPORT
  - Usuario: Who made change
  - Fecha: When
  - Resultado: Success/Failure

#### 2. Review Change History
1. Click audit log entry
2. View:
   - Before/After values (diff)
   - User who made change
   - Timestamp
   - Justification (if required)
   - Request ID for tracing

#### 3. Verify Hash Chain Integrity
**Navigate to:** Admin Panel → Auditoría → Verificar Integridad

1. Click "Verificar Integridad Cadena"
2. System validates hash chain:
   - Each record's hash = hash(previous_record_hash + current_record_data)
   - If chain broken, impossible to detect tampering
3. Result:
   - ✅ "Cadena válida" = No tampering
   - ⚠️ "Ruptura detectada en registro #45000" = Tampering detected
4. If rupture found, report immediately

#### 4. Review Exceptions & Risk Acceptances
**Navigate to:** Vulnerabilidades → Excepciones

View all active exceptions:
- Vulnerability
- Business justification
- Approval status
- Approval user
- Expiration date

Verify:
- Justification adequate
- Approver authorized
- Expiration dates reasonable

#### 5. Generate Compliance Reports
**Navigate to:** Dashboards → CNBV

Export KRI0025 and supporting data:
- % Deficient Controls (by OWASP category)
- Remediation trend (6-month view)
- SLA compliance
- Vulnerability distribution

---

## Common Tasks

### 1. Save Filter for Reuse
Available in all list views:

1. Set desired filters (severidad, estado, etc.)
2. Click "Filtros Guardados"
3. Click "Guardar Filtro Nuevo"
4. Fill:
   - Nombre: "My Critical SAST Vulns"
   - Compartido: Toggle to share with team
5. Click "Guardar"
6. Filter now appears in dropdown

### 2. Export Data
**Available in:** Dashboards, Vulnerability tables, Release tables

1. Click "Exportar"
2. Select format:
   - CSV: Plain text, Excel-compatible
   - Excel: Multiple sheets, formatting
   - PDF: Formatted report
3. Select columns (if applicable)
4. Click "Descargar"
5. Export logged to audit trail with:
   - User who exported
   - Timestamp
   - Filters applied
   - File hash (for integrity)

### 3. View Dashboard Data
All dashboards have:

**Drill-Down Capability:**
1. Click chart segment → Filter to Organization
2. Click organization row → Filter to Subdirectory
3. Click subdirectory row → Filter to Cell
4. Click cell row → Show detailed table

**Saved Filters:**
1. Click "Filtros" dropdown
2. Select saved filter
3. Data updates automatically

**Time Range:**
1. Click date picker
2. Select range
3. Data recalculates

### 4. Request Access to Feature
If you don't see a feature you need:

1. Email: security-team@example.com
2. Include:
   - Feature name
   - Business reason
   - Role type
3. Admin will review and adjust permissions

### 5. Update Password
**Navigate to:** Perfil (top right) → Cambiar Contraseña

1. Enter current password
2. Enter new password (min 12 chars, complex)
3. Confirm new password
4. Click "Guardar"
5. Logged out automatically
6. Log back in with new password

---

## FAQ

**Q: Why can't I approve this release?**
A: You may not have the "Approve Release" permission, or SoD rule is preventing you (you created it). Contact Super Admin.

**Q: How do I upload a CSV with findings?**
A: Navigate to Vulnerabilidades → Importar. System deduplicates by (tool + finding_id) automatically.

**Q: Can I see vulnerabilities assigned to others?**
A: Only if your role has "view_all_vulnerabilities" permission. Contact Super Admin if needed.

**Q: Why is my vulnerability status stuck?**
A: State machine may require justification or approval. Click vulnerability to see next allowed states.

**Q: How is SLA calculated?**
A: Days from creation based on severity:
- CRITICAL: 7 days (RED after 7)
- HIGH: 30 days (YELLOW after 21)
- MEDIUM: 60 days (YELLOW after 42)
- LOW: 90 days (YELLOW after 63)

---

**Last Updated:** April 2026
**Version:** 1.0.0
