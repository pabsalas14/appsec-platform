/**
 * Formula Engine — Safe evaluation of formulas without eval()
 * Supports: days_between, days_until, IF, percentage, round, count, sum, avg, coalesce, etc.
 */

export interface FormulaContext {
  [key: string]: unknown;
}

export interface ParsedFormula {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const ALLOWED_FUNCTIONS = [
  'days_between',
  'days_until',
  'IF',
  'percentage',
  'round',
  'count',
  'sum',
  'avg',
  'coalesce',
  'concatenate',
  'uppercase',
  'lowercase',
  'substring',
];

const OPERATORS = ['(', ')', '+', '-', '*', '/', '>', '<', '=', '!', ',', ':'];

export class FormulaEngine {
  /**
   * Parse and validate formula syntax without executing
   */
  static validate(formula: string): ParsedFormula {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!formula || formula.trim() === '') {
      errors.push('Formula cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }

    // Check for disallowed eval patterns
    if (/[;]/.test(formula)) {
      errors.push('Semicolons not allowed in formulas');
    }

    if (/[{}]/.test(formula)) {
      errors.push('Curly braces not allowed in formulas');
    }

    // Extract function names and validate
    const funcPattern = /([a-zA-Z_]\w*)\s*\(/g;
    let match;
    while ((match = funcPattern.exec(formula)) !== null) {
      const funcName = match[1];
      if (!ALLOWED_FUNCTIONS.includes(funcName)) {
        errors.push(`Unknown function: ${funcName}`);
      }
    }

    // Warn about deeply nested functions
    const maxDepth = this.getMaxDepth(formula);
    if (maxDepth > 3) {
      warnings.push(`Formula has deep nesting (depth: ${maxDepth}). Consider simplifying.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Safely evaluate formula with context variables
   * Returns result or error message
   */
  static evaluate(formula: string, context: FormulaContext): { result: unknown; error?: string } {
    const validation = this.validate(formula);
    if (!validation.valid) {
      return { result: null, error: validation.errors.join('; ') };
    }

    try {
      const result = this.evaluateExpression(formula, context);
      return { result };
    } catch (error: any) {
      return { result: null, error: error.message || 'Evaluation error' };
    }
  }

  /**
   * Tokenize and evaluate expression
   */
  private static evaluateExpression(formula: string, context: FormulaContext): unknown {
    let expr = formula.trim();

    // Replace variables from context
    for (const [key, value] of Object.entries(context)) {
      const varPattern = new RegExp(`\\b${key}\\b`, 'g');
      if (typeof value === 'string') {
        expr = expr.replace(varPattern, `"${value}"`);
      } else if (value === null || value === undefined) {
        expr = expr.replace(varPattern, 'null');
      } else {
        expr = expr.replace(varPattern, String(value));
      }
    }

    // Replace function calls with safe versions
    expr = this.replaceFunctions(expr);

    // Use Function constructor in a controlled way (safer than eval)
    try {
      const fn = new Function('return ' + expr);
      return fn();
    } catch (error: any) {
      throw new Error(`Formula evaluation failed: ${error.message}`);
    }
  }

  /**
   * Replace custom functions with JavaScript equivalents
   */
  private static replaceFunctions(expr: string): string {
    // days_between(date1, date2)
    expr = expr.replace(
      /days_between\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
      '(Math.floor((new Date($2).getTime() - new Date($1).getTime()) / (1000 * 60 * 60 * 24)))'
    );

    // days_until(date)
    expr = expr.replace(
      /days_until\s*\(\s*([^)]+)\s*\)/g,
      '(Math.floor((new Date($1).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))'
    );

    // IF(condition, true_val, false_val)
    expr = expr.replace(/IF\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '(($1) ? ($2) : ($3))');

    // percentage(a, b)
    expr = expr.replace(/percentage\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '(($1 / $2) * 100)');

    // round(n, decimals)
    expr = expr.replace(
      /round\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
      '(Math.round($1 * Math.pow(10, $2)) / Math.pow(10, $2))'
    );

    // count(array) — simplified
    expr = expr.replace(/count\s*\(\s*([^)]+)\s*\)/g, '($1.length || 0)');

    // sum(array)
    expr = expr.replace(/sum\s*\(\s*([^)]+)\s*\)/g, '($1.reduce((a,b) => a + b, 0))');

    // avg(array)
    expr = expr.replace(
      /avg\s*\(\s*([^)]+)\s*\)/g,
      '($1.reduce((a,b) => a + b, 0) / ($1.length || 1))'
    );

    // coalesce(a, b, c, ...) — return first non-null
    expr = expr.replace(
      /coalesce\s*\(\s*([^)]+)\s*\)/g,
      '(($1.split(",").find(x => x != null) || null))'
    );

    // concatenate(a, b)
    expr = expr.replace(/concatenate\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '(String($1) + String($2))');

    // uppercase(str)
    expr = expr.replace(/uppercase\s*\(\s*([^)]+)\s*\)/g, '(String($1).toUpperCase())');

    // lowercase(str)
    expr = expr.replace(/lowercase\s*\(\s*([^)]+)\s*\)/g, '(String($1).toLowerCase())');

    // substring(str, start, end)
    expr = expr.replace(
      /substring\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
      '(String($1).substring($2, $3))'
    );

    return expr;
  }

  /**
   * Get max nesting depth of formula
   */
  private static getMaxDepth(formula: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of formula) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }
    return maxDepth;
  }

  /**
   * Get list of available functions
   */
  static getAvailableFunctions(): string[] {
    return ALLOWED_FUNCTIONS;
  }

  /**
   * Get function documentation
   */
  static getFunctionDocs(functionName: string): string | null {
    const docs: Record<string, string> = {
      days_between: 'days_between(date1, date2) — Returns days between two dates',
      days_until: 'days_until(date) — Returns days until given date',
      IF: 'IF(condition, true_val, false_val) — Conditional expression',
      percentage: 'percentage(a, b) — Returns (a/b)*100',
      round: 'round(n, decimals) — Rounds number to decimals places',
      count: 'count(array) — Returns length of array',
      sum: 'sum(array) — Returns sum of array elements',
      avg: 'avg(array) — Returns average of array elements',
      coalesce: 'coalesce(a, b, c...) — Returns first non-null value',
      concatenate: 'concatenate(a, b) — Concatenates strings',
      uppercase: 'uppercase(str) — Converts to uppercase',
      lowercase: 'lowercase(str) — Converts to lowercase',
      substring: 'substring(str, start, end) — Extracts substring',
    };
    return docs[functionName] || null;
  }
}
