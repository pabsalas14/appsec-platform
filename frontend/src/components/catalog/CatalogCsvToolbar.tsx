'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui';
import { downloadCsvFromApi, importCsvToApi } from '@/lib/csvDownload';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';

type QueryKey = readonly unknown[];

type Props = {
  /** P.ej. `/subdireccions` (sin barra final); se usan + `/export.csv`, etc. */
  basePath: string;
  exportFileName: string;
  templateFileName: string;
  /** Claves de React Query a invalidar tras import */
  invalidateQueries: QueryKey[];
};

/**
 * Botones exportar / plantilla / importar CSV (BRD A2/A3), mismo patrón que inventario.
 */
export function CatalogCsvToolbar({ basePath, exportFileName, templateFileName, invalidateQueries }: Props) {
  const qc = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const root = basePath.replace(/\/$/, '');

  const onExport = async () => {
    try {
      await downloadCsvFromApi(`${root}/export.csv`, exportFileName);
      toast.success('CSV exportado');
    } catch (e) {
      logger.error('catalog.csv_export.failed', { basePath, error: e });
      toast.error(extractErrorMessage(e, 'No se pudo exportar'));
    }
  };

  const onTemplate = async () => {
    try {
      await downloadCsvFromApi(`${root}/import-template.csv`, templateFileName);
      toast.success('Plantilla descargada');
    } catch (e) {
      logger.error('catalog.csv_template.failed', { basePath, error: e });
      toast.error(extractErrorMessage(e, 'No se pudo descargar la plantilla'));
    }
  };

  const onImport = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setCsvBusy(true);
    try {
      await importCsvToApi(`${root}/import`, file);
      toast.success('Importación aplicada');
      for (const key of invalidateQueries) {
        await qc.invalidateQueries({ queryKey: key });
      }
    } catch (e) {
      logger.error('catalog.csv_import.failed', { basePath, error: e });
      toast.error(extractErrorMessage(e, 'Error al importar'));
    } finally {
      setCsvBusy(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => void onImport(e.target.files)}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => void onExport()}>
        <Download className="mr-2 h-4 w-4" />
        Exportar CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void onTemplate()}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Descargar template
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={csvBusy} onClick={() => importInputRef.current?.click()}>
        {csvBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Importar
      </Button>
    </div>
  );
}
