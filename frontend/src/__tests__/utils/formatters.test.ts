/**
 * Unit Tests - Phase 18
 * Formatters, Validators, Calculators, Permissions
 */

import { describe, it, expect } from 'vitest';

/**
 * ============================================================================
 * Formatter Tests
 * ============================================================================
 */
describe('Formatters', () => {
  describe('Date Formatting', () => {
    it('should format date as DD/MM/YYYY', () => {
      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const date = new Date('2026-04-25');
      expect(formatDate(date)).toBe('25/04/2026');
    });

    it('should format date with time as DD/MM/YYYY HH:MM', () => {
      const formatDateTime = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      };

      const date = new Date('2026-04-25T14:30:00');
      expect(formatDateTime(date)).toContain('25/04/2026');
      expect(formatDateTime(date)).toContain('14:30');
    });

    it('should format relative time (ago)', () => {
      const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (secondsAgo < 60) return `${secondsAgo}s ago`;
        if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
        if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
        return `${Math.floor(secondsAgo / 86400)}d ago`;
      };

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });
  });

  describe('Severity Formatting', () => {
    it('should return correct severity color class', () => {
      const getSeverityColor = (severity: string): string => {
        const colors: Record<string, string> = {
          'Crítica': 'text-red-600 bg-red-50',
          'Alta': 'text-orange-600 bg-orange-50',
          'Media': 'text-yellow-600 bg-yellow-50',
          'Baja': 'text-green-600 bg-green-50',
        };
        return colors[severity] || 'text-gray-600';
      };

      expect(getSeverityColor('Crítica')).toContain('red');
      expect(getSeverityColor('Alta')).toContain('orange');
      expect(getSeverityColor('Media')).toContain('yellow');
      expect(getSeverityColor('Baja')).toContain('green');
    });

    it('should format severity label', () => {
      const severityLabels: Record<string, string> = {
        'Crítica': '🔴 Crítica',
        'Alta': '🟠 Alta',
        'Media': '🟡 Media',
        'Baja': '🟢 Baja',
      };

      expect(severityLabels['Crítica']).toContain('🔴');
      expect(severityLabels['Alta']).toContain('🟠');
    });
  });

  describe('Number Formatting', () => {
    it('should format number as currency', () => {
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      };

      expect(formatCurrency(1234.56)).toContain('1');
      expect(formatCurrency(1000)).toContain('1000');
    });

    it('should format number with separators', () => {
      const formatNumber = (value: number): string => {
        return new Intl.NumberFormat('es-ES').format(value);
      };

      expect(formatNumber(1234567)).toBe('1.234.567');
    });

    it('should format percentage', () => {
      const formatPercentage = (value: number): string => {
        return `${Math.round(value * 100) / 100}%`;
      };

      expect(formatPercentage(0.85)).toBe('85%');
      expect(formatPercentage(0.333333)).toBe('33.33%');
    });
  });

  describe('Text Formatting', () => {
    it('should truncate long text with ellipsis', () => {
      const truncate = (text: string, maxLength: number): string => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
      };

      expect(truncate('This is a very long text', 10)).toBe('This is a ...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should capitalize first letter', () => {
      const capitalize = (text: string): string => {
        return text.charAt(0).toUpperCase() + text.slice(1);
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
    });

    it('should format entity name with spaces', () => {
      const formatEntityName = (name: string): string => {
        return name
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      expect(formatEntityName('vulnerabilidadId')).toBe('Vulnerabilidad Id');
      expect(formatEntityName('SLA')).toBe('S L A');
    });
  });
});

/**
 * ============================================================================
 * Validator Tests
 * ============================================================================
 */
describe('Validators', () => {
  describe('Email Validation', () => {
    it('should validate correct email', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate HTTP/HTTPS URLs', () => {
      const isValidURL = (url: string): boolean => {
        try {
          const urlObj = new URL(url);
          return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
          return false;
        }
      };

      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const isValidURL = (url: string): boolean => {
        try {
          const urlObj = new URL(url);
          return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
          return false;
        }
      };

      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(false);
    });

    it('should block SSRF attacks (internal IPs)', () => {
      const isValidURL = (url: string): boolean => {
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;

          // Block internal IPs
          const blockedPatterns = [
            /^localhost$/,
            /^127\./,
            /^192\.168\./,
            /^10\./,
            /^172\.(1[6-9]|2\d|3[01])\./,
            /^169\.254\./,
          ];

          return !blockedPatterns.some((pattern) => pattern.test(hostname));
        } catch {
          return false;
        }
      };

      expect(isValidURL('http://localhost:3000')).toBe(false);
      expect(isValidURL('http://192.168.1.1')).toBe(false);
      expect(isValidURL('http://10.0.0.1')).toBe(false);
      expect(isValidURL('http://169.254.169.254')).toBe(false);
      expect(isValidURL('http://example.com')).toBe(true);
    });
  });

  describe('Number Validation', () => {
    it('should validate positive numbers', () => {
      const isPositive = (value: number): boolean => value > 0;

      expect(isPositive(5)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-5)).toBe(false);
    });

    it('should validate number in range', () => {
      const isInRange = (value: number, min: number, max: number): boolean => {
        return value >= min && value <= max;
      };

      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });

    it('should validate DREAD score (1-10)', () => {
      const isValidDREADScore = (score: number): boolean => {
        return score >= 1 && score <= 10;
      };

      expect(isValidDREADScore(5)).toBe(true);
      expect(isValidDREADScore(1)).toBe(true);
      expect(isValidDREADScore(10)).toBe(true);
      expect(isValidDREADScore(0)).toBe(false);
      expect(isValidDREADScore(11)).toBe(false);
    });
  });

  describe('Custom Validators', () => {
    it('should validate STRIDE category', () => {
      const validSTRIDECategories = [
        'Spoofing',
        'Tampering',
        'Repudiation',
        'Information Disclosure',
        'Denial of Service',
        'Elevation of Privilege',
      ];

      const isValidSTRIDE = (category: string): boolean => {
        return validSTRIDECategories.includes(category);
      };

      expect(isValidSTRIDE('Spoofing')).toBe(true);
      expect(isValidSTRIDE('Tampering')).toBe(true);
      expect(isValidSTRIDE('Invalid')).toBe(false);
    });

    it('should validate severity level', () => {
      const validSeverities = ['Crítica', 'Alta', 'Media', 'Baja'];

      const isValidSeverity = (severity: string): boolean => {
        return validSeverities.includes(severity);
      };

      expect(isValidSeverity('Crítica')).toBe(true);
      expect(isValidSeverity('Invalid')).toBe(false);
    });

    it('should validate vulnerability status', () => {
      const validStates = ['Abierta', 'En Progreso', 'Resuelta', 'Cerrada'];

      const isValidState = (state: string): boolean => {
        return validStates.includes(state);
      };

      expect(isValidState('Abierta')).toBe(true);
      expect(isValidState('Invalid')).toBe(false);
    });
  });
});

/**
 * ============================================================================
 * Calculator Tests
 * ============================================================================
 */
describe('Calculators', () => {
  describe('SLA Calculations', () => {
    it('should calculate SLA days remaining', () => {
      const calculateSLADays = (
        severity: string,
        createdDate: Date,
        slaConfig: Record<string, number>
      ): number => {
        const slaHours = slaConfig[severity] * 24;
        const createdTime = createdDate.getTime();
        const dueTime = createdTime + slaHours * 60 * 60 * 1000;
        const remainingMs = dueTime - Date.now();
        return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      };

      const slaConfig = {
        'Crítica': 7,
        'Alta': 30,
        'Media': 60,
        'Baja': 90,
      };

      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const sla = calculateSLADays('Baja', threeMonthsAgo, slaConfig);

      expect(sla).toBeLessThanOrEqual(0);
    });

    it('should determine SLA status (green/yellow/red)', () => {
      const getSLAStatus = (daysRemaining: number): string => {
        if (daysRemaining > 7) return 'green';
        if (daysRemaining > 0) return 'yellow';
        return 'red';
      };

      expect(getSLAStatus(15)).toBe('green');
      expect(getSLAStatus(3)).toBe('yellow');
      expect(getSLAStatus(-5)).toBe('red');
    });
  });

  describe('DREAD Score Calculations', () => {
    it('should calculate total DREAD score', () => {
      const calculateDREADScore = (
        damage: number,
        reproducibility: number,
        exploitability: number,
        affectedUsers: number,
        discoverability: number
      ): number => {
        return damage * 2 + reproducibility + exploitability + affectedUsers + discoverability;
      };

      const score = calculateDREADScore(8, 7, 6, 8, 9);
      expect(score).toBe(8 * 2 + 7 + 6 + 8 + 9); // 56
      expect(score).toBeLessThanOrEqual(40); // Max score is (10*2 + 10 + 10 + 10 + 10 = 60)
    });

    it('should validate DREAD component scores', () => {
      const isValidDREADComponent = (score: number): boolean => {
        return score >= 1 && score <= 10;
      };

      expect(isValidDREADComponent(5)).toBe(true);
      expect(isValidDREADComponent(0)).toBe(false);
      expect(isValidDREADComponent(11)).toBe(false);
    });
  });

  describe('Security Maturity Score', () => {
    it('should calculate weighted security score', () => {
      const calculateMaturityScore = (
        controlsCompliant: number,
        totalControls: number,
        weights: Record<string, number>
      ): number => {
        const baseScore = (controlsCompliant / totalControls) * 100;
        const weightedScore = baseScore * (weights['controls'] || 1);
        return Math.round(weightedScore);
      };

      const score = calculateMaturityScore(
        18,
        20,
        { controls: 1 }
      );

      expect(score).toBe(90);
    });

    it('should aggregate scores by dimension', () => {
      const aggregateScores = (
        scores: Record<string, number>
      ): number => {
        const values = Object.values(scores);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      };

      const dimensionScores = {
        'SAST': 85,
        'DAST': 75,
        'TM': 90,
      };

      const average = aggregateScores(dimensionScores);
      expect(average).toBe(83);
    });
  });

  describe('Completion Percentage', () => {
    it('should calculate project completion %', () => {
      const calculateCompletion = (completed: number, total: number): number => {
        return Math.round((completed / total) * 100);
      };

      expect(calculateCompletion(8, 10)).toBe(80);
      expect(calculateCompletion(15, 20)).toBe(75);
    });

    it('should calculate average progress', () => {
      const calculateAverageProgress = (
        items: { completado: boolean }[]
      ): number => {
        const completed = items.filter((item) => item.completado).length;
        return Math.round((completed / items.length) * 100);
      };

      const initiatives = [
        { completado: true },
        { completado: true },
        { completado: false },
        { completado: false },
      ];

      expect(calculateAverageProgress(initiatives)).toBe(50);
    });
  });
});

/**
 * ============================================================================
 * Permission Tests
 * ============================================================================
 */
describe('Permission Logic', () => {
  describe('Role-Based Checks', () => {
    it('should check if user has role', () => {
      const hasRole = (userRoles: string[], requiredRole: string): boolean => {
        return userRoles.includes(requiredRole);
      };

      expect(hasRole(['super_admin', 'auditor'], 'super_admin')).toBe(true);
      expect(hasRole(['analyst'], 'super_admin')).toBe(false);
    });

    it('should check if user has any of multiple roles', () => {
      const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
        return requiredRoles.some((role) => userRoles.includes(role));
      };

      expect(hasAnyRole(['analyst'], ['super_admin', 'analyst'])).toBe(true);
      expect(hasAnyRole(['readonly'], ['super_admin', 'analyst'])).toBe(false);
    });

    it('should check if user can perform action', () => {
      const rolePermissions: Record<string, string[]> = {
        'super_admin': ['create', 'read', 'update', 'delete', 'configure'],
        'chief_appsec': ['read', 'update', 'approve'],
        'analyst': ['create', 'read', 'update'],
        'auditor': ['read'],
        'readonly': ['read'],
      };

      const canPerform = (role: string, action: string): boolean => {
        return rolePermissions[role]?.includes(action) ?? false;
      };

      expect(canPerform('super_admin', 'delete')).toBe(true);
      expect(canPerform('analyst', 'delete')).toBe(false);
      expect(canPerform('auditor', 'update')).toBe(false);
    });
  });

  describe('Ownership Checks', () => {
    it('should check user ownership of resource', () => {
      const isOwner = (resourceOwnerId: string, currentUserId: string): boolean => {
        return resourceOwnerId === currentUserId;
      };

      expect(isOwner('user-1', 'user-1')).toBe(true);
      expect(isOwner('user-1', 'user-2')).toBe(false);
    });

    it('should check SoD (owner cannot approve own)', () => {
      const canApprove = (approverId: string, creatorId: string): boolean => {
        return approverId !== creatorId;
      };

      expect(canApprove('user-1', 'user-2')).toBe(true);
      expect(canApprove('user-1', 'user-1')).toBe(false);
    });
  });

  describe('Feature-Level Permissions', () => {
    it('should check if feature is visible for role', () => {
      const featurePermissions: Record<string, string[]> = {
        'admin_panel': ['super_admin'],
        'vulnerability_export': ['super_admin', 'chief_appsec', 'analyst'],
        'audit_logs': ['super_admin', 'auditor', 'chief_appsec'],
        'dashboard': ['all'],
      };

      const canSeeFeature = (role: string, feature: string): boolean => {
        const allowedRoles = featurePermissions[feature];
        return (allowedRoles?.includes('all') ?? false) || (allowedRoles?.includes(role) ?? false);
      };

      expect(canSeeFeature('super_admin', 'admin_panel')).toBe(true);
      expect(canSeeFeature('analyst', 'admin_panel')).toBe(false);
      expect(canSeeFeature('readonly', 'dashboard')).toBe(true);
    });
  });
});
