/**
 * Formula Engine Tests — Fase 1 Frontend
 */

import { describe, it, expect } from "vitest";
import { FormulaEngine, type FormulaContext } from "@/utils/formula-engine";

describe("FormulaEngine", () => {
  describe("Validation", () => {
    it("should validate empty formula", () => {
      const result = FormulaEngine.validate("");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Formula cannot be empty");
    });

    it("should detect unbalanced parentheses", () => {
      const result = FormulaEngine.validate("IF(1 > 0, 'yes', 'no'");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unbalanced"))).toBe(true);
    });

    it("should reject semicolons", () => {
      const result = FormulaEngine.validate("IF(1 > 0; 'yes'; 'no')");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Semicolons"))).toBe(true);
    });

    it("should reject curly braces", () => {
      const result = FormulaEngine.validate("IF(1 > 0) { return 'yes'; }");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Curly braces"))).toBe(true);
    });

    it("should reject unknown functions", () => {
      const result = FormulaEngine.validate("unknown_func()");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown function"))).toBe(true);
    });

    it("should warn about deeply nested formulas", () => {
      const result = FormulaEngine.validate("IF(IF(IF(IF(1, 2, 3), 4, 5), 6, 7), 8, 9)");

      expect(result.warnings && result.warnings.length > 0).toBe(true);
      expect(result.warnings?.some((w) => w.includes("deep nesting"))).toBe(true);
    });

    it("should validate correct formula", () => {
      const result = FormulaEngine.validate("IF(percentage(10, 100) > 5, round(days_until(2026-12-31), 2), 0)");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Evaluation", () => {
    it("should reject invalid formulas", () => {
      const result = FormulaEngine.evaluate("invalid syntax <<<", {});

      expect(result.error).toBeDefined();
      expect(result.result).toBeNull();
    });

    it("should evaluate days_between", () => {
      const result = FormulaEngine.evaluate('days_between("2026-01-01", "2026-01-10")', {});

      expect(result.error).toBeUndefined();
      expect(typeof result.result).toBe("number");
    });

    it("should evaluate days_until", () => {
      // This will return negative since the date is in the past from current time
      const result = FormulaEngine.evaluate('days_until("2026-12-31")', {});

      expect(result.error).toBeUndefined();
      expect(typeof result.result).toBe("number");
    });

    it("should evaluate IF expressions", () => {
      const result = FormulaEngine.evaluate("IF(1 > 0, 100, 50)", {});

      expect(result.result).toBe(100);
    });

    it("should evaluate percentage calculation", () => {
      const result = FormulaEngine.evaluate("percentage(25, 100)", {});

      expect(result.result).toBe(25);
    });

    it("should evaluate round function", () => {
      const result = FormulaEngine.evaluate("round(3.14159, 2)", {});

      expect(result.result).toBe(3.14);
    });

    it("should evaluate count function", () => {
      const result = FormulaEngine.evaluate("count([1,2,3,4,5])", {});

      expect(result.result).toBe(5);
    });

    it("should evaluate sum function", () => {
      const result = FormulaEngine.evaluate("sum([1,2,3,4,5])", {});

      expect(result.result).toBe(15);
    });

    it("should evaluate avg function", () => {
      const result = FormulaEngine.evaluate("avg([10,20,30])", {});

      expect(result.result).toBe(20);
    });

    it("should evaluate uppercase function", () => {
      const result = FormulaEngine.evaluate('uppercase("hello")', {});

      expect(result.result).toBe("HELLO");
    });

    it("should evaluate lowercase function", () => {
      const result = FormulaEngine.evaluate('lowercase("HELLO")', {});

      expect(result.result).toBe("hello");
    });

    it("should evaluate concatenate function", () => {
      const result = FormulaEngine.evaluate('concatenate("Hello", " World")', {});

      expect(result.result).toBe("Hello World");
    });
  });

  describe("Context Variables", () => {
    it("should replace context variables in formula", () => {
      const context: FormulaContext = {
        days_open: 5,
        threshold: 7,
      };

      const result = FormulaEngine.evaluate("IF(days_open > threshold, 1, 0)", context);

      expect(result.error).toBeUndefined();
      expect(result.result).toBe(0); // 5 > 7 is false
    });

    it("should handle string context variables", () => {
      const context: FormulaContext = {
        name: "John",
      };

      const result = FormulaEngine.evaluate('uppercase(name)', context);

      expect(result.result).toBe("JOHN");
    });

    it("should handle null context variables", () => {
      const context: FormulaContext = {
        value: null,
      };

      const result = FormulaEngine.evaluate("coalesce(value, 100)", context);

      // Should safely evaluate with null handling
      expect(result.error).toBeUndefined();
    });
  });

  describe("Function Documentation", () => {
    it("should provide documentation for available functions", () => {
      const docs = FormulaEngine.getFunctionDocs("days_between");

      expect(docs).toContain("days_between");
      expect(docs).toContain("days between two dates");
    });

    it("should return null for unknown function", () => {
      const docs = FormulaEngine.getFunctionDocs("unknown_function");

      expect(docs).toBeNull();
    });

    it("should list all available functions", () => {
      const functions = FormulaEngine.getAvailableFunctions();

      expect(functions).toContain("days_between");
      expect(functions).toContain("IF");
      expect(functions).toContain("percentage");
      expect(functions.length).toBeGreaterThan(0);
    });
  });

  describe("Complex Formulas", () => {
    it("should evaluate nested formulas", () => {
      const result = FormulaEngine.evaluate(
        "IF(percentage(50, 100) > 40, round(days_until(2026-12-31), 0), 0)",
        {}
      );

      expect(result.error).toBeUndefined();
      expect(typeof result.result).toBe("number");
    });

    it("should handle context variables in complex formulas", () => {
      const context: FormulaContext = {
        completed: 8,
        total: 10,
      };

      const result = FormulaEngine.evaluate("percentage(completed, total)", context);

      expect(result.result).toBe(80);
    });
  });
});
