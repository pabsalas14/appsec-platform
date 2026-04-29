# Guía de Usuario - Módulo SCR (Code Security Reviews)

## ¿Qué es SCR?

El módulo **Code Security Reviews (SCR)** es una herramienta avanzada que utiliza Inteligencia Artificial para analizar código fuente en busca de patrones maliciosos, generar timelines forenses de Git y crear reportes ejecutivos para directivos.

**Características principales:**
- ✅ Análisis de malicia en código (backdoors, inyecciones, lógica dañina)
- ✅ Timeline forense de commits y autores
- ✅ Reportes ejecutivos con narrativa de riesgo
- ✅ Completamente independiente de otros módulos

## Cómo Crear un Análisis SCR

### 1. Acceder al Módulo
1. Ve a `/code_security_reviews` en el dashboard
2. Haz clic en "Crear Nueva Revisión"

### 2. Configurar el Análisis
- **Título**: Nombre descriptivo del análisis
- **URL del Repositorio**: URL de GitHub del repositorio a analizar
- **Rama**: Rama específica (por defecto: `main`)
- **Modo de Escaneo**: `PUBLIC_URL` para repos públicos

### 3. Ejecutar el Análisis
1. Haz clic en "Crear Revisión"
2. Una vez creada, haz clic en "Analizar"
3. El análisis se ejecuta en segundo plano (puede tomar varios minutos)

### 4. Ver Resultados
- **Hallazgos**: Lista de patrones maliciosos detectados
- **Timeline**: Cronología de commits sospechosos
- **Reporte**: Resumen ejecutivo con evaluación de riesgo

## Interpretar Resultados

### Severidades
- **CRÍTICO**: Requiere atención inmediata (backdoors, exfiltración)
- **ALTO**: Alto riesgo (inyección, escalada de privilegios)
- **MEDIO**: Riesgo moderado (código ofuscado, permisos sospechosos)
- **BAJO**: Riesgo bajo

### Indicadores Forenses
- **HIDDEN_COMMITS**: Mensajes genéricos en archivos críticos
- **TIMING_ANOMALIES**: Commits fuera del horario laboral
- **CRITICAL_FILES**: Cambios en archivos de seguridad
- **MASS_CHANGES**: Commits grandes que ocultan cambios

## Casos de Uso Comunes

### 1. Revisión de Código de Terceros
- Analizar librerías o dependencias antes de integrarlas
- Verificar proveedores externos

### 2. Investigación de Incidentes
- Analizar repositorios comprometidos
- Identificar patrones de ataque

### 3. Auditorías de Seguridad
- Revisiones periódicas de código crítico
- Evaluación de riesgos en desarrollo

## Solución de Problemas

### Error: "No se pudo clonar repositorio"
- Verifica que la URL sea correcta
- Asegúrate de que el repositorio sea público
- Verifica permisos de red

### Error: "Análisis falló"
- Revisa logs del sistema
- Verifica configuración de tokens de IA
- Contacta al administrador

### Análisis se queda en "ANALYZING"
- Los análisis pueden tomar tiempo (5-15 minutos)
- Refresca la página o espera

## Configuración Administrativa

### Variables de Entorno
- `SCR_GITHUB_TOKEN`: Token de GitHub para acceso a repositorios
- `ANTHROPIC_API_KEY`: API key para análisis con Claude
- `OPENAI_API_KEY`: API key alternativa

### Límites
- Máximo 5 creaciones de revisión por usuario/hora
- Máximo 3 análisis por usuario/hora
- Máximo 500 archivos por repositorio
- Máximo 100MB por repositorio

## API Reference

### Endpoints Principales
- `GET /api/v1/code_security_reviews` - Listar revisiones
- `POST /api/v1/code_security_reviews` - Crear revisión
- `POST /api/v1/code_security_reviews/{id}/analyze` - Ejecutar análisis
- `GET /api/v1/code_security_reviews/{id}/findings` - Ver hallazgos
- `GET /api/v1/code_security_reviews/{id}/events` - Ver timeline
- `GET /api/v1/code_security_reviews/{id}/report` - Ver reporte ejecutivo

## Soporte

Para soporte técnico o preguntas:
1. Revisa esta documentación
2. Consulta logs del sistema
3. Contacta al equipo de desarrollo

---

**Versión:** 1.0
**Última actualización:** Abril 2026</content>
<parameter name="filePath">/Users/pablosalas/Appsec/appsec-platform/docs/SCR_USER_GUIDE.md