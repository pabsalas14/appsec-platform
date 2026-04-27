# SQL Queries — Analizar Datos Generados por Seed Masivo

Documento con queries útiles para inspeccionar los datos generados por el seed masivo.

---

## Usuarios y Roles

### Listar todos los usuarios masivos creados

```sql
SELECT 
    id, username, full_name, email, role, is_active, created_at
FROM users 
WHERE username LIKE '%@appsec.local%' OR role IN ('ciso', 'director_subdireccion', 'lider_liberaciones', 'responsable_celula')
ORDER BY role, username;
```

### Contar usuarios por rol

```sql
SELECT 
    role, COUNT(*) as count
FROM users 
WHERE username LIKE '%@appsec.local%' OR role IN ('ciso', 'director_subdireccion', 'lider_liberaciones', 'responsable_celula')
GROUP BY role
ORDER BY count DESC;
```

---

## Jerarquía Organizacional

### Ver jerarquía completa (orgs → subdirs → gerencias)

```sql
SELECT 
    o.nombre as org,
    o.codigo as org_code,
    s.nombre as subdir,
    s.codigo as subdir_code,
    g.nombre as gerencia,
    COUNT(DISTINCT c.id) as num_celulas
FROM organizacions o
LEFT JOIN subdireccions s ON s.user_id = o.user_id
LEFT JOIN gerencias g ON g.subdireccion_id = s.id
LEFT JOIN celulas c ON c.organizacion_id = o.id
WHERE o.deleted_at IS NULL 
  AND s.deleted_at IS NULL
  AND g.deleted_at IS NULL
  AND c.deleted_at IS NULL
GROUP BY o.id, s.id, g.id
ORDER BY o.codigo, s.codigo, g.nombre;
```

### Contar entidades en jerarquía

```sql
SELECT 
    'Organizaciones' as entity, COUNT(DISTINCT id) as count FROM organizacions WHERE deleted_at IS NULL
UNION ALL
SELECT 'Subdirecciones', COUNT(DISTINCT id) FROM subdireccions WHERE deleted_at IS NULL
UNION ALL
SELECT 'Gerencias', COUNT(DISTINCT id) FROM gerencias WHERE deleted_at IS NULL
UNION ALL
SELECT 'Células', COUNT(DISTINCT id) FROM celulas WHERE deleted_at IS NULL;
```

---

## Vulnerabilidades (Dashboard 1)

### Contar vulnerabilidades por severidad

```sql
SELECT 
    severidad, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vulnerabilidads 
WHERE deleted_at IS NULL
GROUP BY severidad
ORDER BY 
    CASE severidad 
        WHEN 'Critica' THEN 1
        WHEN 'Alta' THEN 2
        WHEN 'Media' THEN 3
        WHEN 'Baja' THEN 4
        WHEN 'Cerrada' THEN 5
    END;
```

### Vulnerabilidades por motor (fuente)

```sql
SELECT 
    fuente as motor, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vulnerabilidads 
WHERE deleted_at IS NULL
GROUP BY fuente
ORDER BY count DESC;
```

### Vulnerabilidades por estado

```sql
SELECT 
    estado, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vulnerabilidads 
WHERE deleted_at IS NULL
GROUP BY estado
ORDER BY count DESC;
```

### SLA análisis

```sql
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN fecha_limite_sla > NOW() THEN 1 END) as en_tiempo,
    COUNT(CASE WHEN fecha_limite_sla BETWEEN NOW() - INTERVAL '3 days' AND NOW() THEN 1 END) as en_riesgo,
    COUNT(CASE WHEN fecha_limite_sla < NOW() THEN 1 END) as vencidas
FROM vulnerabilidads 
WHERE deleted_at IS NULL AND estado != 'Cerrada';
```

### Vulnerabilidades por repositorio

```sql
SELECT 
    r.nombre,
    r.url,
    COUNT(v.id) as count
FROM repositorios r
LEFT JOIN vulnerabilidads v ON v.repositorio_id = r.id AND v.deleted_at IS NULL
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.nombre, r.url
ORDER BY count DESC;
```

### Top 10 vulnerabilidades críticas/altas

```sql
SELECT 
    titulo,
    severidad,
    fuente,
    estado,
    cvss_score,
    fecha_limite_sla,
    created_at
FROM vulnerabilidads 
WHERE deleted_at IS NULL AND severidad IN ('Critica', 'Alta')
ORDER BY 
    CASE severidad WHEN 'Critica' THEN 1 WHEN 'Alta' THEN 2 END,
    fecha_limite_sla ASC
LIMIT 10;
```

---

## Service Releases (Dashboard 2)

### Releases por estado

```sql
SELECT 
    estado_actual, 
    COUNT(*) as count,
    COUNT(CASE WHEN estado_actual = 'Prod' THEN 1 END) as in_prod,
    COUNT(CASE WHEN estado_actual = 'Design' THEN 1 END) as in_design
FROM service_releases 
WHERE deleted_at IS NULL
GROUP BY estado_actual
ORDER BY 
    CASE estado_actual 
        WHEN 'Design' THEN 1
        WHEN 'Validation' THEN 2
        WHEN 'Tests' THEN 3
        WHEN 'QA' THEN 4
        WHEN 'Prod' THEN 5
    END;
```

### Timeline de releases (últimos 3 meses)

```sql
SELECT 
    DATE_TRUNC('week', fecha_entrada) as week,
    COUNT(*) as releases,
    estado_actual
FROM service_releases 
WHERE deleted_at IS NULL 
  AND fecha_entrada >= NOW() - INTERVAL '3 months'
GROUP BY week, estado_actual
ORDER BY week DESC, estado_actual;
```

### Releases por servicio

```sql
SELECT 
    s.nombre as servicio,
    s.criticidad,
    COUNT(sr.id) as num_releases,
    COUNT(CASE WHEN sr.estado_actual = 'Prod' THEN 1 END) as in_prod
FROM servicios s
LEFT JOIN service_releases sr ON sr.servicio_id = s.id AND sr.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.nombre, s.criticidad
ORDER BY num_releases DESC;
```

---

## Programas SAST (Dashboard 3)

### Actividades mensuales de SAST

```sql
SELECT 
    ps.nombre,
    ams.ano,
    ams.mes,
    ams.total_hallazgos,
    ams.criticos,
    ams.altos,
    ams.medios,
    ams.bajos,
    ams.score
FROM programa_sasts ps
JOIN actividad_mensual_sasts ams ON ams.programa_sast_id = ps.id
WHERE ps.deleted_at IS NULL AND ams.deleted_at IS NULL
ORDER BY ps.nombre, ams.ano DESC, ams.mes DESC;
```

### Score promedio por mes

```sql
SELECT 
    ams.mes,
    ROUND(AVG(ams.score), 2) as avg_score,
    MIN(ams.score) as min_score,
    MAX(ams.score) as max_score
FROM actividad_mensual_sasts ams
WHERE ams.deleted_at IS NULL AND ams.ano = EXTRACT(YEAR FROM NOW())
GROUP BY ams.mes
ORDER BY ams.mes;
```

### Cobertura por repositorio

```sql
SELECT 
    r.nombre,
    ps.metadatos_motor->>'cobertura' as cobertura_sast,
    ROUND((ps.metadatos_motor->>'cobertura')::float * 100, 0) || '%' as cobertura_pct
FROM repositorios r
LEFT JOIN programa_sasts ps ON ps.repositorio_id = r.id AND ps.deleted_at IS NULL
WHERE r.deleted_at IS NULL
ORDER BY r.nombre;
```

---

## Iniciativas (Dashboard 4)

### Iniciativas por estado y avance

```sql
SELECT 
    titulo,
    estado,
    ROUND((custom_fields->>'avance_porcentaje')::float, 2) as avance_pct,
    custom_fields->>'ponderacion' as ponderacion,
    fecha_inicio,
    fecha_fin_estimada,
    EXTRACT(DAY FROM fecha_fin_estimada - NOW()) as dias_restantes
FROM iniciativas 
WHERE deleted_at IS NULL
ORDER BY 
    CASE estado WHEN 'En Progreso' THEN 1 WHEN 'Planeada' THEN 2 WHEN 'Completada' THEN 3 END,
    (custom_fields->>'avance_porcentaje')::float DESC;
```

### Iniciativas completadas vs en progreso

```sql
SELECT 
    estado,
    COUNT(*) as count,
    ROUND(AVG((custom_fields->>'avance_porcentaje')::float), 2) as avg_avance,
    SUM((custom_fields->>'ponderacion')::int) as total_ponderacion
FROM iniciativas 
WHERE deleted_at IS NULL
GROUP BY estado;
```

---

## Temas Emergentes (Dashboard 5)

### Temas por impacto

```sql
SELECT 
    impacto,
    COUNT(*) as count,
    estado
FROM temas_emergentes 
WHERE deleted_at IS NULL
GROUP BY impacto, estado
ORDER BY 
    CASE impacto WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END,
    count DESC;
```

### Temas con actualizaciones recientes

```sql
SELECT 
    te.titulo,
    te.impacto,
    te.estado,
    COUNT(atu.id) as num_actualizaciones,
    MAX(atu.fecha) as last_update
FROM temas_emergentes te
LEFT JOIN actualizacion_temas atu ON atu.tema_id = te.id AND atu.deleted_at IS NULL
WHERE te.deleted_at IS NULL
GROUP BY te.id, te.titulo, te.impacto, te.estado
ORDER BY last_update DESC NULLS LAST;
```

---

## Auditorías (Dashboard 6)

### Auditorías por tipo y estado

```sql
SELECT 
    tipo,
    estado,
    COUNT(*) as count
FROM auditorias 
WHERE deleted_at IS NULL
GROUP BY tipo, estado
ORDER BY tipo, 
    CASE estado WHEN 'Planeada' THEN 1 WHEN 'En Progreso' THEN 2 WHEN 'Completada' THEN 3 END;
```

### Hallazgos por auditoría

```sql
SELECT 
    a.titulo as auditoria,
    a.tipo,
    COUNT(h.id) as num_hallazgos,
    COUNT(CASE WHEN h.severidad = 'Crítico' THEN 1 END) as criticos,
    COUNT(CASE WHEN h.severidad = 'Alto' THEN 1 END) as altos,
    COUNT(CASE WHEN h.severidad = 'Medio' THEN 1 END) as medios
FROM auditorias a
LEFT JOIN hallazgo_auditorias h ON h.auditoria_id = a.id AND h.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.titulo, a.tipo
ORDER BY num_hallazgos DESC;
```

### Timeline de auditorías

```sql
SELECT 
    tipo,
    EXTRACT(MONTH FROM fecha_inicio) as mes,
    EXTRACT(YEAR FROM fecha_inicio) as ano,
    COUNT(*) as count,
    estado
FROM auditorias 
WHERE deleted_at IS NULL
GROUP BY tipo, ano, mes, estado
ORDER BY ano DESC, mes DESC, tipo;
```

---

## Jerarquía y Estructura Org (Dashboard 7)

### Estructura de poder (top down)

```sql
SELECT 
    o.nombre as organizacion,
    s.nombre as subdireccion,
    s.director_nombre,
    g.nombre as gerencia,
    COUNT(DISTINCT c.id) as cells,
    COUNT(DISTINCT r.id) as repos,
    COUNT(DISTINCT v.id) as vulns
FROM organizacions o
LEFT JOIN subdireccions s ON s.user_id = o.user_id
LEFT JOIN gerencias g ON g.subdireccion_id = s.id
LEFT JOIN celulas c ON c.organizacion_id = o.id
LEFT JOIN repositorios r ON r.celula_id = c.id
LEFT JOIN vulnerabilidads v ON v.repositorio_id = r.id AND v.deleted_at IS NULL
WHERE o.deleted_at IS NULL 
  AND s.deleted_at IS NULL
GROUP BY o.id, s.id, g.id, o.nombre, s.nombre, s.director_nombre, g.nombre
ORDER BY o.nombre, s.nombre, g.nombre;
```

---

## Usuarios (Dashboard 8)

### Distribución de usuarios por rol

```sql
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active THEN 1 END) as active
FROM users 
WHERE username LIKE '%@appsec.local%' OR role IN ('ciso', 'director_subdireccion', 'lider_liberaciones', 'responsable_celula')
GROUP BY role
ORDER BY count DESC;
```

### Auditoría de usuario (actividades)

```sql
SELECT 
    u.username,
    u.role,
    COUNT(v.id) as vulns_created,
    COUNT(CASE WHEN v.responsable_id = u.id THEN 1 END) as vulns_assigned,
    u.created_at
FROM users u
LEFT JOIN vulnerabilidads v ON v.user_id = u.id AND v.deleted_at IS NULL
WHERE u.username LIKE '%@appsec.local%'
GROUP BY u.id, u.username, u.role, u.created_at
ORDER BY vulns_created DESC;
```

---

## Dashboard Data Summary

### Dashboard Overview (todos los números en una query)

```sql
SELECT 
    'Users' as entity, COUNT(*) as count FROM users WHERE deleted_at IS NULL
UNION ALL SELECT 'Vulnerabilities', COUNT(*) FROM vulnerabilidads WHERE deleted_at IS NULL
UNION ALL SELECT 'Service Releases', COUNT(*) FROM service_releases WHERE deleted_at IS NULL
UNION ALL SELECT 'Initiatives', COUNT(*) FROM iniciativas WHERE deleted_at IS NULL
UNION ALL SELECT 'Audits', COUNT(*) FROM auditorias WHERE deleted_at IS NULL
UNION ALL SELECT 'Emerging Themes', COUNT(*) FROM temas_emergentes WHERE deleted_at IS NULL
UNION ALL SELECT 'Organizations', COUNT(*) FROM organizacions WHERE deleted_at IS NULL
UNION ALL SELECT 'Subdirections', COUNT(*) FROM subdireccions WHERE deleted_at IS NULL
UNION ALL SELECT 'Gerencias', COUNT(*) FROM gerencias WHERE deleted_at IS NULL
UNION ALL SELECT 'Cells', COUNT(*) FROM celulas WHERE deleted_at IS NULL;
```

---

## Notas

- Todos los queries excluyen soft-deleted registros (`deleted_at IS NULL`)
- Ajusta `NOW()` y `INTERVAL` según tus necesidades
- Para actualizar datos, recuerda que pueden ser regenerados por seed
- Los datos son realistas pero aleatorios — no son secretos reales

**Last Updated:** Apr 25, 2026
