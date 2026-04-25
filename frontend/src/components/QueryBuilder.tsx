import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryBuilderForm } from "./QueryBuilderForm";
import { useQueryBuilder } from "@/hooks/useQueryBuilder";
import { useQueryValidation } from "@/hooks/useQueryValidation";

interface QueryBuilderProps {
  onSave?: (widgetId: string) => void;
};

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onSave }) => {
  const {
    config,
    chartType,
    previewData,
    schema,
    updateConfig,
    setChartType,
    validate,
    execute,
    save,
    isSaving,
  } = useQueryBuilder();

  const validation = useQueryValidation(config);
  const [widgetName, setWidgetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = async () => {
    if (!widgetName.trim()) return;
    try {
      const result = await save(widgetName);
      onSave?.(result.id);
      setShowSaveDialog(false);
      setWidgetName("");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Panel: Form */}
      <div className="w-1/3 overflow-y-auto">
        <QueryBuilderForm
          config={config}
          schema={schema}
          onConfigChange={updateConfig}
          onValidate={validate}
          onExecute={execute}
          validationResult={validation}
        />
      </div>

      {/* Right Panel: Preview */}
      <div className="w-2/3 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
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
              </select>
            </div>

            {/* Preview Area */}
            {previewData ? (
              <div className="border rounded-md p-4">
                <div className="text-sm text-muted-foreground mb-3">
                  {previewData.meta?.count || 0} rows returned
                </div>
                {previewData.rows && previewData.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {previewData.labels?.map((label: string) => (
                            <th key={label} className="text-left px-2 py-1 border-b">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i}>
                            {previewData.labels?.map((label: string) => (
                              <td key={`${i}-${label}`} className="px-2 py-1 border-b">
                                {String(row[label] ?? "—").substring(0, 50)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data returned</div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-8 text-center text-muted-foreground">
                Execute query to see preview
              </div>
            )}

            {/* Validation Messages */}
            {validation.hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-medium text-red-800 mb-2">Validation Errors:</p>
                {validation.errors.map((err: string, i: number) => (
                  <div key={i} className="text-sm text-red-700">
                    • {err}
                  </div>
                ))}
              </div>
            )}

            {validation.hasWarnings && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Warnings:</p>
                {validation.warnings.map((warn: string, i: number) => (
                  <div key={i} className="text-sm text-amber-700">
                    ⚠ {warn}
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={!validation.valid || isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save as Widget"}
            </Button>

            {/* Save Dialog */}
            {showSaveDialog && (
              <div className="border rounded-md p-4 bg-muted">
                <label className="text-sm font-medium">Widget Name</label>
                <Input
                  placeholder="My Query Widget"
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  className="mt-2"
                />
                <div className="flex gap-2 mt-3">
                  <Button onClick={handleSave} disabled={!widgetName.trim()} className="flex-1">
                    Save
                  </Button>
                  <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
