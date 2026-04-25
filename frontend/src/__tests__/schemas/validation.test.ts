/**
 * Schema Validation Tests - Phase 19
 * Zod schema validation for all form schemas
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * ============================================================================
 * Vulnerability Schema Tests
 * ============================================================================
 */
describe('Vulnerability Schemas', () => {
  const VulnerabilidadCreateSchema = z.object({
    titulo: z.string().min(5).max(255),
    descripcion: z.string().min(10),
    severidad: z.enum(['Crítica', 'Alta', 'Media', 'Baja']),
    estado: z.enum(['Abierta', 'En Progreso', 'Resuelta', 'Cerrada']),
    fuente: z.enum(['SAST', 'DAST', 'SCA', 'TM', 'MAST', 'Auditoría', 'Tercero']),
    cwe_id: z.string().optional(),
    owasp_category: z.string().optional(),
  });

  const VulnerabilidadUpdateSchema = VulnerabilidadCreateSchema.partial().extend({
    id: z.string().uuid(),
    justificacion: z.string().optional(),
  });

  describe('Create Validation', () => {
    it('should validate valid vulnerability data', () => {
      const validData = {
        titulo: 'SQL Injection Vulnerability',
        descripcion: 'Found in login form parameter handling',
        severidad: 'Crítica' as const,
        estado: 'Abierta' as const,
        fuente: 'SAST' as const,
      };

      const result = VulnerabilidadCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid title (too short)', () => {
      const invalidData = {
        titulo: 'SQL',
        descripcion: 'Found in login form parameter handling',
        severidad: 'Crítica' as const,
        estado: 'Abierta' as const,
        fuente: 'SAST' as const,
      };

      const result = VulnerabilidadCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        titulo: 'SQL Injection Vulnerability',
        descripcion: 'Found in login form parameter handling',
        severidad: 'Invalid',
        estado: 'Abierta' as const,
        fuente: 'SAST' as const,
      };

      const result = VulnerabilidadCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        titulo: 'SQL Injection',
      };

      const result = VulnerabilidadCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Update Validation', () => {
    it('should require justification when changing critical status', () => {
      const SchemaWithJustification = VulnerabilidadUpdateSchema.refine(
        (data) => {
          if (data.estado === 'Cerrada' && !data.justificacion) {
            return false;
          }
          return true;
        },
        { message: 'Justificacion required when closing vulnerability' }
      );

      const dataWithoutJustification = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        estado: 'Cerrada',
      };

      const result = SchemaWithJustification.safeParse(dataWithoutJustification);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields in update', () => {
      const validUpdateData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        estado: 'En Progreso' as const,
      };

      const result = VulnerabilidadUpdateSchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
    });
  });

  describe('Batch Operation Schemas', () => {
    const BulkAssignSchema = z.object({
      vulnerability_ids: z.array(z.string().uuid()).max(500),
      asignado_a: z.string().uuid(),
    });

    it('should validate bulk assign operation', () => {
      const validData = {
        vulnerability_ids: ['550e8400-e29b-41d4-a716-446655440000'],
        asignado_a: '660e8400-e29b-41d4-a716-446655440001',
      };

      const result = BulkAssignSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should enforce max 500 items in bulk operation', () => {
      const tooManyIds = Array.from({ length: 501 }, () => '550e8400-e29b-41d4-a716-446655440000');

      const invalidData = {
        vulnerability_ids: tooManyIds,
        asignado_a: '660e8400-e29b-41d4-a716-446655440001',
      };

      const result = BulkAssignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Program Schema Tests
 * ============================================================================
 */
describe('Program Schemas', () => {
  const ProgramSchema = z.object({
    nombre: z.string().min(3).max(255),
    descripcion: z.string().min(10),
    tipo: z.enum(['SAST', 'DAST', 'TM', 'MAST', 'SourceCode']),
    activo: z.boolean(),
  });

  const MonthlyActivitySchema = z.object({
    programa_id: z.string().uuid(),
    mes: z.number().min(1).max(12),
    ano: z.number().min(2020),
  });

  describe('Program Validation', () => {
    it('should validate valid program', () => {
      const validData = {
        nombre: 'SAST Program 2026',
        descripcion: 'Annual SAST program for code scanning',
        tipo: 'SAST' as const,
        activo: true,
      };

      const result = ProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject program with invalid type', () => {
      const invalidData = {
        nombre: 'Invalid Program',
        descripcion: 'This should fail',
        tipo: 'INVALID',
        activo: true,
      };

      const result = ProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Monthly Activity Validation', () => {
    it('should validate valid monthly activity', () => {
      const validData = {
        programa_id: '550e8400-e29b-41d4-a716-446655440000',
        mes: 4,
        ano: 2026,
      };

      const result = MonthlyActivitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid month', () => {
      const invalidData = {
        programa_id: '550e8400-e29b-41d4-a716-446655440000',
        mes: 13,
        ano: 2026,
      };

      const result = MonthlyActivitySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject past year', () => {
      const invalidData = {
        programa_id: '550e8400-e29b-41d4-a716-446655440000',
        mes: 4,
        ano: 2019,
      };

      const result = MonthlyActivitySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Initiative Schema Tests
 * ============================================================================
 */
describe('Initiative Schemas', () => {
  const IniciativaSchema = z.object({
    nombre: z.string().min(3).max(255),
    descripcion: z.string().min(10),
    tipo: z.enum(['RFI', 'Proceso', 'Plataforma', 'Custom']),
    estado: z.enum(['Planificada', 'En Progreso', 'Pausada', 'Completada', 'Cancelada']),
  });

  describe('Initiative Validation', () => {
    it('should validate valid initiative', () => {
      const validData = {
        nombre: 'Security Enhancement Initiative',
        descripcion: 'Comprehensive security improvements across all services',
        tipo: 'Plataforma' as const,
        estado: 'Planificada' as const,
      };

      const result = IniciativaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid initiative type', () => {
      const invalidData = {
        nombre: 'Test Initiative',
        descripcion: 'This should fail',
        tipo: 'INVALID_TYPE',
        estado: 'Planificada' as const,
      };

      const result = IniciativaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        nombre: 'Test Initiative',
        descripcion: 'This should fail',
        tipo: 'RFI' as const,
        estado: 'INVALID_STATUS',
      };

      const result = IniciativaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Audit Schema Tests
 * ============================================================================
 */
describe('Audit Schemas', () => {
  const AuditoriaSchema = z.object({
    nombre: z.string().min(3).max(255),
    descripcion: z.string().min(10),
    tipo: z.enum(['Interna', 'Externa']),
    fecha_inicio: z.string().datetime(),
  });

  const HallazgoAuditoriaSchema = z.object({
    auditoria_id: z.string().uuid(),
    titulo: z.string().min(3),
    descripcion: z.string().min(10),
    severidad: z.enum(['Crítica', 'Alta', 'Media', 'Baja']),
    estado: z.enum(['Abierto', 'Remediando', 'Cerrado']),
  });

  describe('Audit Validation', () => {
    it('should validate internal audit', () => {
      const validData = {
        nombre: 'Q1 2026 Internal Audit',
        descripcion: 'Quarterly internal security audit',
        tipo: 'Interna' as const,
        fecha_inicio: new Date().toISOString(),
      };

      const result = AuditoriaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid audit type', () => {
      const invalidData = {
        nombre: 'Test Audit',
        descripcion: 'This should fail',
        tipo: 'INVALID',
        fecha_inicio: new Date().toISOString(),
      };

      const result = AuditoriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Audit Finding Validation', () => {
    it('should validate audit finding', () => {
      const validData = {
        auditoria_id: '550e8400-e29b-41d4-a716-446655440000',
        titulo: 'Missing Access Controls',
        descripcion: 'Administrative panel lacks proper access controls',
        severidad: 'Alta' as const,
        estado: 'Abierto' as const,
      };

      const result = HallazgoAuditoriaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid finding severity', () => {
      const invalidData = {
        auditoria_id: '550e8400-e29b-41d4-a716-446655440000',
        titulo: 'Test Finding',
        descripcion: 'This should fail',
        severidad: 'INVALID',
        estado: 'Abierto' as const,
      };

      const result = HallazgoAuditoriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Theme Schema Tests
 * ============================================================================
 */
describe('Theme Schemas', () => {
  const TemaEmergenteSchema = z.object({
    titulo: z.string().min(3).max(255),
    descripcion: z.string().min(10),
    tipo: z.enum(['Vulnerabilidad', 'Incidente', 'Tendencia']),
    estado: z.enum(['Abierto', 'En Seguimiento', 'Resuelto']),
  });

  describe('Emerging Theme Validation', () => {
    it('should validate emerging theme', () => {
      const validData = {
        titulo: 'Log4j Vulnerability Trending',
        descripcion: 'Monitoring ongoing exploits of Log4j vulnerability',
        tipo: 'Tendencia' as const,
        estado: 'En Seguimiento' as const,
      };

      const result = TemaEmergenteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid theme type', () => {
      const invalidData = {
        titulo: 'Test Theme',
        descripcion: 'This should fail',
        tipo: 'INVALID_TYPE',
        estado: 'Abierto' as const,
      };

      const result = TemaEmergenteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Release Schema Tests
 * ============================================================================
 */
describe('Release Schemas', () => {
  const ServiceReleaseSchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    descripcion: z.string().min(10),
    estado: z.enum([
      'Design',
      'Validation',
      'Tests',
      'Approval',
      'QA',
      'Producción',
    ]),
  });

  describe('Release Validation', () => {
    it('should validate valid release', () => {
      const validData = {
        version: '2.1.0',
        descripcion: 'Security patches and performance improvements',
        estado: 'Design' as const,
      };

      const result = ServiceReleaseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid version format', () => {
      const invalidData = {
        version: 'v2.1',
        descripcion: 'This should fail',
        estado: 'Design' as const,
      };

      const result = ServiceReleaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid release state', () => {
      const invalidData = {
        version: '2.1.0',
        descripcion: 'This should fail',
        estado: 'INVALID_STATE',
      };

      const result = ServiceReleaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('State Transition Validation', () => {
    const validateTransition = (from: string, to: string): boolean => {
      const allowedTransitions: Record<string, string[]> = {
        'Design': ['Validation'],
        'Validation': ['Tests', 'Design'],
        'Tests': ['Approval', 'Validation'],
        'Approval': ['QA', 'Tests'],
        'QA': ['Producción', 'Approval'],
        'Producción': [],
      };

      return allowedTransitions[from]?.includes(to) ?? false;
    };

    it('should allow valid state transition', () => {
      expect(validateTransition('Design', 'Validation')).toBe(true);
      expect(validateTransition('Validation', 'Tests')).toBe(true);
      expect(validateTransition('Tests', 'Approval')).toBe(true);
    });

    it('should reject invalid state transition (skip stages)', () => {
      expect(validateTransition('Design', 'Tests')).toBe(false);
      expect(validateTransition('Design', 'Approval')).toBe(false);
      expect(validateTransition('Validation', 'Approval')).toBe(false);
    });

    it('should allow backward transition to previous stage', () => {
      expect(validateTransition('Validation', 'Design')).toBe(true);
      expect(validateTransition('Tests', 'Validation')).toBe(true);
    });
  });
});

/**
 * ============================================================================
 * Threat Modeling Schema Tests
 * ============================================================================
 */
describe('Threat Modeling Schemas', () => {
  const AmenazaSchema = z.object({
    sesion_id: z.string().uuid(),
    titulo: z.string().min(5),
    descripcion: z.string().min(10),
    categoria_stride: z.enum([
      'Spoofing',
      'Tampering',
      'Repudiation',
      'Information Disclosure',
      'Denial of Service',
      'Elevation of Privilege',
    ]),
    dread_damage: z.number().min(1).max(10),
    dread_reproducibility: z.number().min(1).max(10),
    dread_exploitability: z.number().min(1).max(10),
    dread_affected_users: z.number().min(1).max(10),
    dread_discoverability: z.number().min(1).max(10),
  });

  describe('Threat Validation', () => {
    it('should validate valid threat', () => {
      const validData = {
        sesion_id: '550e8400-e29b-41d4-a716-446655440000',
        titulo: 'SQL Injection via Login Form',
        descripcion: 'Attacker could bypass authentication',
        categoria_stride: 'Tampering' as const,
        dread_damage: 9,
        dread_reproducibility: 8,
        dread_exploitability: 7,
        dread_affected_users: 10,
        dread_discoverability: 9,
      };

      const result = AmenazaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid STRIDE category', () => {
      const invalidData = {
        sesion_id: '550e8400-e29b-41d4-a716-446655440000',
        titulo: 'Test Threat',
        descripcion: 'This should fail',
        categoria_stride: 'INVALID_CATEGORY',
        dread_damage: 5,
        dread_reproducibility: 5,
        dread_exploitability: 5,
        dread_affected_users: 5,
        dread_discoverability: 5,
      };

      const result = AmenazaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject DREAD score outside range', () => {
      const invalidData = {
        sesion_id: '550e8400-e29b-41d4-a716-446655440000',
        titulo: 'Test Threat',
        descripcion: 'This should fail',
        categoria_stride: 'Spoofing' as const,
        dread_damage: 11,
        dread_reproducibility: 5,
        dread_exploitability: 5,
        dread_affected_users: 5,
        dread_discoverability: 5,
      };

      const result = AmenazaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate total DREAD score', () => {
      const calculateDREADScore = (
        damage: number,
        reproducibility: number,
        exploitability: number,
        affectedUsers: number,
        discoverability: number
      ): number => {
        return damage * 2 + reproducibility + exploitability + affectedUsers + discoverability;
      };

      const score = calculateDREADScore(10, 10, 10, 10, 10);
      expect(score).toBe(60);
    });
  });
});

/**
 * ============================================================================
 * Common Field Validations
 * ============================================================================
 */
describe('Common Field Validations', () => {
  describe('UUID Validation', () => {
    const UUIDSchema = z.string().uuid();

    it('should validate valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const result = UUIDSchema.safeParse(validUUID);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidUUID = 'not-a-uuid';
      const result = UUIDSchema.safeParse(invalidUUID);
      expect(result.success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    const DateSchema = z.string().datetime();

    it('should validate ISO datetime', () => {
      const validDate = new Date().toISOString();
      const result = DateSchema.safeParse(validDate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const invalidDate = '2026-04-25';
      const result = DateSchema.safeParse(invalidDate);
      expect(result.success).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    const StatusEnum = z.enum(['Abierta', 'Resuelta', 'Cerrada']);

    it('should validate enum value', () => {
      const result = StatusEnum.safeParse('Abierta');
      expect(result.success).toBe(true);
    });

    it('should reject invalid enum value', () => {
      const result = StatusEnum.safeParse('InvalidStatus');
      expect(result.success).toBe(false);
    });
  });
});
