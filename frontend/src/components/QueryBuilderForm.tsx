/**
 * QueryBuilderForm — left panel form for Query Builder (Fase 1)
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
};

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
  isExecuting,
  validationResult,
}) => {
  const tables = schema?.tables || [];

  return (
    <div className="space-y-4 p-4">
      {/* Base Table Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Base Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={config.base_table} onValueChange={(value) => onConfigChange({ base_table: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select table..." />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table: any) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Field Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Select Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              placeholder="field1, field2, field3..."
              value={(config.select_fields || []).join(", ")}
              onChange={(e) => onConfigChange({ select_fields: e.target.value.split(",").map((f) => f.trim()) })}
            />
            <p className="text-xs text-muted-foreground">Separate fields with commas</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {(config.filters || []).length} filter(s) applied
          </div>
          <Button variant="outline" size="sm" className="mt-2">
            + Add Filter
          </Button>
        </CardContent>
      </Card>

      {/* Group By */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Group By</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="field1, field2..."
            value={(config.group_by || []).join(", ")}
            onChange={(e) => onConfigChange({ group_by: e.target.value.split(",").map((f) => f.trim()) })}
          />
        </CardContent>
      </Card>

      {/* Validation Status */}
      {validationResult && (
        <Card className={validationResult.valid ? "border-green-200" : "border-red-200"}>
          <CardHeader>
            <CardTitle className="text-sm">{validationResult.valid ? "✓ Valid" : "✗ Invalid"}</CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.errors.length > 0 && (
              <div className="text-sm text-red-600">
                {validationResult.errors.map((err: string, i: number) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div className="text-sm text-amber-600 mt-2">
                {validationResult.warnings.map((warn: string, i: number) => (
                  <div key={i}>⚠ {warn}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onValidate} disabled={isValidating} variant="outline" className="flex-1">
          {isValidating ? "Validating..." : "Validate"}
        </Button>
        <Button onClick={onExecute} disabled={isExecuting} className="flex-1">
          {isExecuting ? "Executing..." : "Execute"}
        </Button>
      </div>
    </div>
  );
};
