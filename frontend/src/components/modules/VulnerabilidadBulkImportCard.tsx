'use client';

import { Download, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { cn, extractErrorMessage } from '@/lib/utils';

const MOTOR_OPTS = [
  { value: 'sast', label: 'SAST' },
  { value: 'dast', label: 'DAST' },
  { value: 'sca', label: 'SCA' },
  { value: 'cds', label: 'CDS' },
  { value: 'mda', label: 'MDA' },
  { value: 'mast', label: 'MAST' },
  { value: 'tm', label: 'TM' },
] as const;

function MotorImportPanel({ motor, label }: { motor: string; label: string }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const onDownloadTemplate = async () => {
    try {
      const { data, headers } = await api.get<ArrayBuffer>(`/vulnerabilidads/import/template/${motor}`, {
        responseType: 'arraybuffer',
      });
      const ct = headers['content-type'];
      const mime =
        typeof ct === 'string' ? ct : Array.isArray(ct) ? String(ct[0] ?? '') : 'text/csv;charset=utf-8';
      const blob = new Blob([data], { type: mime || 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_import_${motor}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Plantilla descargada');
      logger.info('vulnerabilidad.template.download', { motor });
    } catch (e) {
      logger.error('vulnerabilidad.template.download.failed', { motor, error: e });
      toast.error(extractErrorMessage(e, 'No se pudo descargar la plantilla.'));
    }
  };

  const onFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post<{ status: string; data: { created?: number; errors?: unknown[] } }>(
        `/vulnerabilidads/import/${motor}`,
        fd,
      );
      if (data.status !== 'success') {
        throw new Error('Respuesta inesperada');
      }
      const created = data.data?.created ?? 0;
      const skipped = (data.data as { skipped_duplicates?: number })?.skipped_duplicates ?? 0;
      const errs = data.data?.errors?.length ?? 0;
      toast.success(
        `Importación: ${created} creadas.${skipped ? ` ${skipped} omitidas (duplicado).` : ''}${errs ? ` ${errs} filas con error.` : ''}`,
      );
      logger.info('vulnerabilidad.import.ui.success', { motor, created, skipped, errors: errs });
      await qc.invalidateQueries({ queryKey: ['vulnerabilidads'] });
    } catch (e) {
      logger.error('vulnerabilidad.import.ui.failed', { motor, error: e });
      toast.error(extractErrorMessage(e, 'No se pudo importar el CSV.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Columnas y validaciones según conector <span className="font-mono">{motor}</span>.
        </p>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void onDownloadTemplate()}>
          <Download className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>
        <label
          className={cn(
            'relative inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20',
            pending && 'pointer-events-none opacity-50',
          )}
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Elegir CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={pending}
            onChange={(e) => void onFile(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Importación masiva CSV (`POST /api/v1/vulnerabilidad/import/{motor}`).
 * Una pestaña por motor (spec §3 matriz de importación).
 * Requiere permiso `vulnerabilities.import`.
 */
export function VulnerabilidadBulkImportCard() {
  const [motor, setMotor] = useState<string>(MOTOR_OPTS[0].value);

  return (
    <Card className="max-w-4xl border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Importación masiva (CSV)</CardTitle>
        <CardDescription>
          Pestaña por motor: plantilla y subida acoplada al conector. UTF-8. Requiere permiso de importación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={motor} onValueChange={setMotor}>
          <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            {MOTOR_OPTS.map((o) => (
              <TabsTrigger key={o.value} value={o.value} className="text-xs sm:text-sm">
                {o.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {MOTOR_OPTS.map((o) => (
            <TabsContent key={o.value} value={o.value} className="mt-4">
              <MotorImportPanel motor={o.value} label={o.label} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
