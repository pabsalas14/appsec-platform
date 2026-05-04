'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';

const MOTOR_OPTS = [
  { value: 'sast', label: 'SAST' },
  { value: 'dast', label: 'DAST' },
  { value: 'sca', label: 'SCA' },
  { value: 'cds', label: 'CDS' },
  { value: 'mda', label: 'MDA' },
  { value: 'mast', label: 'MAST' },
  { value: 'tm', label: 'TM' },
] as const;

const REQUIRED = ['titulo', 'severidad', 'estado'] as const;

/** Preview-only CSV parse (UTF-8); backend hace la validación definitiva. */
function parseCsvPreview(text: string, maxDataRows: number): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length && rows.length < maxDataRows; i++) {
    const cells = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cells[j] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

export default function VulnerabilidadImportWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [motor, setMotor] = useState<string>(MOTOR_OPTS[0].value);
  const [defaultRepo, setDefaultRepo] = useState('');
  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped_duplicates?: number; errors: string[] } | null>(null);

  const missingCols = useMemo(() => {
    if (!preview?.headers.length) return REQUIRED as unknown as string[];
    const h = new Set(preview.headers.map((x) => x.trim().toLowerCase()));
    return REQUIRED.filter((r) => !h.has(r.toLowerCase()));
  }, [preview]);

  const onPickFile = useCallback((list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setFileText(text);
      setPreview(parseCsvPreview(text, 15));
      setResult(null);
    };
    reader.readAsText(f, 'UTF-8');
  }, []);

  const runImport = useCallback(async () => {
    if (!fileText) {
      toast.error('Selecciona un archivo CSV.');
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append(
        'file',
        new File([fileText], fileName ?? 'import.csv', { type: 'text/csv;charset=utf-8' }),
      );
      const qs = new URLSearchParams();
      const dr = defaultRepo.trim();
      if (dr) qs.set('default_repositorio_id', dr);
      const url = `/vulnerabilidads/import/${motor}${qs.toString() ? `?${qs}` : ''}`;
      const { data } = await api.post<{
        status: string;
        data: { created?: number; skipped_duplicates?: number; errors?: string[] };
      }>(url, fd);
      if (data.status !== 'success') throw new Error('Respuesta inesperada');
      const created = data.data?.created ?? 0;
      const skipped = data.data?.skipped_duplicates ?? 0;
      const errors = data.data?.errors ?? [];
      setResult({ created, skipped_duplicates: skipped, errors });
      setStep(3);
      toast.success(`Importación: ${created} creadas, ${skipped} omitidas (duplicado).`);
      logger.info('vulnerabilidad.import.wizard.done', { motor, created, skipped, errCount: errors.length });
    } catch (e) {
      logger.error('vulnerabilidad.import.wizard.failed', { motor, error: e });
      toast.error(extractErrorMessage(e, 'Error al importar.'));
    } finally {
      setImporting(false);
    }
  }, [fileText, fileName, motor, defaultRepo]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Importación masiva (asistente)"
        description="Tres pasos: motor y activo por defecto, vista previa del CSV, confirmación. El servidor valida cada fila (BRD Módulo 9)."
      >
        <Link
          href="/vulnerabilidads/registros"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className={step >= 1 ? 'font-semibold text-foreground' : ''}>1. Motor y defaults</span>
        <span aria-hidden>/</span>
        <span className={step >= 2 ? 'font-semibold text-foreground' : ''}>2. Archivo y vista previa</span>
        <span aria-hidden>/</span>
        <span className={step >= 3 ? 'font-semibold text-foreground' : ''}>3. Resultado</span>
      </div>

      {step === 1 ? (
        <Card className="max-w-xl border-dashboard-border bg-dashboard-surface/80">
          <CardHeader>
            <CardTitle className="text-base">Paso 1 — Motor y activo por defecto</CardTitle>
            <CardDescription>
              Opcional: UUID de repositorio aplicado a filas sin <code className="text-xs">repositorio_id</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Motor (conector)"
              value={motor}
              onChange={(e) => setMotor(e.target.value)}
              options={MOTOR_OPTS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <Input
              label="default_repositorio_id (opcional)"
              placeholder="UUID del repositorio"
              value={defaultRepo}
              onChange={(e) => setDefaultRepo(e.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
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
                  } catch (err) {
                    toast.error(extractErrorMessage(err, 'No se pudo descargar la plantilla'));
                  }
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Descargar plantilla CSV
              </Button>
              <Button type="button" onClick={() => setStep(2)} disabled={!motor}>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="max-w-5xl border-dashboard-border bg-dashboard-surface/80">
          <CardHeader>
            <CardTitle className="text-base">Paso 2 — Archivo y vista previa</CardTitle>
            <CardDescription>UTF-8. Cabecera obligatoria. Columnas mínimas: titulo, severidad, estado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-white/[0.12] p-6 text-center text-sm hover:bg-white/[0.02]">
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  onPickFile(e.target.files);
                  e.target.value = '';
                }}
              />
              {fileName ? (
                <span className="font-medium text-foreground">{fileName}</span>
              ) : (
                <span className="text-muted-foreground">Elegir archivo CSV</span>
              )}
            </label>
            {missingCols.length > 0 && preview?.headers.length ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Faltan columnas: {missingCols.join(', ')}. Corrige el CSV antes de importar.
              </p>
            ) : null}
            {preview && preview.headers.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview.headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap text-xs">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row, ri) => (
                      <TableRow key={ri}>
                        {preview.headers.map((h) => (
                          <TableCell key={h} className="max-w-[12rem] truncate text-xs">
                            {row[h] ?? ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin vista previa aún.</p>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                type="button"
                onClick={() => void runImport()}
                disabled={!fileText || missingCols.length > 0 || importing}
              >
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Importar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 && result ? (
        <Card className="max-w-xl border-dashboard-border bg-dashboard-surface/80">
          <CardHeader>
            <CardTitle className="text-base">Paso 3 — Resultado</CardTitle>
            <CardDescription>Resumen del último envío.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Creadas: <strong>{result.created}</strong>
            </p>
            <p>
              Omitidas (duplicado en BD): <strong>{result.skipped_duplicates ?? 0}</strong>
            </p>
            {result.errors.length > 0 ? (
              <div>
                <p className="mb-1 font-medium text-destructive">Errores por fila ({result.errors.length})</p>
                <ul className="max-h-48 list-inside list-disc overflow-y-auto text-xs text-muted-foreground">
                  {result.errors.slice(0, 40).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 40 ? <li>…</li> : null}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setFileText(null);
                  setFileName(null);
                  setPreview(null);
                  setResult(null);
                }}
              >
                Nuevo import
              </Button>
              <Link
                href="/vulnerabilidads/registros"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ir al catálogo
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageWrapper>
  );
}
