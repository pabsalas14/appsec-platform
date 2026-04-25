/**
 * Formula Engine — validates and parses dynamic formulas (Fase 1)
 */

export const validateFormula = (formula: string) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formula || formula.trim().length === 0) {
    errors.push("Formula cannot be empty");
    return { valid: false, errors, warnings };
  }

  const forbidden = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE"];
  if (forbidden.some(kw => formula.toUpperCase().includes(kw))) {
    errors.push("Formula contains forbidden keywords");
  }

  if (formula.includes(";") || formula.includes("--")) {
    errors.push("Formula contains suspicious patterns");
  }

  const openParens = (formula.match(/\(/g) || []).length;
  const closeParens = (formula.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push("Mismatched parentheses");
  }

  if (formula.length > 200) {
    warnings.push("Formula is quite long");
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const parseFormula = (formula: string) => {
  const validation = validateFormula(formula);
  if (!validation.valid) return null;

  const funcRegex = /(\w+)\s*\(/g;
  const functions: string[] = [];
  let match;

  while ((match = funcRegex.exec(formula)) !== null) {
    functions.push(match[1]);
  }

  const fieldRegex = /@(\w+)/g;
  const fields: string[] = [];

  while ((match = fieldRegex.exec(formula)) !== null) {
    fields.push(match[1]);
  }

  return {
    original: formula,
    functions: Array.from(new Set(functions)),
    fields: Array.from(new Set(fields)),
    isValid: true,
  };
};
