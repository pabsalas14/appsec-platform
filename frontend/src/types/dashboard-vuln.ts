/**
 * Dashboard 4 - Vulnerabilities (4-Drill)
 * Types para el dashboard de vulnerabilidades con drill-down de 4 niveles
 */

/**
 * Nivel 0: Global
 * Datos agregados a nivel global
 */
export interface VulnGlobalData {
  total: number;
  by_severity: Record<string, number>;
  by_state: Record<string, number>;
}

/**
 * Nivel 1: Subdirección
 * Datos agregados por subdirección
 */
export interface VulnSubdireccionData {
  total: number;
  by_severity: Record<string, number>;
  hierarchy_id: string;
}

/**
 * Nivel 2: Célula
 * Datos agregados por célula
 */
export interface VulnCelulaData {
  total: number;
  by_severity: Record<string, number>;
  hierarchy_id: string;
}

/**
 * Vulnerabilidad individual (en tabla)
 */
export interface VulnerabilidadRow {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: string;
  estado: string;
  fecha_hallazgo: string;
  fecha_limite_sla: string;
  fuente: string;
  referencia: string;
  remediador_asignado?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Nivel 3: Repositorio - Respuesta paginada
 * Datos por motor (SAST, DAST, SCA, MAST-MDA, Secrets, CDS)
 */
export interface VulnRepositorioTab {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: VulnerabilidadRow[];
}

/**
 * Nivel 3: Repositorio - Historial
 * Tendencia histórica de vulnerabilidades
 */
export interface VulnHistorialEntry {
  fecha: string;
  total: number;
  por_severidad: Record<string, number>;
}

export interface VulnHistorial {
  data: VulnHistorialEntry[];
  tendencia: 'mejora' | 'degradacion' | 'estable';
}

/**
 * Nivel 3: Repositorio - Configuración
 * Información de configuración del repositorio
 */
export interface VulnConfig {
  repositorio_id: string;
  repositorio_nombre: string;
  ultima_ejecucion_sast?: string;
  ultima_ejecucion_dast?: string;
  ultima_ejecucion_sca?: string;
  motores_habilitados: string[];
  frecuencia_scans: string;
}

/**
 * Nivel 3: Repositorio - Resumen general
 * Resumen de todas las vulnerabilidades del repositorio
 */
export interface VulnResumen {
  total: number;
  by_severity: Record<string, number>;
  by_state: Record<string, number>;
  by_motor: Record<string, number>;
  sla_vencido: number;
  sla_proximo_a_vencer: number;
}

/**
 * Estado de navegación drill-down
 */
export interface DrilldownLevel {
  id: string;
  name: string;
  type: 'global' | 'subdireccion' | 'celula' | 'repositorio';
}

/**
 * Estado de la vista de tabs (nivel 3)
 */
export type TabType = 'sast' | 'dast' | 'sca' | 'mast-mda' | 'secrets' | 'cds' | 'historial' | 'config' | 'resumen';

/**
 * Parámetros de paginación para un tab
 */
export interface TabPaginationState {
  page: number;
  page_size: number;
}
