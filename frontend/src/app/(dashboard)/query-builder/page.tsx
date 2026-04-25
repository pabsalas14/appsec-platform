/**
 * Query Builder Page — Fase 1 Frontend
 * URL: /dashboard/query-builder
 */

"use client";

import React from "react";
import { QueryBuilder } from "@/components/QueryBuilder";

export default function QueryBuilderPage() {
  const handleSave = (widgetId: string) => {
    console.log(`Widget saved: ${widgetId}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Query Builder</h1>
        <p className="text-sm text-muted-foreground">
          Create dynamic queries without SQL. Build, validate, execute, and save widgets.
        </p>
      </div>

      <QueryBuilder onSave={handleSave} />
    </div>
  );
}
