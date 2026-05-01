'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui';
import { downloadAuthenticatedExport } from '@/lib/apiExport';
import { extractErrorMessage } from '@/lib/utils';

type DashboardCsvExportButtonProps = {
  /** Ruta bajo `/api/v1` (p. ej. `/vulnerabilidads/export.csv`). */
  apiPath: string;
  filename: string;
  label?: string;
  className?: string;
};

export function DashboardCsvExportButton({
  apiPath,
  filename,
  label = 'Exportar CSV',
  className = '',
}: DashboardCsvExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
      onClick={async () => {
        try {
          await downloadAuthenticatedExport(apiPath, filename);
          toast.success('Descarga iniciada');
        } catch (e) {
          toast.error(extractErrorMessage(e, 'No se pudo exportar'));
        }
      }}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
