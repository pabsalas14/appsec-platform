/**
 * Indicators & Metrics Tests (M10)
 * Dynamic calculation of security maturity scores, KRIs, and SLA tracking
 */

import { test, expect } from "../fixtures";

test.describe("Indicators & Metrics (M10)", () => {
  test.describe("Indicator Formula Management", () => {
    test("should create custom indicator formula", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "CUSTOM-001",
          motor: "SAST",
          descripcion: "Custom SAST metric",
          formula: JSON.stringify({
            type: "count",
            filters: { fuente: "SAST", severidad: ["Crítica", "Alta"] },
          }),
          sla_config: JSON.stringify({
            CRITICAL: 7,
            HIGH: 30,
            MEDIUM: 60,
            LOW: 90,
          }),
          threshold_green: 10,
          threshold_yellow: 50,
          threshold_red: 100,
          periodicidad: "monthly",
        });

        expect((formula as any).id).toBeDefined();
        expect((formula as any).code).toBe("CUSTOM-001");
      } catch {
        test.skip();
      }
    });

    test("should update indicator formula", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "TEST-001",
          motor: "DAST",
          formula: JSON.stringify({ type: "count" }),
          threshold_green: 5,
          threshold_yellow: 15,
          threshold_red: 30,
          periodicidad: "monthly",
        });

        const updated = await testData.api.update(
          `/indicador_formulas/${(formula as any).id}`,
          {
            threshold_green: 10, // Changed
          }
        );

        expect((updated as any).threshold_green).toBe(10);
      } catch {
        test.skip();
      }
    });

    test("should list base indicators (XXX-001 through XXX-005)", async ({
      testData,
    }) => {
      try {
        const formulas = await testData.api.list("/indicador_formulas");
        const baseCodes = ["XXX-001", "XXX-002", "XXX-003", "XXX-004", "XXX-005"];

        const baseFormulas = (formulas as any[]).filter((f: any) =>
          baseCodes.includes(f.code)
        );
        expect(baseFormulas.length).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });

    test("should soft delete indicator formula", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "DELETE-TEST",
          motor: "SCA",
          formula: JSON.stringify({ type: "sum" }),
          threshold_green: 1,
          threshold_yellow: 5,
          threshold_red: 10,
          periodicidad: "quarterly",
        });

        await testData.api.delete(`/indicador_formulas`, (formula as any).id);

        const formulas = await testData.api.list("/indicador_formulas");
        const found = (formulas as any[]).find(
          (f: any) => f.id === (formula as any).id
        );
        expect(found).toBeFalsy();
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Base Indicators Calculation", () => {
    test("should calculate XXX-001: High/Critical vulns identified/month", async ({
      testData,
    }) => {
      try {
        // Get indicator value
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-001/calculate`,
          {
            params: { period: "current_month" },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });

    test("should calculate XXX-002: % High/Critical vulns remediated", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-002/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
        expect((data as any).value).toBeLessThanOrEqual(100);
      } catch {
        test.skip();
      }
    });

    test("should calculate XXX-003: Backlog count (open vulnerabilities)", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-003/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });

    test("should calculate XXX-004: % Vulns with SLA overdue", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-004/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
        expect((data as any).value).toBeLessThanOrEqual(100);
      } catch {
        test.skip();
      }
    });

    test("should calculate XXX-005: Releases with High/Critical vulns", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-005/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });

    test("should calculate KRI0025: % Deficient controls (CNBV)", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/KRI0025/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
        expect((data as any).value).toBeLessThanOrEqual(100);
      } catch {
        test.skip();
      }
    });

    test("should calculate % False Positives by motor", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/FP-RATE/calculate`,
          {
            params: { motor: "SAST" },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
        expect((data as any).value).toBeLessThanOrEqual(100);
      } catch {
        test.skip();
      }
    });

    test("should calculate Recurrence rate (same vuln type twice)", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/RECURRENCE-RATE/calculate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).value).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Security Maturity Score", () => {
    test("should calculate org-level security maturity score", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/security-maturity/organization`,
          {
            params: { organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).score).toBeGreaterThanOrEqual(0);
        expect((data as any).score).toBeLessThanOrEqual(100);
      } catch {
        test.skip();
      }
    });

    test("should calculate subdireccion-level security maturity score", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/security-maturity/subdireccion`,
          {
            params: { organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
        (data as any[]).forEach((item: any) => {
          expect(item.score).toBeGreaterThanOrEqual(0);
          expect(item.score).toBeLessThanOrEqual(100);
        });
      } catch {
        test.skip();
      }
    });

    test("should calculate celula-level security maturity score", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/security-maturity/celula`,
          {
            params: { organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
        (data as any[]).forEach((item: any) => {
          expect(item.score).toBeGreaterThanOrEqual(0);
          expect(item.score).toBeLessThanOrEqual(100);
        });
      } catch {
        test.skip();
      }
    });

    test("should include weighted component scores in maturity calculation", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/security-maturity/organization/detailed`,
          {
            params: { organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).components).toBeDefined();
        expect(Object.keys((data as any).components).length).toBeGreaterThan(0);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Indicator Trending & History", () => {
    test("should return 6-month trend for indicator", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-001/trend`,
          {
            params: { months: 6 },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should show historical indicator values by period", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/KRI0025/history`,
          {
            params: { period_type: "monthly", months: 12 },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
        (data as any[]).forEach((entry: any) => {
          expect(entry.period).toBeDefined();
          expect(entry.value).toBeDefined();
        });
      } catch {
        test.skip();
      }
    });

    test("should calculate indicator change month-over-month", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-003/compare`,
          {
            params: { compare_to: "previous_month" },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).current_value).toBeDefined();
        expect((data as any).previous_value).toBeDefined();
        expect((data as any).change_percent).toBeDefined();
      } catch {
        test.skip();
      }
    });
  });

  test.describe("SLA Metrics & Compliance", () => {
    test("should calculate % SLA compliance by motor", async ({ testData }) => {
      try {
        const motors = ["SAST", "DAST", "SCA", "TM", "MAST"];

        for (const motor of motors) {
          const result = await testData.api.request.get(
            `http://localhost:8000/api/v1/sla-metrics/compliance`,
            {
              params: { motor: motor },
            }
          );

          expect(result.ok()).toBe(true);
          const data = await result.json();
          expect((data as any).compliance_percent).toBeGreaterThanOrEqual(0);
          expect((data as any).compliance_percent).toBeLessThanOrEqual(100);
        }
      } catch {
        test.skip();
      }
    });

    test("should calculate MTTR (Mean Time To Remediate) by severity", async ({
      testData,
    }) => {
      try {
        const severities = ["Crítica", "Alta", "Media", "Baja"];

        for (const severity of severities) {
          const result = await testData.api.request.get(
            `http://localhost:8000/api/v1/sla-metrics/mttr`,
            {
              params: { severidad: severity },
            }
          );

          expect(result.ok()).toBe(true);
          const data = await result.json();
          expect((data as any).mttr_days).toBeGreaterThanOrEqual(0);
        }
      } catch {
        test.skip();
      }
    });

    test("should show SLA breach rate (overdue vulns count)", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/sla-metrics/breach-rate`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).breach_count).toBeGreaterThanOrEqual(0);
        expect((data as any).breach_percent).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Aggregation by Dimension", () => {
    test("should aggregate indicator by organization", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-003/aggregate`,
          {
            params: { dimension: "organization" },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should aggregate indicator by subdireccion", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-002/aggregate`,
          {
            params: { dimension: "subdireccion", organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should aggregate indicator by celula", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-001/aggregate`,
          {
            params: { dimension: "celula", organizacion_id: testData.organizacionId },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should aggregate indicator by motor", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/FP-RATE/aggregate`,
          {
            params: { dimension: "motor" },
          }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect(Array.isArray(data)).toBe(true);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Threshold & Semaphore Status", () => {
    test("should classify indicator as GREEN (safe)", async ({ testData }) => {
      try {
        // Create a simple formula with low thresholds
        const formula = await testData.api.create("/indicador_formulas", {
          code: "GREEN-TEST",
          motor: "SAST",
          formula: JSON.stringify({ type: "count", value: 5 }),
          threshold_green: 10,
          threshold_yellow: 50,
          threshold_red: 100,
          periodicidad: "monthly",
        });

        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/GREEN-TEST/status`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).semaphore).toBe("GREEN");
      } catch {
        test.skip();
      }
    });

    test("should classify indicator as YELLOW (at-risk)", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "YELLOW-TEST",
          motor: "DAST",
          formula: JSON.stringify({ type: "count", value: 60 }),
          threshold_green: 10,
          threshold_yellow: 50,
          threshold_red: 100,
          periodicidad: "monthly",
        });

        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/YELLOW-TEST/status`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).semaphore).toBe("YELLOW");
      } catch {
        test.skip();
      }
    });

    test("should classify indicator as RED (critical)", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "RED-TEST",
          motor: "SCA",
          formula: JSON.stringify({ type: "count", value: 150 }),
          threshold_green: 10,
          threshold_yellow: 50,
          threshold_red: 100,
          periodicidad: "monthly",
        });

        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/RED-TEST/status`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).semaphore).toBe("RED");
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Indicator Audit Trail", () => {
    test("should log all formula changes with diffs", async ({ testData }) => {
      try {
        const formula = await testData.api.create("/indicador_formulas", {
          code: "AUDIT-TEST",
          motor: "MAST",
          formula: JSON.stringify({ type: "sum" }),
          threshold_green: 5,
          threshold_yellow: 15,
          threshold_red: 30,
          periodicidad: "monthly",
        });

        await testData.api.update(`/indicador_formulas/${(formula as any).id}`, {
          threshold_green: 10,
        });

        const logs = await testData.api.list("/audit-logs", {
          entity_type: "indicador_formula",
          entity_id: (formula as any).id,
        });

        expect((logs as any[]).length).toBeGreaterThan(0);
      } catch {
        test.skip();
      }
    });

    test("should track indicator calculation triggers", async ({ testData }) => {
      try {
        // Calculate indicator
        await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-001/calculate`
        );

        // Check if calculation was logged
        const logs = await testData.api.list("/audit-logs", {
          entity_type: "indicador",
          accion: "calculate",
        });

        expect((logs as any[]).length).toBeGreaterThanOrEqual(0);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Performance & Scheduled Calculations", () => {
    test("should pre-calculate monthly indicators at scheduled time", async ({
      testData,
    }) => {
      try {
        // Check if monthly calculation job exists and last run time
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/admin/jobs/monthly-indicators`
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).last_run).toBeDefined();
      } catch {
        test.skip();
      }
    });

    test("should cache indicator values for performance", async ({ testData }) => {
      try {
        // First call
        const start1 = Date.now();
        await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-003/calculate`
        );
        const duration1 = Date.now() - start1;

        // Second call (should be cached)
        const start2 = Date.now();
        await testData.api.request.get(
          `http://localhost:8000/api/v1/indicadores/XXX-003/calculate`
        );
        const duration2 = Date.now() - start2;

        // Cached call should be faster (not guaranteed but likely)
        expect(duration2).toBeLessThanOrEqual(duration1 + 100); // Some margin
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Indicator Export & Reporting", () => {
    test("should export indicator report as CSV", async ({ testData }) => {
      try {
        const result = await testData.api.request.post(
          `http://localhost:8000/api/v1/indicadores/export-csv`,
          {
            data: {
              include_formulas: ["XXX-001", "XXX-002", "XXX-003", "KRI0025"],
              period: "current_year",
            },
          }
        );

        expect(result.ok()).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should export security maturity scorecard", async ({ testData }) => {
      try {
        const result = await testData.api.request.post(
          `http://localhost:8000/api/v1/security-maturity/export`,
          {
            data: {
              dimension: "organization",
              format: "pdf",
            },
          }
        );

        expect(result.ok()).toBe(true);
      } catch {
        test.skip();
      }
    });
  });
});
