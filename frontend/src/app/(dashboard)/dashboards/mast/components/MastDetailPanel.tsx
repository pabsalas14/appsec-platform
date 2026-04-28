'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { AplicacionMovil } from '@/lib/schemas/aplicacion_movil.schema';
import type { EjecucionMAST } from '@/lib/schemas/ejecucion_mast.schema';
import type { HallazgoMAST } from '@/lib/schemas/hallazgo_mast.schema';
import { MastFindingsTable } from './MastFindingsTable';

interface MastDetailPanelProps {
  app?: AplicacionMovil | null;
  executions?: EjecucionMAST[];
  findings?: HallazgoMAST[];
  isLoading?: boolean;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; fg: string }> = {
  Critica: { bg: 'bg-red-500/10', fg: 'text-red-500' },
  Alta: { bg: 'bg-orange-500/10', fg: 'text-orange-500' },
  Media: { bg: 'bg-yellow-500/10', fg: 'text-yellow-500' },
  Baja: { bg: 'bg-blue-500/10', fg: 'text-blue-500' },
};

export function MastDetailPanel({
  app,
  executions = [],
  findings = [],
  isLoading,
  onClose,
}: MastDetailPanelProps) {
  const [selectedFinding, setSelectedFinding] = useState<HallazgoMAST | null>(null);

  if (!app) return null;

  const findingsBySeverity = {
    Critica: findings.filter((f) => f.severidad === 'Critica'),
    Alta: findings.filter((f) => f.severidad === 'Alta'),
    Media: findings.filter((f) => f.severidad === 'Media'),
    Baja: findings.filter((f) => f.severidad === 'Baja'),
  };

  return (
    <Sheet open={!!app} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[600px] md:w-[750px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <SheetTitle className="text-xl">{app.nombre}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-2">
                {app.plataforma} · {app.bundle_id}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="info" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="findings">
                Hallazgos
                {findings.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {findings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="executions">
                Ejecuciones
                {executions.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {executions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            {/* INFO TAB */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Plataforma</p>
                      <p className="font-medium">{app.plataforma}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bundle ID</p>
                      <p className="font-mono text-xs break-all">{app.bundle_id}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="text-sm">{formatDate(app.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actualizado</p>
                    <p className="text-sm">{formatDate(app.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumen de Hallazgos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(findingsBySeverity).map(([severity, items]) => (
                    <div
                      key={severity}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{severity}</span>
                      <span className="font-semibold">{items.length}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{findings.length}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FINDINGS TAB */}
            <TabsContent value="findings" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <MastFindingsTable
                    findings={findings}
                    onFindingClick={setSelectedFinding}
                  />
                </CardContent>
              </Card>

              {selectedFinding && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Detalle del Hallazgo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedFinding.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severidad</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'mt-1',
                          SEVERITY_COLORS[selectedFinding.severidad]?.bg,
                          SEVERITY_COLORS[selectedFinding.severidad]?.fg,
                        )}
                      >
                        {selectedFinding.severidad}
                      </Badge>
                    </div>
                    {selectedFinding.descripcion && (
                      <div>
                        <p className="text-xs text-muted-foreground">Descripción</p>
                        <p className="text-xs leading-relaxed">
                          {selectedFinding.descripcion}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFinding.cwe && (
                        <div>
                          <p className="text-xs text-muted-foreground">CWE</p>
                          <p className="font-mono text-xs">{selectedFinding.cwe}</p>
                        </div>
                      )}
                      {selectedFinding.owasp_categoria && (
                        <div>
                          <p className="text-xs text-muted-foreground">OWASP</p>
                          <p className="text-xs">{selectedFinding.owasp_categoria}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* EXECUTIONS TAB */}
            <TabsContent value="executions" className="mt-4 space-y-3">
              {executions.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-sm text-center text-muted-foreground">
                      Sin ejecuciones registradas
                    </p>
                  </CardContent>
                </Card>
              ) : (
                executions.map((exec) => (
                  <Card key={exec.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ambiente</span>
                          <Badge variant="outline">{exec.ambiente}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Inicio</span>
                          <span className="font-mono text-xs">
                            {formatDate(exec.fecha_inicio)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Fin</span>
                          <span className="font-mono text-xs">
                            {formatDate(exec.fecha_fin)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Resultado</span>
                          <Badge variant="secondary">{exec.resultado}</Badge>
                        </div>
                        {exec.url_reporte && (
                          <div className="pt-2">
                            <a
                              href={exec.url_reporte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver reporte
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* HISTORY TAB */}
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="py-8">
                  <p className="text-sm text-center text-muted-foreground">
                    Historial de cambios disponible próximamente
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
