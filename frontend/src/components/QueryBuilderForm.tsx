/**
 * QueryBuilderForm — Left panel for Query Builder
 * Handles: base table, joins, fields, filters, group by, aggregations
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueryBuilderFormProps {
  config: Record<string, unknown>;
  schema: Record<string, unknown>;
  onConfigChange: (updates: Record<string, unknown>) => void;
  onValidate: () => void;
  onExecute: () => void;
  isValidating?: boolean;
  isExecuting?: boolean;
  validationResult?: ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export const QueryBuilderForm: React.FC<QueryBuilderFormProps> = ({
  config,
  schema,
  onConfigChange,
  onValidate,
  onExecute,
  isValidating,
  validationResult,
}) => {
  const tables = (schema.tables as Array<{ name: string }>) || [];
  const currentTable = config.base_table as string || "";

  const handleTableChange = (table: string) => {
    onConfigChange({ ...config, base_table: table });
  };

  const handleFieldToggle = (field: string) => {
    const selected = (config.select_fields as string[]) || [];
    const updated = selected.includes(field) ? selected.filter((f) => f !== field) : [...selected, field];
    onConfigChange({ ...config, select_fields: updated });
  };

  const handleAddFilter = () => {
    const filters = (config.filters as Array<Record<string, unknown>>) || [];
    onConfigChange({
      ...config,
      filters: [...filters, { field: "", operator: "=", value: "" }],
    });
  };

  const handleFilterChange = (index: number, field: string, value: unknown) => {
    const filters = (config.filters as Array<Record<string, unknown>>) || [];
    const updated = [...filters];
    updated[index] = { ...updated[index], [field]: value };
    onConfigChange({ ...config, filters: updated });
  };

  const handleRemoveFilter = (index: number) => {
    const filters = (config.filters as Array<Record<string, unknown>>) || [];
    onConfigChange({ ...config, filters: filters.filter((_, i) => i !== index) });
  };

  const selectedFields = (config.select_fields as string[]) || [];
  const filters = (config.filters as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-4">
      {/* Base Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base Table</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={currentTable}
            onChange={(e) => handleTableChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Select a table...</option>
            {tables.map((table) => (
              <option key={table.name} value={table.name}>
                {table.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Fields */}
      {currentTable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {/* Mock fields - in real app, fetch from schema */}
            {["id", "name", "email", "created_at", "updated_at"].map((field) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => handleFieldToggle(field)}
                  className="rounded"
                />
                <span className="text-sm">{field}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button onClick={handleAddFilter} variant="outline" size="sm">
              + Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filters.length === 0 && <p className="text-xs text-muted-foreground">No filters yet</p>}

          {filters.map((filter, i) => (
            <div key={i} className="flex gap-2 items-center text-sm">
              <Input
                placeholder="Field"
                value={(filter.field as string) || ""}
                onChange={(e) => handleFilterChange(i, "field", e.target.value)}
                className="text-xs h-8"
              />

              <select
                value={(filter.operator as string) || "="}
                onChange={(e) => handleFilterChange(i, "operator", e.target.value)}
                className="px-2 py-1 border rounded text-xs h-8"
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">{">"}</option>
                <option value="<">{"<"}</option>
                <option value=">=">{">="}</option>
                <option value="<=">{"\<="}</option>
                <option value="IN">IN</option>
                <option value="LIKE">LIKE</option>
              </select>

              <Input
                placeholder="Value"
                value={String((filter.value as string) || "")}
                onChange={(e) => handleFilterChange(i, "value", e.target.value)}
                className="text-xs h-8"
              />

              <Button
                onClick={() => handleRemoveFilter(i)}
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Status */}
      {validationResult && (
        <Card className={validationResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-4">
            <p className={`text-xs font-medium ${validationResult.valid ? "text-green-900" : "text-red-900"}`}>
              {validationResult.valid ? "✓ Valid configuration" : "✗ Configuration has errors"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onValidate} variant="outline" className="flex-1 text-xs h-9">
          {isValidating ? "Validating..." : "Validate"}
        </Button>
        <Button onClick={onExecute} disabled={!validationResult?.valid} className="flex-1 text-xs h-9">
          Execute
        </Button>
      </div>
    </div>
  );
};
