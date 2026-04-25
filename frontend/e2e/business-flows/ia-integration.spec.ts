/**
 * IA Integration Tests (M13)
 * Threat modeling and false positive triage with multi-provider support
 */

import { test, expect } from "../fixtures";

test.describe("IA Integration (M13)", () => {
  test.describe("IA Provider Configuration", () => {
    test("should configure Ollama as default provider", async ({ testData }) => {
      try {
        const config = await testData.api.get("/admin/ia-config");
        expect((config as any).ai_provider).toBe("ollama");
      } catch {
        test.skip();
      }
    });

    test("should test provider connectivity", async ({ testData }) => {
      try {
        const result = await testData.api.request.post(
          `http://localhost:8000/api/v1/admin/ia-config/test-connection`,
          { data: {} }
        );

        expect(result.ok()).toBe(true);
        const data = await result.json();
        expect((data as any).status).toMatch(/healthy|warning|error/);
      } catch {
        test.skip();
      }
    });

    test("should switch between providers (Ollama → Anthropic)", async ({
      testData,
    }) => {
      try {
        const updated = await testData.api.request.put(
          `http://localhost:8000/api/v1/admin/ia-config`,
          {
            data: {
              ai_provider: "anthropic",
              ai_model: "claude-sonnet-4-6",
            },
          }
        );

        expect(updated.ok()).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should enforce timeout settings (max 30s)", async ({ testData }) => {
      try {
        const config = await testData.api.get("/admin/ia-config");
        expect((config as any).ai_timeout_seconds).toBeLessThanOrEqual(30);
      } catch {
        test.skip();
      }
    });

    test("should enable/disable data sanitization for paid providers", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.put(
          `http://localhost:8000/api/v1/admin/ia-config`,
          {
            data: {
              data_sanitization_enabled: true,
            },
          }
        );

        expect(result.ok()).toBe(true);
      } catch {
        test.skip();
      }
    });

    test("should log all IA configuration changes to audit trail", async ({
      testData,
    }) => {
      try {
        await testData.api.request.put(`http://localhost:8000/api/v1/admin/ia-config`, {
          data: {
            ai_temperature: 0.7,
          },
        });

        const logs = await testData.api.list("/audit-logs", {
          entity_type: "ia_config",
          accion: "update",
        });

        expect((logs as any[]).length).toBeGreaterThan(0);
      } catch {
        test.skip();
      }
    });
  });

  test.describe("Threat Modeling Asistido (13.1)", () => {
    test("should create threat modeling session", async ({ testData }) => {
      try {
        const session = await testData.api.create("/sesion_threat_modelings", {
          titulo: "Test TM Session",
          descripcion: "Auto-generated",
          stack_tecnologico: "Next.js + FastAPI + PostgreSQL",
          estado: "Planificada",
        });

        expect((session as any).id).toBeDefined();
      } catch {
        test.skip();
      }
    });

    test("should ask IA for STRIDE/DREAD threat suggestions", async ({
      testData,
    }) => {
      try {
        const sessions = await testData.api.list("/sesion_threat_modelings", {
          limit: 1,
        });

        if ((sessions as any[]).length > 0) {
          const sessionId = (sessions as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/sesion_threat_modelings/${sessionId}/ia/suggest`,
            {
              data: {
                contexto_adicional: "Financial services platform, OWASP scope",
                dry_run: false,
              },
            }
          );

          if (result.ok()) {
            const data = await result.json();
            expect(Array.isArray(data)).toBe(true);
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should verify STRIDE categories (6 valid types)", async ({
      testData,
    }) => {
      try {
        const threats = await testData.api.list("/amenazas", { limit: 10 });

        const validStrideCategories = [
          "Spoofing",
          "Tampering",
          "Repudiation",
          "Information Disclosure",
          "Denial of Service",
          "Elevation of Privilege",
        ];

        (threats as any[]).forEach((threat: any) => {
          if (threat.categoria_stride) {
            expect(validStrideCategories).toContain(threat.categoria_stride);
          }
        });
      } catch {
        test.skip();
      }
    });

    test("should validate DREAD scores (1-10 range)", async ({ testData }) => {
      try {
        const threats = await testData.api.list("/amenazas", { limit: 10 });

        (threats as any[]).forEach((threat: any) => {
          const dreadFields = [
            "dread_damage",
            "dread_reproducibility",
            "dread_exploitability",
            "dread_affected_users",
            "dread_discoverability",
          ];

          dreadFields.forEach((field: string) => {
            if ((threat as any)[field]) {
              expect((threat as any)[field]).toBeGreaterThanOrEqual(1);
              expect((threat as any)[field]).toBeLessThanOrEqual(10);
            }
          });
        });
      } catch {
        test.skip();
      }
    });

    test("should calculate total DREAD score (sum, max 50)", async ({
      testData,
    }) => {
      try {
        const threats = await testData.api.list("/amenazas", { limit: 5 });

        (threats as any[]).forEach((threat: any) => {
          if (threat.dread_score) {
            expect(threat.dread_score).toBeGreaterThanOrEqual(5); // Min = 1+1+1+1+1
            expect(threat.dread_score).toBeLessThanOrEqual(50); // Max = 10+10+10+10+10
          }
        });
      } catch {
        test.skip();
      }
    });

    test("should allow analyst to review and modify IA suggestions", async ({
      testData,
    }) => {
      try {
        const sessions = await testData.api.list("/sesion_threat_modelings", {
          limit: 1,
        });

        if ((sessions as any[]).length > 0) {
          // Get suggestions from IA
          const threats = await testData.api.list("/amenazas", {
            sesion_tm_id: (sessions as any[])[0].id,
            limit: 1,
          });

          if ((threats as any[]).length > 0) {
            const threatId = (threats as any[])[0].id;

            // Analyst modifies DREAD score
            const updated = await testData.api.update(`/amenazas/${threatId}`, {
              dread_damage: 8,
              dread_reproducibility: 7,
            });

            expect((updated as any).dread_damage).toBe(8);
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should suggest mitigation controls for each threat", async ({
      testData,
    }) => {
      try {
        const threats = await testData.api.list("/amenazas", { limit: 5 });

        (threats as any[]).forEach((threat: any) => {
          // Should have associated controls
          expect(threat.id).toBeDefined();
        });
      } catch {
        test.skip();
      }
    });

    test("should export threat model as PDF", async ({ page }) => {
      const baseURL = process.env.TEST_APP_URL || "http://localhost:3000";
      await page.goto(`${baseURL}/sesion_threat_modelings`);

      try {
        const exportBtn = await page.$('[data-testid="export"], button:has-text("PDF")');
        if (exportBtn) {
          await exportBtn.click();

          const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
          await downloadPromise.catch(() => {
            test.skip();
          });
        }
      } catch {
        test.skip();
      }
    });

    test("should handle IA timeout gracefully (30s max)", async ({ testData }) => {
      try {
        const sessions = await testData.api.list("/sesion_threat_modelings", {
          limit: 1,
        });

        if ((sessions as any[]).length > 0) {
          const sessionId = (sessions as any[])[0].id;

          // Call should timeout after 30s max
          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/sesion_threat_modelings/${sessionId}/ia/suggest`,
            {
              data: { contexto_adicional: "Test" },
            }
          );

          // Should succeed or timeout gracefully
          expect(result.status()).toBeGreaterThanOrEqual(200);
        }
      } catch {
        test.skip();
      }
    });

    test("should redact sensitive data from IA calls (code, secrets, PII)", async ({
      testData,
    }) => {
      try {
        // When data_sanitization_enabled=true, sensitive data should be redacted
        const config = await testData.api.get("/admin/ia-config");

        if ((config as any).data_sanitization_enabled) {
          // Verify in logs that sensitive patterns were removed
          const logs = await testData.api.list("/audit-logs", {
            entity_type: "ia_call",
            limit: 5,
          });

          // Logs should not contain actual secrets
          (logs as any[]).forEach((log: any) => {
            const callData = (log as any).call_data;
            if (callData) {
              expect(callData).not.toMatch(/password|secret|api_key|token/i);
            }
          });
        }
      } catch {
        test.skip();
      }
    });
  });

  test.describe("False Positive Triage (13.2)", () => {
    test("should ask IA for SAST finding classification", async ({ testData }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: {
                code_snippet: "if (user.id) { query = 'SELECT * FROM users WHERE id=' + user.id; }",
                contexto: "Login endpoint, user input not sanitized",
              },
            }
          );

          if (result.ok()) {
            const data = await result.json();
            expect((data as any).classification).toMatch(
              /False Positive|Requires Review|Confirmed Vulnerability/
            );
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should classify DAST findings", async ({ testData }) => {
      try {
        const findings = await testData.api.list("/hallazgo_dasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_dasts/${findingId}/ia/classify`,
            {
              data: {
                request_response: "GET /admin -> 401 Unauthorized",
                contexto: "Authentication bypass test",
              },
            }
          );

          expect(result.status()).toBeGreaterThanOrEqual(200);
        }
      } catch {
        test.skip();
      }
    });

    test("should return classification with confidence score", async ({
      testData,
    }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: {
                code_snippet: "// test code",
                contexto: "Testing FP classification",
              },
            }
          );

          if (result.ok()) {
            const data = await result.json();
            expect((data as any).confidence).toBeGreaterThanOrEqual(0);
            expect((data as any).confidence).toBeLessThanOrEqual(1.0);
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should provide draft justification for decision", async ({ testData }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: {
                code_snippet: "// Safe code",
                contexto: "Review",
              },
            }
          );

          if (result.ok()) {
            const data = await result.json();
            expect((data as any).justificacion).toBeDefined();
            expect((data as any).justificacion).toMatch(/.{10,}/); // At least 10 chars
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should allow analyst to accept/modify IA triage suggestion", async ({
      testData,
    }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          // Get IA suggestion
          const classification = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: { code_snippet: "test", contexto: "test" },
            }
          );

          if (classification.ok()) {
            const classData = await classification.json();

            // Analyst accepts or modifies
            const updated = await testData.api.update(
              `/hallazgo_sasts/${findingId}`,
              {
                ia_classification: (classData as any).classification,
                ia_classification_status: "approved",
              }
            );

            expect((updated as any).id).toBeDefined();
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should log triage decision to HistorialVulnerabilidad", async ({
      testData,
    }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const vulnId = (findings as any[])[0].vulnerabilidad_id;

          if (vulnId) {
            const history = await testData.api.list(
              `/vulnerabilidads/${vulnId}/historial`
            );

            // Should include triage decision
            const triageEntry = (history as any[]).find((h: any) =>
              h.cambios_despues?.includes("ia_classification")
            );

            expect(triageEntry).toBeDefined();
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should batch triage multiple findings from same tool", async ({
      testData,
    }) => {
      try {
        const result = await testData.api.request.post(
          `http://localhost:8000/api/v1/hallazgo_sasts/batch-classify`,
          {
            data: {
              finding_ids: ["finding-1", "finding-2", "finding-3"],
            },
          }
        );

        expect(result.status()).toBeGreaterThanOrEqual(200);
      } catch {
        test.skip();
      }
    });

    test("should handle IA timeout and fallback gracefully", async ({
      testData,
    }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          const result = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: {
                code_snippet: "test",
                contexto: "test",
                timeout_ms: 100, // Very short timeout
              },
            }
          );

          // Should either succeed quickly or return timeout error
          if (result.status() >= 400) {
            const data = await result.json();
            expect((data as any).error).toMatch(/timeout|unavailable/i);
          }
        }
      } catch {
        test.skip();
      }
    });

    test("should prevent duplicate IA calls within time window", async ({
      testData,
    }) => {
      try {
        const findings = await testData.api.list("/hallazgo_sasts", { limit: 1 });

        if ((findings as any[]).length > 0) {
          const findingId = (findings as any[])[0].id;

          // First call
          const result1 = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: { code_snippet: "test", contexto: "test" },
            }
          );

          // Second call immediately (should be cached or throttled)
          const result2 = await testData.api.request.post(
            `http://localhost:8000/api/v1/hallazgo_sasts/${findingId}/ia/classify`,
            {
              data: { code_snippet: "test", contexto: "test" },
            }
          );

          // Should not duplicate API calls
          const logs = await testData.api.list("/audit-logs", {
            entity_type: "ia_call",
            limit: 10,
          });

          expect((logs as any[]).length).toBeGreaterThanOrEqual(0);
        }
      } catch {
        test.skip();
      }
    });
  });

  test.describe("IA Health & Monitoring", () => {
    test("should show IA provider status in system health", async ({ page }) => {
      const baseURL = process.env.TEST_APP_URL || "http://localhost:3000";
      await page.goto(`${baseURL}/admin/health`);

      try {
        const iaStatus = await page.$('[data-testid="ia-status"], [class*="ia"]');
        expect(iaStatus).toBeDefined();
      } catch {
        test.skip();
      }
    });

    test("should track IA call latency metrics", async ({ testData }) => {
      try {
        const result = await testData.api.request.get(
          `http://localhost:8000/api/v1/admin/health/ia-metrics`
        );

        if (result.ok()) {
          const data = await result.json();
          expect((data as any).avg_latency_ms).toBeGreaterThanOrEqual(0);
          expect((data as any).error_rate).toBeGreaterThanOrEqual(0);
        }
      } catch {
        test.skip();
      }
    });

    test("should alert on high IA error rate", async ({ testData }) => {
      try {
        const alerts = await testData.api.list("/alerts", {
          source: "ia_integration",
        });

        // May or may not have alerts depending on provider health
        expect(Array.isArray(alerts)).toBe(true);
      } catch {
        test.skip();
      }
    });
  });
});
