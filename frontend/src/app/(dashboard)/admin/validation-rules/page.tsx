"use client";

import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { logger } from "@/lib/logger";
import type { ValidationRuleRead } from "@/types/api";

// Tipos locales
interface Formula {
  id: string;
  nombre: string;
  description?: string;
  formula_text: string;
  motor: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface FormulaTest {
  success: boolean;
  result?: unknown;
  error?: string;
}

interface FunctionInfo {
  name: string;
  description: string;
  syntax: string;
}

type FormulaFormData = Omit<Formula, "id" | "created_at" | "updated_at">;
type ValidationRuleFormData = Omit<ValidationRuleRead, "id" | "created_at" | "updated_at" | "created_by">;

const DEFAULT_FORMULA: FormulaFormData = {
  nombre: "",
  description: "",
  formula_text: "",
  motor: "formula_engine",
  enabled: true,
};

const DEFAULT_VALIDATION_RULE: ValidationRuleFormData = {
  nombre: "",
  entity_type: "",
  rule_type: "required",
  condition: {},
  error_message: "",
  enabled: true,
};

// Hook para formulas
function useFormulas() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFormulas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/formulas");
      if (!res.ok) throw new Error("Failed to fetch formulas");
      const data = await res.json();
      setFormulas(data.data.items || []);
    } catch (error) {
      logger.error("formulas.fetch", { error: String(error) });
      toast.error("Error al cargar fórmulas");
    } finally {
      setLoading(false);
    }
  };

  const createFormula = async (formula: FormulaFormData) => {
    try {
      const res = await fetch("/api/v1/admin/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formula),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.detail || "Failed to create formula");
      }
      const data = await res.json();
      setFormulas([...formulas, data.data]);
      toast.success("Fórmula creada");
      logger.info("formula.create", { nombre: formula.nombre });
      return data.data;
    } catch (error) {
      logger.error("formula.create", { error: String(error) });
      toast.error(String(error));
    }
  };

  const updateFormula = async (id: string, formula: Partial<FormulaFormData>) => {
    try {
      const res = await fetch(`/api/v1/admin/formulas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formula),
      });
      if (!res.ok) throw new Error("Failed to update formula");
      const data = await res.json();
      setFormulas(formulas.map((f) => (f.id === id ? data.data : f)));
      toast.success("Fórmula actualizada");
      logger.info("formula.update", { id });
      return data.data;
    } catch (error) {
      logger.error("formula.update", { error: String(error) });
      toast.error(String(error));
    }
  };

  const deleteFormula = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/formulas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete formula");
      setFormulas(formulas.filter((f) => f.id !== id));
      toast.success("Fórmula eliminada");
      logger.info("formula.delete", { id });
    } catch (error) {
      logger.error("formula.delete", { error: String(error) });
      toast.error(String(error));
    }
  };

  const testFormula = async (formulaText: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/v1/admin/formulas/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula_text: formulaText, data }),
      });
      if (!res.ok) throw new Error("Failed to test formula");
      const result = await res.json();
      logger.info("formula.test", { success: true });
      return result.data as FormulaTest;
    } catch (error) {
      logger.error("formula.test", { error: String(error) });
      toast.error(String(error));
      return { success: false, error: String(error) };
    }
  };

  const getSupportedFunctions = async (): Promise<FunctionInfo[]> => {
    try {
      const res = await fetch("/api/v1/admin/formulas/functions/supported");
      if (!res.ok) throw new Error("Failed to fetch functions");
      const data = await res.json();
      return data.data as FunctionInfo[];
    } catch (error) {
      logger.error("formulas.functions", { error: String(error) });
      return [];
    }
  };

  return {
    formulas,
    loading,
    fetchFormulas,
    createFormula,
    updateFormula,
    deleteFormula,
    testFormula,
    getSupportedFunctions,
  };
}

// Hook para validation rules
function useValidationRules() {
  const [rules, setRules] = useState<ValidationRuleRead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/validation-rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data.data.items || []);
    } catch (error) {
      logger.error("validation_rules.fetch", { error: String(error) });
      toast.error("Error al cargar reglas");
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (rule: ValidationRuleFormData) => {
    try {
      const res = await fetch("/api/v1/admin/validation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.detail || "Failed to create rule");
      }
      const data = await res.json();
      setRules([...rules, data.data]);
      toast.success("Regla creada");
      logger.info("validation_rule.create", { nombre: rule.nombre });
      return data.data;
    } catch (error) {
      logger.error("validation_rule.create", { error: String(error) });
      toast.error(String(error));
    }
  };

  const updateRule = async (id: string, rule: Partial<ValidationRuleFormData>) => {
    try {
      const res = await fetch(`/api/v1/admin/validation-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      const data = await res.json();
      setRules(rules.map((r) => (r.id === id ? data.data : r)));
      toast.success("Regla actualizada");
      logger.info("validation_rule.update", { id });
      return data.data;
    } catch (error) {
      logger.error("validation_rule.update", { error: String(error) });
      toast.error(String(error));
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/validation-rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete rule");
      setRules(rules.filter((r) => r.id !== id));
      toast.success("Regla eliminada");
      logger.info("validation_rule.delete", { id });
    } catch (error) {
      logger.error("validation_rule.delete", { error: String(error) });
      toast.error(String(error));
    }
  };

  const testRule = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/v1/admin/validation-rules/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error("Failed to test rule");
      const result = await res.json();
      logger.info("validation_rule.test", { id, valid: result.data?.valid });
      return result.data;
    } catch (error) {
      logger.error("validation_rule.test", { error: String(error) });
      toast.error(String(error));
      return { valid: false, message: String(error) };
    }
  };

  return {
    rules,
    loading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    testRule,
  };
}

// Componente: Form para Fórmulas
function FormulaForm({
  initialData,
  onSubmit,
  isLoading,
  supportedFunctions,
}: {
  initialData?: Partial<FormulaFormData>;
  onSubmit: (data: FormulaFormData) => Promise<void>;
  isLoading: boolean;
  supportedFunctions: FunctionInfo[];
}) {
  const [form, setForm] = useState<FormulaFormData>(
    initialData ? { ...DEFAULT_FORMULA, ...initialData } : { ...DEFAULT_FORMULA }
  );
  const [testData, setTestData] = useState<Record<string, unknown>>({});
  const [testResult, setTestResult] = useState<FormulaTest | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (key: keyof FormulaFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTestField = () => {
    setTestData((prev) => ({ ...prev, [`field_${Object.keys(prev).length}`]: "" }));
  };

  const handleTestFieldChange = (key: string, value: unknown) => {
    setTestData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await fetch("/api/v1/admin/formulas/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula_text: form.formula_text,
          data: testData,
        }),
      }).then((r) => r.json());
      setTestResult(result.data);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder="e.g., CVSS Score Adjustment"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción (opcional)</label>
        <textarea
          className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Descripción de la fórmula"
        />
      </div>

      {/* Formula Text */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Expresión de Fórmula</label>
        <textarea
          className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          value={form.formula_text}
          onChange={(e) => handleChange("formula_text", e.target.value)}
          placeholder="e.g., IF(severidad == 'CRITICA', 10, 5)"
        />
      </div>

      {/* Supported Functions Reference */}
      {supportedFunctions.length > 0 && (
        <div className="rounded-lg border p-3 bg-muted/50">
          <h4 className="text-sm font-semibold mb-2">Funciones Soportadas:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {supportedFunctions.map((func) => (
              <div key={func.name} className="font-mono">
                <span className="font-semibold">{func.name}</span> — {func.description}
                <div className="text-muted-foreground text-xs mt-0.5">
                  Sintaxis: {func.syntax}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Section */}
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold text-sm">Testear Fórmula</h4>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Datos de Prueba</label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddTestField}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Campo
            </Button>
          </div>

          {Object.entries(testData).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <Input
                value={key}
                readOnly
                className="w-1/3"
                placeholder="Field name"
              />
              <Input
                value={String(value)}
                onChange={(e) => handleTestFieldChange(key, e.target.value)}
                className="w-2/3"
                placeholder="Field value"
              />
            </div>
          ))}
        </div>

        <Button
          onClick={handleTest}
          disabled={testing || !form.formula_text}
          size="sm"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...
            </>
          ) : (
            "Ejecutar Test"
          )}
        </Button>

        {testResult && (
          <div className={`rounded p-3 text-sm ${
            testResult.success
              ? "bg-green-50 border border-green-200 text-green-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}>
            {testResult.success ? (
              <>
                <Check className="w-4 h-4 inline mr-1" />
                Resultado: {JSON.stringify(testResult.result)}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Error: {testResult.error}
              </>
            )}
          </div>
        )}
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Habilitar</label>
        <Switch
          checked={form.enabled}
          onCheckedChange={(checked) => handleChange("enabled", checked)}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(form)}
        disabled={isLoading || !form.nombre || !form.formula_text}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
          </>
        ) : (
          "Guardar Fórmula"
        )}
      </Button>
    </div>
  );
}

// Componente: Form para Validation Rules
function ValidationRuleForm({
  initialData,
  onSubmit,
  isLoading,
  onTest,
}: {
  initialData?: Partial<ValidationRuleFormData>;
  onSubmit: (data: ValidationRuleFormData) => Promise<void>;
  isLoading: boolean;
  onTest?: (data: Record<string, unknown>) => Promise<{ valid: boolean; message?: string }>;
}) {
  const [form, setForm] = useState<ValidationRuleFormData>(
    initialData ? { ...DEFAULT_VALIDATION_RULE, ...initialData } : { ...DEFAULT_VALIDATION_RULE }
  );
  const [testData, setTestData] = useState<Record<string, unknown>>({});
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (key: keyof ValidationRuleFormData, value: unknown) => {
    if (key === "condition" && typeof value === "string") {
      try {
        setForm((prev) => ({ ...prev, [key]: JSON.parse(value) }));
      } catch {
        // Keep as is if invalid JSON
      }
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleAddTestField = () => {
    setTestData((prev) => ({ ...prev, [`field_${Object.keys(prev).length}`]: "" }));
  };

  const handleTestFieldChange = (key: string, value: unknown) => {
    setTestData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    try {
      const result = await onTest(testData);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder="e.g., Críticas requieren SLA ≤ 7 días"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Entidad</label>
        <Input
          value={form.entity_type}
          onChange={(e) => handleChange("entity_type", e.target.value)}
          placeholder="e.g., vulnerabilidad, service_release"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Regla</label>
        <Select
          value={form.rule_type}
          onChange={(e) => handleChange("rule_type", e.target.value)}
          options={[
            { value: "required", label: "Required" },
            { value: "regex", label: "Regex" },
            { value: "conditional", label: "Conditional" },
            { value: "formula", label: "Formula" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Condición (JSON)</label>
        <textarea
          className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          value={JSON.stringify(form.condition, null, 2)}
          onChange={(e) => handleChange("condition", e.target.value)}
          placeholder="{}"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mensaje de Error</label>
        <textarea
          className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.error_message}
          onChange={(e) => handleChange("error_message", e.target.value)}
          placeholder="Mensaje a mostrar cuando la validación falla"
        />
      </div>

      {/* Test Section */}
      {onTest && (
        <div className="rounded-lg border p-4 space-y-3">
          <h4 className="font-semibold text-sm">Testear Regla</h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Datos de Prueba</label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTestField}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar Campo
              </Button>
            </div>

            {Object.entries(testData).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <Input
                  value={key}
                  readOnly
                  className="w-1/3"
                  placeholder="Field name"
                />
                <Input
                  value={String(value)}
                  onChange={(e) => handleTestFieldChange(key, e.target.value)}
                  className="w-2/3"
                  placeholder="Field value"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleTest}
            disabled={testing}
            size="sm"
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...
              </>
            ) : (
              "Ejecutar Test"
            )}
          </Button>

          {testResult && (
            <div className={`rounded p-3 text-sm ${
              testResult.valid
                ? "bg-green-50 border border-green-200 text-green-900"
                : "bg-red-50 border border-red-200 text-red-900"
            }`}>
              {testResult.valid ? (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  ✓ Validación: PASÓ
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Validación: FALLÓ{testResult.message && ` - ${testResult.message}`}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Habilitar</label>
        <Switch
          checked={form.enabled}
          onCheckedChange={(checked) => handleChange("enabled", checked)}
        />
      </div>

      <Button
        onClick={() => onSubmit(form)}
        disabled={isLoading || !form.nombre || !form.entity_type}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
          </>
        ) : (
          "Guardar Regla"
        )}
      </Button>
    </div>
  );
}

export default function ValidationRulesPage() {
  const formulas = useFormulas();
  const rules = useValidationRules();
  const [supportedFunctions, setSupportedFunctions] = useState<FunctionInfo[]>([]);
  const [showFormulaDialog, setShowFormulaDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [editingRule, setEditingRule] = useState<ValidationRuleRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    formulas.fetchFormulas();
    rules.fetchRules();
    formulas.getSupportedFunctions().then(setSupportedFunctions);
  }, []);

  const handleCreateFormula = async (data: FormulaFormData) => {
    setIsSubmitting(true);
    try {
      if (editingFormula) {
        await formulas.updateFormula(editingFormula.id, data);
      } else {
        await formulas.createFormula(data);
      }
      setShowFormulaDialog(false);
      setEditingFormula(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRule = async (data: ValidationRuleFormData) => {
    setIsSubmitting(true);
    try {
      if (editingRule) {
        await rules.updateRule(editingRule.id, data);
      } else {
        await rules.createRule(data);
      }
      setShowRuleDialog(false);
      setEditingRule(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Validación y Fórmulas"
        description="Administra reglas de validación y fórmulas dinámicas"
      />

      <Tabs defaultValue="formulas" className="mt-6">
        <TabsList>
          <TabsTrigger value="formulas">Fórmulas</TabsTrigger>
          <TabsTrigger value="rules">Reglas de Validación</TabsTrigger>
        </TabsList>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="space-y-4">
          <Button onClick={() => setShowFormulaDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Fórmula
          </Button>

          {formulas.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...
            </div>
          ) : (
            <div className="grid gap-4">
              {formulas.formulas.map((formula) => (
                <Card key={formula.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{formula.nombre}</CardTitle>
                        {formula.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formula.description}
                          </p>
                        )}
                      </div>
                      <Switch checked={formula.enabled} disabled />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted p-3 rounded font-mono text-xs overflow-auto max-h-24">
                      {formula.formula_text}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFormula(formula);
                          setShowFormulaDialog(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => formulas.deleteFormula(formula.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Button onClick={() => setShowRuleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Regla
          </Button>

          {rules.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{rule.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rule.entity_type} • {rule.rule_type}
                        </p>
                      </div>
                      <Switch checked={rule.enabled} disabled />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{rule.error_message}</p>
                    <div className="bg-muted p-3 rounded font-mono text-xs overflow-auto max-h-20">
                      {JSON.stringify(rule.condition, null, 2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleDialog(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rules.deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Formula Dialog */}
      <Dialog open={showFormulaDialog} onOpenChange={setShowFormulaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormula ? "Editar Fórmula" : "Nueva Fórmula"}
            </DialogTitle>
            <DialogDescription>
              {editingFormula
                ? "Actualiza la fórmula"
                : "Crea una nueva fórmula dinámica"}
            </DialogDescription>
          </DialogHeader>
          <FormulaForm
            initialData={editingFormula || undefined}
            onSubmit={handleCreateFormula}
            isLoading={isSubmitting}
            supportedFunctions={supportedFunctions}
          />
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regla" : "Nueva Regla de Validación"}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Actualiza la regla de validación"
                : "Crea una nueva regla de validación"}
            </DialogDescription>
          </DialogHeader>
          <ValidationRuleForm
            initialData={editingRule || undefined}
            onSubmit={handleCreateRule}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
