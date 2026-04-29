# SCR Integration — Checklist 100% Completitud

**Objetivo:** Ir de 60% a 100% funcionalidad

---

## PHASE 3: DETECTIVE AGENT — LLM REAL (2-3 días)

### Detective Agent Service
- [ ] Crear función `run_detective_real()` que use LLM (no solo rules)
- [ ] Implementar análisis de patrones con Anthropic Claude
- [ ] Agregar soporte fallback a otros providers (OpenAI, Ollama)
- [ ] Crear prompts específicos para análisis forense
- [ ] Parsear respuestas LLM a formato CodeSecurityEvent
- [ ] Enriquecer eventos con indicadores de riesgo
- [ ] Agregar logging estructurado para debugging
- [ ] Implementar error handling con fallback a rules-based

### Detective Agent Patterns
- [ ] Detectar HIDDEN_COMMITS (commits con mensajes genéricos en archivos críticos)
- [ ] Detectar TIMING_ANOMALIES (commits fuera de horario, weekends)
- [ ] Detectar RAPID_SUCCESSION (múltiples commits en corto tiempo)
- [ ] Detectar CRITICAL_FILES (cambios a auth/crypto/payment/security)
- [ ] Detectar MASS_CHANGES (commits > 500 líneas ocultando cambios)
- [ ] Detectar AUTHOR_ANOMALIES (nuevo author en rutas críticas)
- [ ] Detectar FORCE_PUSH_PATTERNS (--force, rebase, amend)
- [ ] Detectar SUPPLY_CHAIN_ANOMALIES (cambios en dependencies)
- [ ] Detectar BRANCH_PATTERNS (branching inusual o estrategia rara)
- [ ] Detectar MERGE_PATTERNS (merges inusitados o de fuentes externas)

### Detective Agent Correlation
- [ ] Correlacionar events con Inspector findings (mismo archivo/línea)
- [ ] Marcar findings que fueron modificados después de detection
- [ ] Crear timeline visual (fecha → autor → archivo → cambio)
- [ ] Asignar confidence scores a cada anomalía
- [ ] Agrupar eventos por patrón para reportería
- [ ] Detectar patrones de evolución de ataque (escalation)

### Pipeline Integration
- [ ] Asegurar que pipeline llama `run_detective_real()` en PASO 3
- [ ] Pasar commits REALES a Detective (ya se pasan)
- [ ] Guardar eventos en CodeSecurityEvent table
- [ ] Manejar errores LLM con fallback a rules-based
- [ ] Actualizar progress tracking (60% → 80%)
- [ ] Agregar logging de eventos generados

---

## PHASE 4: FISCAL AGENT — LLM REAL (2-3 días)

### Fiscal Agent Service
- [ ] Crear función `run_fiscal_real()` que use LLM (no stubs)
- [ ] Implementar con Anthropic Claude
- [ ] Agregar soporte fallback a otros providers
- [ ] Crear prompts para síntesis ejecutiva
- [ ] Parsear respuestas LLM a estructura CodeSecurityReport
- [ ] Enriquecer reporte con metadatos
- [ ] Agregar logging de síntesis generada
- [ ] Implementar error handling con fallback a stub

### Fiscal Agent Synthesis
- [ ] Generar executive summary (2-3 párrafos legibles)
- [ ] Crear narrativa de evolución de ataque (timeline)
- [ ] Asignar risk_level global (LOW/MEDIUM/HIGH/CRITICAL)
- [ ] Listar key_findings (top 5-10 hallazgos)
- [ ] Generar recommendations accionables (qué hacer ahora)
- [ ] Calcular confidence_level en análisis
- [ ] Crear desglose de severidad (crítico/alto/medio/bajo)
- [ ] Identificar funciones/módulos comprometidos

### Fiscal Agent Recommendations
- [ ] Priorizar recomendaciones por criticidad
- [ ] Incluir pasos de remediación (paso 1, 2, 3...)
- [ ] Asignar responsabilidades (qué área arreglar)
- [ ] Estimar impacto de cada recomendación
- [ ] Incluir timeline sugerido (inmediato/semana/mes)
- [ ] Enlazar recomendaciones a hallazgos específicos

### Report Storage
- [ ] Guardar report en CodeSecurityReport table
- [ ] Almacenar JSON completo en resumen_ejecutivo
- [ ] Almacenar desglose_severidad en tabla
- [ ] Almacenar narrativa_evolucion
- [ ] Almacenar pasos_remediacion como lista ordenada
- [ ] Guardar timestamp de generación
- [ ] Agregar metadata de provider LLM usado

### Pipeline Integration
- [ ] Asegurar que pipeline llama `run_fiscal_real()` en PASO 4
- [ ] Pasar findings + events a Fiscal
- [ ] Guardar reporte generado en BD
- [ ] Actualizar review.estado a "COMPLETED"
- [ ] Actualizar progress tracking (80% → 100%)
- [ ] Manejar errores con fallback a stub

---

## PHASE 5: FRONTEND INTEGRATION (1-2 días)

### Verificar API Calls
- [ ] Confirmar que CodeSecurityReviewsListPage carga lista
- [ ] Confirmar que CodeSecurityReviewDetailPage carga detail
- [ ] Verificar que crear review dispara análisis background
- [ ] Verificar que progress polling actualiza en tiempo real
- [ ] Confirmar que findings table muestra datos reales
- [ ] Confirmar que timeline muestra eventos reales
- [ ] Confirmar que report viewer muestra reporte real

### Findings Table
- [ ] Verificar que se muestran todos los hallazgos
- [ ] Confirmar que severity badges tienen colores correctos
- [ ] Confirmar que confidence % muestra bien
- [ ] Verificar que código snippet es visible
- [ ] Confirmar que puedo actualizar estado del finding
- [ ] Verificar que sorting/filtering funciona
- [ ] Confirmar que paginación funciona si hay 100+ findings

### Timeline Visualization
- [ ] Verificar que timeline muestra eventos en orden cronológico
- [ ] Confirmar que commit hashes se muestran
- [ ] Confirmar que autores se muestran
- [ ] Verificar que indicadores de riesgo se ven
- [ ] Confirmar que puedo hacer scroll en timeline
- [ ] Verificar que timestamps se formatean bien
- [ ] Confirmar que indicadores visuales (colores) funcionan

### Report Viewer
- [ ] Verificar que executive summary se muestra legible
- [ ] Confirmar que risk score gauge funciona
- [ ] Verificar que key findings se listan
- [ ] Confirmar que recomendaciones se ven ordenadas
- [ ] Verificar que narrativa de ataque se muestra bien
- [ ] Confirmar que desglose de severidad se visualiza
- [ ] Verificar que puedo copiar/compartir el reporte

### UX/UI Polish
- [ ] Verificar responsive design en mobile
- [ ] Confirmar que loading states son claros
- [ ] Verificar que error messages son útiles
- [ ] Confirmar que tabs funcionan en detail page
- [ ] Verificar que puedo volver a lista desde detail
- [ ] Confirmar que URL deep linking funciona
- [ ] Verificar que permisos RBAC se aplican en UI

---

## PHASE 6: BACKEND TEST SUITE (3-4 días)

### Detective Agent Tests (10-15 tests)
- [ ] Test: run_detective_real() con commits normales
- [ ] Test: detecta off-hours commits
- [ ] Test: detecta generic messages en archivos críticos
- [ ] Test: detecta múltiples commits en corto tiempo
- [ ] Test: detecta cambios a archivos de seguridad
- [ ] Test: detecta commits > 500 líneas
- [ ] Test: detecta primer author en ruta crítica
- [ ] Test: crea CodeSecurityEvent correctamente
- [ ] Test: maneja error de LLM con fallback
- [ ] Test: enriquece eventos con indicadores
- [ ] Test: correlaciona con Inspector findings
- [ ] Test: asigna confidence scores correctos
- [ ] Test: agrupa eventos por patrón
- [ ] Test: detecta patrones de escalation

### Fiscal Agent Tests (10-15 tests)
- [ ] Test: run_fiscal_real() genera reporte válido
- [ ] Test: crea executive summary legible
- [ ] Test: asigna risk_level basado en findings
- [ ] Test: lista key findings (top 5-10)
- [ ] Test: genera recommendations accionables
- [ ] Test: crea narrativa de evolución
- [ ] Test: calcula desglose de severidad
- [ ] Test: guarda reporte en BD
- [ ] Test: maneja error de LLM con fallback
- [ ] Test: enriquece reporte con metadata
- [ ] Test: correlaciona findings con recommendations
- [ ] Test: asigna timestamps correctos
- [ ] Test: resuelve formato JSON válido
- [ ] Test: maneja casos sin hallazgos

### API Endpoint Tests (14 tests)
- [ ] Test: POST /code_security_reviews (create)
- [ ] Test: GET /code_security_reviews (list)
- [ ] Test: GET /code_security_reviews/{id} (detail)
- [ ] Test: PATCH /code_security_reviews/{id} (update)
- [ ] Test: DELETE /code_security_reviews/{id} (soft delete)
- [ ] Test: POST /code_security_reviews/{id}/analyze (trigger)
- [ ] Test: GET /code_security_reviews/{id}/progress (polling)
- [ ] Test: GET /code_security_reviews/{id}/findings (list findings)
- [ ] Test: PATCH /code_security_reviews/{id}/findings/{fid} (update)
- [ ] Test: GET /code_security_reviews/{id}/events (timeline)
- [ ] Test: GET /code_security_reviews/{id}/report (report)
- [ ] Test: GET /code_security_reviews/{id}/export (JSON export)
- [ ] Test: POST /code_security_reviews/batch/org (batch scan)
- [ ] Test: Ownership isolation (user A no ve reviews de user B)

### Pipeline Integration Tests (5+ tests)
- [ ] Test: execute_scr_analysis() flujo completo
- [ ] Test: Git integration en pipeline
- [ ] Test: Inspector call en pipeline
- [ ] Test: Detective call en pipeline
- [ ] Test: Fiscal call en pipeline
- [ ] Test: Progress tracking (10% → 100%)
- [ ] Test: Error handling + fallback
- [ ] Test: Limpiar resultados previos
- [ ] Test: Logging de eventos
- [ ] Test: Transacción BD completa

### Model/Schema Tests (5+ tests)
- [ ] Test: CodeSecurityReview soft delete
- [ ] Test: CodeSecurityFinding constraints
- [ ] Test: CodeSecurityEvent timestamps
- [ ] Test: CodeSecurityReport storage
- [ ] Test: Fingerprint generation consistency
- [ ] Test: User ownership field
- [ ] Test: Índices para queries frecuentes

### Target Coverage
- [ ] Backend coverage >= 70%
- [ ] Inspector Agent: 100%
- [ ] Detective Agent: 90%+
- [ ] Fiscal Agent: 90%+
- [ ] Pipeline: 85%+
- [ ] API: 95%+
- [ ] Services: 80%+

---

## PHASE 7: E2E TESTS (2-3 días)

### User Journey Tests
- [ ] Test: Usuario crea review (form input)
- [ ] Test: Review dispara análisis background
- [ ] Test: Progress bar actualiza en tiempo real
- [ ] Test: Al completar → se muestran findings
- [ ] Test: Usuario ve timeline de eventos
- [ ] Test: Usuario ve reporte ejecutivo
- [ ] Test: Usuario puede exportar findings

### Filtering & Sorting Tests
- [ ] Test: Filtrar findings por severidad
- [ ] Test: Filtrar findings por tipo
- [ ] Test: Filtrar timeline por fecha
- [ ] Test: Ordenar findings por confidence
- [ ] Test: Buscar en findings por texto

### Error Scenarios
- [ ] Test: Repo URL inválida
- [ ] Test: Sin acceso a repo
- [ ] Test: Timeout en clone
- [ ] Test: LLM no disponible (fallback)
- [ ] Test: Usuario sin permisos
- [ ] Test: Review no existe
- [ ] Test: Encontrar en estado inválido

### Responsiveness
- [ ] Test: Mobile view (375px)
- [ ] Test: Tablet view (768px)
- [ ] Test: Desktop view (1920px)
- [ ] Test: Touch interactions
- [ ] Test: Keyboard navigation

### Performance
- [ ] Test: Load list con 100+ reviews
- [ ] Test: Load detail con 1000+ findings
- [ ] Test: Timeline scrolling smooth
- [ ] Test: Report rendering < 2s

---

## PHASE 8: ADVANCED FEATURES (2-3 días)

### PDF Export
- [ ] Generar PDF de reporte ejecutivo
- [ ] Incluir findings con code snippets
- [ ] Incluir timeline forensic
- [ ] Incluir recomendaciones
- [ ] Formatear con branding AppSec
- [ ] Crear filename con review ID + fecha
- [ ] Descargar desde API endpoint

### Incremental Analysis
- [ ] Detectar commits ya analizados
- [ ] Re-analizar solo commits nuevos
- [ ] Comparar con análisis previo
- [ ] Marcar hallazgos nuevos vs repetidos
- [ ] Actualizar histórico de findings

### False Positive Learning
- [ ] Guardar "false positives" marcados por user
- [ ] Usar ML para mejorar detection
- [ ] Reducir falsos positivos en próximos análisis
- [ ] Feedback loop analyst → LLM

### Custom Risk Scoring
- [ ] Permitir admin customizar weights de patterns
- [ ] Aplicar custom scoring a nuevos análisis
- [ ] Audit trail de cambios de scoring
- [ ] Reportar impacto de cambios

### Alert Notifications
- [ ] Notificar cuando hallazgos críticos detectados
- [ ] Email a security team
- [ ] Slack integration
- [ ] Custom thresholds por severidad
- [ ] Unsubscribe options

### Webhook Integrations
- [ ] POST findings a sistemas externos
- [ ] POST reportes a dashboards
- [ ] Trigger remediation workflows
- [ ] Jira integration para tickets

---

## PHASE 9: OPTIMIZATION & POLISH (3-5 días)

### Performance Optimization
- [ ] Caching de análisis iguales
- [ ] Code chunking inteligente
- [ ] Parallel LLM calls donde posible
- [ ] DB query optimization
- [ ] Frontend bundle size reduction

### Compliance & Security
- [ ] SOC2 compliance checks
- [ ] ISO27001 mapping
- [ ] Data retention policies
- [ ] PII handling verification
- [ ] API rate limiting
- [ ] CSRF protection

### Documentation
- [ ] API documentation completa (OpenAPI)
- [ ] User guide (cómo usar)
- [ ] Admin guide (configuración)
- [ ] Developer guide (extensiones)
- [ ] Troubleshooting guide
- [ ] FAQ

### UI/UX Polish
- [ ] Dark mode support
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Error message UX
- [ ] Loading state animations
- [ ] Empty state designs
- [ ] Confirmation dialogs

### Monitoring & Observability
- [ ] Metrics dashboard (# analyses/day, avg time, LLM costs)
- [ ] Error rate monitoring
- [ ] LLM provider health checks
- [ ] Performance alerts
- [ ] Cost tracking por provider

### Database Maintenance
- [ ] Índices para queries comunes
- [ ] Vacuum/optimize strategy
- [ ] Backup & restore procedures
- [ ] Migration testing
- [ ] Rollback plan

---

## TOTALES POR FASE

| Fase | Tasks | Effort | Status |
|------|-------|--------|--------|
| 3: Detective LLM | 20 | 2-3 days | 🔴 NOT STARTED |
| 4: Fiscal LLM | 20 | 2-3 days | 🔴 NOT STARTED |
| 5: Frontend | 20 | 1-2 days | 🟨 IN PROGRESS |
| 6: Backend Tests | 60+ | 3-4 days | 🔴 NOT STARTED |
| 7: E2E Tests | 20 | 2-3 days | 🔴 NOT STARTED |
| 8: Advanced | 25 | 2-3 days | 🔴 NOT STARTED |
| 9: Polish | 20 | 3-5 days | 🔴 NOT STARTED |
| **TOTAL** | **185+ tasks** | **16-23 days** | **60% → 100%** |

---

## CAMINO CRÍTICO (Fast Path to MVP)

**Si solo quieres llegar a MVP (80% funcionalidad):**

1. **Phase 3: Detective LLM** (2-3 días) - ⚠️ BLOCKER
2. **Phase 4: Fiscal LLM** (2-3 días) - ⚠️ BLOCKER
3. **Phase 6: Backend Tests** (3-4 días) - ⚠️ CRITICAL
4. **Phase 7: E2E Tests** (2-3 días) - ⚠️ CRITICAL

**Total: 10-13 días para MVP funcional**

Luego puedes agregar Features avanzadas (Phase 8-9) en paralelo.

---

## ORDEN RECOMENDADO

```
SEMANA 1:
├─ Phase 3 (Detective LLM) - 2-3 días
├─ Phase 4 (Fiscal LLM) - 2-3 días
└─ Phase 5 (Frontend Verify) - 1-2 días (en paralelo)

SEMANA 2:
├─ Phase 6 (Backend Tests) - 3-4 días
└─ Phase 7 (E2E Tests) - 2-3 días

SEMANA 3:
├─ Phase 8 (Advanced Features) - 2-3 días
└─ Phase 9 (Polish & Optimization) - 3-5 días

TOTAL: 16-23 días para 100%
```

---

**Last Updated:** 29 April 2026  
**Branch:** feat/scr-code-security-review
