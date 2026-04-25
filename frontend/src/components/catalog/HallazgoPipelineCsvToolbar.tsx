'use client';

import { useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui';
import { downloadCsvFromApi, importCsvToApi } from '@/lib/csvDownload';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';

type Envelope<T> = { status: string; data: T };

type ImportResult = {
  importados: number;
  rechazados: number;
  errores: { fila: number; motivo: string }[];
};

const KEY = ['hallazgo_pipelines'] as const;

/**
 * P13: importación masiva con «Descargar template» homogéneo (GET import-template.csv).
 */
export function HallazgoPipelineCsvToolbar() {
  const qc = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const onTemplate = async () => {
    try {
      await downloadCsvFromApi('/hallazgo_pipelines/import-template.csv', 'hallazgos_pipeline_import_template.csv');
      toast.success('Plantilla descargada');
    } catch (e) {
      logger.error('hallazgo_pipeline.csv_template.failed', { error: e });
      toast.error(extractErrorMessage(e, 'No se pudo descargar la plantilla'));
    }
  };

  const onImport = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setCsvBusy(true);
    try {
      const body = await importCsvToApi<Envelope<ImportResult>>('/hallazgo_pipelines/import-csv', file);
      const d = body.data;
      if (d.rechazados > 0) {
        toast.warning(
          `Importados: ${d.importados}. Rechazados: ${d.rechazados}. Revisa el detalle en la respuesta del servidor (P14).`,
        );
        logger.info('hallazgo_pipeline.csv_import.partial', {
          importados: d.importados,
          rechazados: d.rechazados,
          primerosErrores: d.errores?.slice(0, 5),
        });
      } else {
        toast.success(`Importación completada: ${d.importados} fila(s).`);
      }
      await qc.invalidateQueries({ queryKey: KEY });
    } catch (e) {
      logger.error('hallazgo_pipeline.csv_import.failed', { error: e });
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
      <Button type="button" variant="outline" size="sm" onClick={() => void onTemplate()}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Descargar template
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={csvBusy} onClick={() => importInputRef.current?.click()}>
        {csvBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Importar CSV
      </Button>
    </div>
  );
}
