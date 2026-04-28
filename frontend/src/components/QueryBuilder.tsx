/**
 * QueryBuilder — Main component for Query Builder (Fase 1)
 * Left panel: QueryBuilderForm
 * Right panel: Live preview (charts, tables, errors)
 */

import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryBuilderForm } from "./QueryBuilderForm";
import { useQueryBuilder, type QueryConfig } from "@/hooks/useQueryBuilder";
import { useQueryValidation } from "@/hooks/useQueryValidation";
import { logger } from "@/lib/logger";

interface QueryBuilderProps {
  onSave?: (widgetId: string) => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onSave }) => {
  const {
    config,
    chartType,
    previewData,
    schema,
    isLoading,
    error,
    updateConfig,
    setChartType,
    validate,
    execute,
    save,
    isSaving,
  } = useQueryBuilder();

  const { result: validation, isValidating } = useQueryValidation(config);
  const [widgetName, setWidgetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = async () => {
    if (!widgetName.trim()) return;
    try {
      const result = await save(widgetName);
      if (result && result.id) {
        onSave?.(result.id);
        setShowSaveDialog(false);
        setWidgetName("");
      }
    } catch (err) {
      logger.error("query_builder.save_failed", { err: String(err) });
    }
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Panel: Form */}
      <div className="w-1/3 overflow-y-auto space-y-4">
        <QueryBuilderForm
          config={config as unknown as Record<string, unknown>}
          schema={schema as unknown as Record<string, unknown>}
          onConfigChange={(updates) => updateConfig(updates as Partial<QueryConfig>)}
          onValidate={validate}
          onExecute={execute}
          isValidating={isValidating}
          validationResult={validation}
        />
      </div>

      {/* Right Panel: Preview */}
      <div className="w-2/3 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Preview & Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chart Type Selector */}
            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="data_table">Data Table</option>
                <option value="bar_chart">Bar Chart</option>
                <option value="line_chart">Line Chart</option>
                <option value="kpi_card">KPI Card</option>
                <option value="donut_gauge">Donut/Gauge</option>
                <option value="pie_chart">Pie Chart</option>
              </select>
            </div>

            {/* Validation Feedback */}
            {validation && !validation.valid && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="font-semibold text-red-900 text-sm mb-2">Validation Errors:</h4>
                <ul className="space-y-1">
                  {validation.errors.map((err, i) => (
                    <li key={i} className="text-red-700 text-sm">
                      • {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation && validation.warnings && validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">Warnings:</h4>
                <ul className="space-y-1">
                  {validation.warnings.map((warn, i) => (
                    <li key={i} className="text-yellow-700 text-sm">
                      • {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm font-medium">Error:</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Executing query...</p>
                </div>
              </div>
            )}

            {/* Preview Data */}
            {previewData && !isLoading && (
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Results ({previewData.rows?.length || 0} rows)
                </h4>

                {chartType === "data_table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          {previewData.columns?.map((col) => (
                            <th key={col} className="px-2 py-1 text-left border">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows?.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {previewData.columns?.map((col) => (
                              <td key={col} className="px-2 py-1 border text-xs">
                                {String((row as Record<string, unknown>)[col] || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(previewData.rows?.length || 0) > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing 10 of {previewData.rows?.length} rows
                      </p>
                    )}
                  </div>
                )}

                {chartType !== "data_table" && (
                  <div className="flex items-center justify-center py-8 bg-gray-50 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Chart preview for {chartType} (chart library integration pending)
                    </p>
                  </div>
                )}
              </div>
            )}

            {!previewData && !isLoading && !error && (
              <div className="flex items-center justify-center py-8 bg-gray-50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Click &quot;Execute&quot; to preview data
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={execute} disabled={!validation?.valid || isLoading} className="flex-1">
                {isLoading ? "Executing..." : "Execute"}
              </Button>

              <Button
                onClick={() => setShowSaveDialog(true)}
                disabled={!previewData || isSaving}
                variant="secondary"
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Save Widget"}
              </Button>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-sm mx-4">
                  <CardHeader>
                    <CardTitle>Save Widget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Widget name"
                      value={widgetName}
                      onChange={(e) => setWidgetName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={!widgetName.trim()} className="flex-1">
                        Save
                      </Button>
                      <Button
                        onClick={() => setShowSaveDialog(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
