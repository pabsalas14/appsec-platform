/**
 * Test Data API Helper
 * Provides utilities for managing test data via backend endpoints
 */

import { APIRequestContext } from "@playwright/test";

interface TestDataResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface OrganizationFixture {
  organizacion_id: string;
  vulnerabilities_created: number;
  status: string;
}

interface TestDataStatus {
  organizaciones: number;
  vulnerabilidades: number;
  programas_sast: number;
  audit_logs: number;
}

export class TestDataAPI {
  private request: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(request: APIRequestContext, baseURL: string, authToken?: string) {
    this.request = request;
    this.baseURL = baseURL.replace(/\/$/, ""); // Remove trailing slash
    this.authToken = authToken;
  }

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Seed comprehensive test data
   * Creates org, users, vulnerabilities, programs, releases, etc.
   */
  async seedTestData(): Promise<OrganizationFixture> {
    const response = await this.request.post(
      `${this.baseURL}/api/v1/admin/test-data/seed`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to seed test data: ${response.status()} ${response.statusText()}`);
    }

    const body = (await response.json()) as TestDataResponse<OrganizationFixture>;
    if (!body.data) {
      throw new Error("No data returned from seed endpoint");
    }

    return body.data;
  }

  /**
   * Get current test data status
   */
  async getTestDataStatus(): Promise<TestDataStatus> {
    const response = await this.request.get(`${this.baseURL}/api/v1/admin/test-data/status`, {
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to get test data status: ${response.status()}`);
    }

    const body = (await response.json()) as TestDataResponse<TestDataStatus>;
    if (!body.data) {
      throw new Error("No status data returned");
    }

    return body.data;
  }

  /**
   * Reset all test data (soft delete)
   */
  async resetTestData(): Promise<void> {
    const response = await this.request.post(
      `${this.baseURL}/api/v1/admin/test-data/reset`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to reset test data: ${response.status()}`);
    }
  }

  /**
   * Reset and reload test data
   */
  async reloadTestData(): Promise<OrganizationFixture> {
    const response = await this.request.post(
      `${this.baseURL}/api/v1/admin/test-data/reload`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to reload test data: ${response.status()}`);
    }

    const body = (await response.json()) as TestDataResponse<OrganizationFixture>;
    if (!body.data) {
      throw new Error("No data returned from reload endpoint");
    }

    return body.data;
  }

  // ============================================================
  // Generic CRUD helpers for common entities
  // ============================================================

  /**
   * Create an entity via API
   */
  async create<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    const response = await this.request.post(`${this.baseURL}/api/v1${endpoint}`, {
      data,
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create ${endpoint}: ${response.status()} - ${error}`);
    }

    const body = (await response.json()) as TestDataResponse<T>;
    if (!body.data) {
      throw new Error(`No data returned from ${endpoint}`);
    }

    return body.data;
  }

  /**
   * Update an entity via API
   */
  async update<T>(endpoint: string, id: string, data: Record<string, unknown>): Promise<T> {
    const response = await this.request.patch(`${this.baseURL}/api/v1${endpoint}/${id}`, {
      data,
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to update ${endpoint}/${id}: ${response.status()}`);
    }

    const body = (await response.json()) as TestDataResponse<T>;
    if (!body.data) {
      throw new Error(`No data returned from ${endpoint}/${id}`);
    }

    return body.data;
  }

  /**
   * Get an entity via API
   */
  async get<T>(endpoint: string, id: string): Promise<T> {
    const response = await this.request.get(`${this.baseURL}/api/v1${endpoint}/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to get ${endpoint}/${id}: ${response.status()}`);
    }

    const body = (await response.json()) as TestDataResponse<T>;
    if (!body.data) {
      throw new Error(`No data returned from ${endpoint}/${id}`);
    }

    return body.data;
  }

  /**
   * List entities via API
   */
  async list<T>(endpoint: string, params?: Record<string, unknown>): Promise<T[]> {
    const url = new URL(`${this.baseURL}/api/v1${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await this.request.get(url.toString(), {
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to list ${endpoint}: ${response.status()}`);
    }

    const body = (await response.json()) as { data: T[] | unknown };
    if (!Array.isArray(body.data)) {
      throw new Error(`Invalid response format from ${endpoint}`);
    }

    return body.data as T[];
  }

  /**
   * Delete an entity via API
   */
  async delete(endpoint: string, id: string): Promise<void> {
    const response = await this.request.delete(`${this.baseURL}/api/v1${endpoint}/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to delete ${endpoint}/${id}: ${response.status()}`);
    }
  }

  // ============================================================
  // Convenience methods for common entities
  // ============================================================

  async createVulnerabilidad(data: Record<string, unknown>) {
    return this.create("/vulnerabilidads", data);
  }

  async updateVulnerabilidad(id: string, data: Record<string, unknown>) {
    return this.update("/vulnerabilidads", id, data);
  }

  async getVulnerabilidad(id: string) {
    return this.get("/vulnerabilidads", id);
  }

  async listVulnerabilidades(params?: Record<string, unknown>) {
    return this.list("/vulnerabilidads", params);
  }

  async deleteVulnerabilidad(id: string) {
    return this.delete("/vulnerabilidads", id);
  }

  async createProgramaSAST(data: Record<string, unknown>) {
    return this.create("/programa_sasts", data);
  }

  async createServiceRelease(data: Record<string, unknown>) {
    return this.create("/service_releases", data);
  }

  async updateServiceRelease(id: string, data: Record<string, unknown>) {
    return this.update("/service_releases", id, data);
  }

  async createAmenaza(data: Record<string, unknown>) {
    return this.create("/amenazas", data);
  }

  async createAuditoria(data: Record<string, unknown>) {
    return this.create("/auditorias", data);
  }

  async createIniciativa(data: Record<string, unknown>) {
    return this.create("/iniciativas", data);
  }

  // ============================================================
  // Bulk operations
  // ============================================================

  /**
   * Create multiple vulnerabilities
   */
  async bulkCreateVulnerabilities(
    count: number,
    overrides?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>> {
    const results = [];

    for (let i = 0; i < count; i++) {
      const data = {
        titulo: `Bulk Test Vuln #${i + 1}`,
        descripcion: "Auto-generated test vulnerability",
        fuente: i % 2 === 0 ? "SAST" : "DAST",
        severidad: ["Crítica", "Alta", "Media", "Baja"][i % 4],
        estado: "Abierta",
        ...overrides,
      };

      try {
        const vuln = await this.createVulnerabilidad(data);
        results.push(vuln);
      } catch (error) {
        console.error(`Failed to create vulnerability ${i + 1}:`, error);
      }
    }

    return results;
  }

  /**
   * Create multiple programs
   */
  async bulkCreatePrograms(
    count: number,
    type: "SAST" | "DAST" | "TM" | "MAST" = "SAST",
    overrides?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>> {
    const results = [];

    for (let i = 0; i < count; i++) {
      const data = {
        nombre: `Bulk Test ${type} #${i + 1}`,
        descripcion: `Auto-generated test program`,
        tipo: type,
        activo: true,
        ...overrides,
      };

      try {
        const prog = await this.createProgramaSAST(data);
        results.push(prog);
      } catch (error) {
        console.error(`Failed to create program ${i + 1}:`, error);
      }
    }

    return results;
  }

  // ============================================================
  // Cleanup utilities
  // ============================================================

  /**
   * Delete all vulnerabilities (for cleanup after tests)
   */
  async deleteAllVulnerabilities(): Promise<void> {
    try {
      const vulns = await this.listVulnerabilidades();
      for (const vuln of vulns) {
        const id = (vuln as Record<string, string>).id;
        await this.deleteVulnerabilidad(id);
      }
    } catch (error) {
      console.warn("Failed to delete all vulnerabilities:", error);
    }
  }

  /**
   * Get total count of vulnerabilities
   */
  async getVulnerabilidadCount(): Promise<number> {
    const status = await this.getTestDataStatus();
    return status.vulnerabilidades;
  }
}
