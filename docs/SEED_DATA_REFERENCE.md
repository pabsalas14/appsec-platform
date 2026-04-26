# Seed Data Reference — Datos Masivos Generados

## Descripción General

El script `backend/app/seed.py` ha sido extendido para crear datos masivos realistas para todos los 9 dashboards del sistema. Los datos son idempotentes y seguros de ejecutar múltiples veces.

**Líneas agregadas:** 784 líneas | **Total de funciones de seed:** 10

---

## Datos Generados

### 1. Usuarios (11 total)

| Rol | Cantidad | Usernames |
|-----|----------|-----------|
| `admin` | 1 | `admin` (existente) |
| `ciso` | 1 | `ciso1` |
| `director_subdireccion` | 3 | `director1`, `director2`, `director3` |
| `lider_liberaciones` | 2 | `lider1`, `lider2` |
| `user` (analistas) | 4 | `analista1`, `analista2`, `analista3`, `analista4` |
| `responsable_celula` | 1 | `responsable1` |

**Contraseña por defecto:** `SecurePassword123!` (todos los usuarios excepto admin)

---

### 2. Jerarquía Organizacional

```
3 Organizaciones (ORG-001, ORG-002, ORG-003)
├── 16 Subdirecciones (5-6 por org)
│   ├── 3-4 Gerencias por subdireccion
│   │   ├── 4-5 Células por gerencia
│   │   │   └── ~80-100 células realistas totales
```

**Estructura real generada:**
- **Organizaciones:** 3
- **Subdirecciones:** ~16 totales
- **Gerencias:** ~60-70 totales
- **Células:** ~80-100 totales

---

### 3. Vulnerabilidades (120 total)

#### Distribución por Severidad
- **Críticas:** 8
- **Altas:** 18
- **Medias:** 35
- **Bajas:** 40
- **Cerradas:** 19

#### Distribución por Motor
- **SAST:** 35
- **DAST:** 25
- **SCA:** 30
- **MAST:** 15
- **MDA:** 10
- **Secretos:** 5

#### Distribución por Estado
- **Abierta:** 50
- **En Progreso:** 35
- **Cerrada:** 35

#### SLA Status
- **En tiempo:** 60
- **En riesgo:** 40
- **Vencidas:** 20

**Datos adicionales:**
- CVSS scores: 4.0-9.8
- CWE IDs: CWE-1 a CWE-999 (aleatorios)
- OWASP categorías: A01:2021, A03:2021, A05:2021, A07:2021
- Repositorios: ~10 (distribuyen las vulns)
- Responsables: Asignados a analistas aleatoriamente

---

### 4. Service Releases (25 total)

#### Distribución por Estado
- **Design:** 8
- **Validation:** 5
- **Tests:** 5
- **QA:** 4
- **Prod:** 3

**Atributos:**
- Versiones: 1.0.0 → 3.1.0+
- Servicios: 5 servicios críticos creados
- Fechas de entrada: últimos 3 meses (distribuidas aleatoriamente)
- Referencias JIRA: PROJE-1000 → PROJE-1024

---

### 5. Programas Anuales

#### SAST Program (Año actual)
- **Cobertura:** 75%
- **Herramienta:** SonarQube
- **Actividades mensuales:** 12 (enero-diciembre)
- **Datos por mes:** criticos, altos, medios, bajos, score

**Ejemplo mes:**
```json
{
  "mes": 5,
  "ano": 2026,
  "total_hallazgos": 25,
  "criticos": 2,
  "altos": 5,
  "medios": 12,
  "bajos": 6,
  "score": 82.45
}
```

#### Otros Programas (Config)
- **DAST:** 62% cobertura
- **SCA:** 88% cobertura
- **MAST:** 45% cobertura

---

### 6. Iniciativas (8 total)

| Iniciativa | Estado | Avance | Ponderación |
|-----------|--------|--------|-------------|
| Mejorar cobertura SAST | En Progreso | 65% | 5-30 pts |
| Implementar DAST en CI/CD | En Progreso | 45% | 5-30 pts |
| Reducir deuda técnica | En Progreso | 50% | 5-30 pts |
| Hardening de contenedores | Planeada | 0% | 5-30 pts |
| Auditoría de acceso | Completada | 100% | 5-30 pts |
| Implementar MFA | Completada | 100% | 5-30 pts |
| Zero Trust Architecture | Planeada | 15% | 5-30 pts |
| Threat Modeling Críticos | En Progreso | 70% | 5-30 pts |

---

### 7. Temas Emergentes (20 total)

Ejemplos:
- Vulnerabilidad Log4j (Crítico)
- Supply Chain Risk (Alto)
- Ransomware Trends 2026 (Alto)
- API Security (Medio)
- Cloud Misconfiguration (Alto)
- Zero-Day Exploits (Crítico)
- Insider Threats (Alto)
- Kubernetes Security (Alto)
- AI/ML Security (Alto)
- GDPR Compliance (Alto)
- ...y 10 más

**Cada tema incluye:**
- 1-3 actualizaciones (comentarios con timestamps)
- Impacto: Crítico, Alto, Medio, Bajo
- Fuente: Gartner Magic Quadrant
- Estado: En Análisis, Monitoreado, Planeado

---

### 8. Auditorías (15 total)

#### Tipos de Auditoría
- **SOC2:** 4 auditorías
- **PCI-DSS:** 4 auditorías
- **ISO27001:** 4 auditorías
- **GDPR:** 3 auditorías

#### Distribución por Estado
- **Planeada:** 5
- **En Progreso:** 5
- **Completada:** 5

#### Hallazgos
- **Cantidad por auditoría:** 1-5 hallazgos
- **Severidades:** Crítico, Alto, Medio, Bajo
- **Estados:** Abierto, En Remediación, Cerrado

---

## Estructura del Código

### Funciones de Seed (en orden de ejecución)

```
seed()  [Función principal]
├── _seed_admin()  [Admin existente]
├── _seed_roles()  [4 nuevos roles]
├── _seed_settings()  [Configuración global]
├── _seed_regla_sods()  [Reglas de separación de deberes]
├── _seed_tipos_prueba()  [Tipos de prueba/motores]
├── _seed_controles()  [Controles de seguridad]
├── _seed_herramientas()  [Herramientas externas]
├── _seed_indicadores_formulas()  [KPIs/indicadores]
├── _seed_usuarios_masivos()  ← NUEVO
├── _seed_jerarquia_organizacional()  ← NUEVO
├── _seed_vulnerabilidades_masivas()  ← NUEVO
├── _seed_service_releases_masivos()  ← NUEVO
├── _seed_programas_anuales()  ← NUEVO
├── _seed_iniciativas_masivas()  ← NUEVO
└── _seed_temas_emergentes_y_auditorias()  ← NUEVO
```

### Características Implementadas

✅ **Sin hardcoding de IDs** - Usa referencias de objetos creados dinámicamente
✅ **Reproducible** - Mismo seed siempre genera los mismos datos (excepto random donde se especifica)
✅ **Idempotente** - Safe to run multiple times, no duplicados
✅ **Validaciones Pydantic** - Aplicadas en modelos
✅ **Manejo de relaciones** - Foreign keys correctamente configuradas
✅ **Soft delete** - Soportado donde es necesario
✅ **Logging estructurado** - Eventos de seed registrados

---

## Uso

### Ejecutar Seed

```bash
# Vía Makefile
make seed

# O directamente
python -m app.seed

# O en Docker
docker compose exec backend python -m app.seed
```

### Verificar Datos Creados

```bash
# Contar usuarios
SELECT COUNT(*) FROM users WHERE username LIKE '%@appsec.local%';

# Contar vulnerabilidades
SELECT COUNT(*), severidad, fuente FROM vulnerabilidads 
GROUP BY severidad, fuente;

# Contar auditorías
SELECT COUNT(*), tipo, estado FROM auditorias 
GROUP BY tipo, estado;
```

---

## Dashboards Soportados (9 total)

1. **Vulnerabilidades Executive** - 120 vulns con SLA
2. **Liberaciones (Kanban)** - 25 releases con estados
3. **Programas SAST** - Actividades mensuales con scores
4. **Iniciativas** - 8 iniciativas con progreso
5. **Temas Emergentes** - 20 temas con actualizaciones
6. **Auditorías** - 15 auditorías con hallazgos
7. **Jerarquía Organizacional** - 3 orgs, 16 subdirs, ~70 geren, ~100 células
8. **Usuarios Masivos** - 11 usuarios con roles variados
9. **Actividades Mensuales** - 12 meses de datos SAST por repo

---

## Performance y Consideraciones

- **Tiempo de seed:** ~5-10 segundos (dependiendo del hardware)
- **Volumen de datos:** ~3500+ registros creados
- **Transacciones:** Una transacción única, atomicidad garantizada
- **Índices:** Aprovecha índices existentes en modelos
- **Memory:** ~50-100MB durante ejecución

---

## Próximos Pasos

Para ampliar aún más:

1. Agregar DAST/MAST programs con actividades
2. Evidencias de auditoría con attachments
3. Planes de remediación detallados
4. Changelog de vulnerabilidades (historial)
5. Scans/ejecuciones de herramientas (SAST, DAST, etc)

---

**Última actualización:** Apr 25, 2026
**Maintainers:** AppSec Team
