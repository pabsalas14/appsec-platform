/**
 * Generic export utilities for CSV and XLSX.
 *
 * Usage:
 *   import { exportCSV, exportXLSX, ExportColumn } from '@/lib/export';
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportColumn<T> {
  key: string;
  header: string;
  /** Extract the display value from a row */
  value: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Export rows to a CSV file (UTF-8 BOM so Excel opens it correctly).
 */
export function exportCSV<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const BOM = '\uFEFF';
  const header = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const body = rows.map((row) =>
    columns
      .map((col) => {
        const v = col.value(row);
        if (v == null) return '';
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = BOM + [header, ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export rows to an XLSX file with styled header row.
 */
export async function exportXLSX<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  sheetName = 'Data',
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Framework';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName);

  // Header row
  ws.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: Math.max(col.header.length + 4, 18),
  }));

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 28;

  // Data rows
  rows.forEach((row) => {
    const values: Record<string, string | number | boolean | null | undefined> = {};
    columns.forEach((col) => {
      values[col.key] = col.value(row);
    });
    ws.addRow(values);
  });

  // Auto-filter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: columns.length },
  };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
