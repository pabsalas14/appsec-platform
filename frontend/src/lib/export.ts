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
  wb.creator = 'Plataforma AppSec';
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

type PrintColumn<T> = { header: string; value: (row: T) => string | number | boolean | null | undefined };

/**
 * Imprime en una ventana emergente respetando columnas actuales (WYSIWYG respecto a la exportación de tabla).
 */
export function printTableHtml<T>(title: string, columns: PrintColumn<T>[], rows: T[]) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const thead = `<tr>${columns.map((c) => `<th>${esc(c.header)}</th>`).join('')}</tr>`;
  const tbody = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const v = c.value(row);
          return `<td>${esc(v == null ? '' : String(v))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:system-ui,sans-serif;padding:1rem}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
th{background:#0f172a;color:#fff}
h1{font-size:1.1rem;margin-bottom:0.75rem}
</style></head><body>
<h1>${esc(title)}</h1>
<table>${thead}${tbody}</table>
<script>addEventListener("load",()=>{setTimeout(()=>{print();},200);})</script>
</body></html>`;
  const w = typeof window !== 'undefined' ? window.open('', '_blank', 'noopener,noreferrer') : null;
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
