'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VulnerabilidadRow } from '@/types/dashboard-vuln';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface VulnerabilidadesTableProps {
  data: VulnerabilidadRow[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  title?: string;
}

const severityColors: Record<string, string> = {
  CRITICA: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  BAJA: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  INFORMATIVA: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const estadoColors: Record<string, string> = {
  Abierta: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  'En Progreso': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  Remediada: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  Cerrada: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function VulnerabilidadesTable({
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  title = 'Vulnerabilidades',
}: VulnerabilidadesTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {total > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} de ${total}` : '0'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay vulnerabilidades</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Título</th>
                    <th className="text-left py-2 px-2 font-medium">Severidad</th>
                    <th className="text-left py-2 px-2 font-medium">Estado</th>
                    <th className="text-left py-2 px-2 font-medium">Hallazgo</th>
                    <th className="text-left py-2 px-2 font-medium">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-2">
                        <span className="text-xs font-medium line-clamp-1" title={item.titulo}>
                          {item.titulo}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={severityColors[item.severidad] || severityColors.INFORMATIVA}>
                          {item.severidad}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={estadoColors[item.estado] || 'bg-gray-100 text-gray-800'}>
                          {item.estado}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.fecha_hallazgo), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs">
                          {item.fecha_limite_sla
                            ? formatDistanceToNow(new Date(item.fecha_limite_sla), {
                                addSuffix: true,
                                locale: es,
                              })
                            : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasPrevPage}
                    onClick={() => onPageChange?.(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasNextPage}
                    onClick={() => onPageChange?.(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
