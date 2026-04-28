'use client';

import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { HallazgoMAST } from '@/lib/schemas/hallazgo_mast.schema';

interface MastFindingsTableProps {
  findings: HallazgoMAST[];
  onFindingClick?: (finding: HallazgoMAST) => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  Critica: {
    bg: 'bg-red-500/10',
    fg: 'text-red-500',
    border: 'border-red-500/30',
  },
  Alta: {
    bg: 'bg-orange-500/10',
    fg: 'text-orange-500',
    border: 'border-orange-500/30',
  },
  Media: {
    bg: 'bg-yellow-500/10',
    fg: 'text-yellow-500',
    border: 'border-yellow-500/30',
  },
  Baja: {
    bg: 'bg-blue-500/10',
    fg: 'text-blue-500',
    border: 'border-blue-500/30',
  },
};

export function MastFindingsTable({
  findings,
  onFindingClick,
}: MastFindingsTableProps) {
  if (findings.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Sin hallazgos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-[10px] uppercase">ID</TableHead>
            <TableHead className="text-[10px] uppercase">Nombre</TableHead>
            <TableHead className="w-24 text-[10px] uppercase">Severidad</TableHead>
            <TableHead className="w-20 text-[10px] uppercase">CWE</TableHead>
            <TableHead className="text-[10px] uppercase">OWASP</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((finding) => {
            const colors = SEVERITY_COLORS[finding.severidad] || SEVERITY_COLORS.Baja;
            const displayId = finding.id.substring(0, 8).toUpperCase();

            return (
              <TableRow
                key={finding.id}
                onClick={() => onFindingClick?.(finding)}
                className="cursor-pointer hover:bg-accent/30"
              >
                <TableCell className="font-mono text-xs">{displayId}</TableCell>
                <TableCell className="text-xs font-medium max-w-xs truncate">
                  {finding.nombre}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('text-[9px]', colors.bg, colors.fg, colors.border)}
                  >
                    {finding.severidad}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {finding.cwe || '-'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {finding.owasp_categoria || '-'}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
