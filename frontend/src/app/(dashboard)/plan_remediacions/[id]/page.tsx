'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Link2, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Input,
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  useLinkPlanVulnerabilidad,
  usePlanRemediacion,
  usePlanRemediacionVulnerabilidades,
  useUnlinkPlanVulnerabilidad,
} from '@/hooks/usePlanRemediacions';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import { extractErrorMessage, formatDate } from '@/lib/utils';

export default function PlanRemediacionDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : undefined;
  const planQuery = usePlanRemediacion(id);
  const vulnsQuery = usePlanRemediacionVulnerabilidades(id);
  const linkMut = useLinkPlanVulnerabilidad();
  const unlinkMut = useUnlinkPlanVulnerabilidad();
  const [draftVulnId, setDraftVulnId] = useState('');

  const plan = planQuery.data;
  const vulns = vulnsQuery.data ?? [];

  const onLink = async () => {
    if (!id || !draftVulnId.trim()) {
      toast.error('Indica el UUID del hallazgo');
      return;
    }
    try {
      await linkMut.mutateAsync({ planId: id, vulnerabilidadId: draftVulnId.trim() });
      toast.success('Hallazgo vinculado');
      setDraftVulnId('');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'No se pudo vincular'));
    }
  };

  const onUnlink = async (vulnId: string) => {
    if (!id) return;
    try {
      await unlinkMut.mutateAsync({ planId: id, vulnerabilidadId: vulnId });
      toast.success('Vínculo eliminado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'No se pudo desvincular'));
    }
  };

  if (planQuery.isLoading) {
    return (
      <PageWrapper className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageWrapper>
    );
  }

  if (!plan) {
    return (
      <PageWrapper className="p-6">
        <p className="text-muted-foreground">Plan no encontrado o sin acceso.</p>
        <Link
          href="/plan_remediacions"
          className="mt-4 inline-block text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Volver al listado
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/plan_remediacions"
          className="inline-flex items-center justify-center rounded-lg py-1.5 px-3 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Planes
        </Link>
      </div>
      <PageHeader title={plan.descripcion.slice(0, 120)} description={`Responsable: ${plan.responsable} · Estado: ${plan.estado}`} />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="vulns">Hallazgos vinculados ({vulns.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Fecha límite:</span> {formatDate(plan.fecha_limite)}
              </p>
              <p>
                <span className="text-muted-foreground">Auditoría:</span>{' '}
                <span className="font-mono text-xs">{plan.auditoria_id}</span>
              </p>
              <div>
                <span className="text-muted-foreground">Acciones recomendadas</span>
                <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3">{plan.acciones_recomendadas}</p>
              </div>
            </CardContent>
          </Card>
          <EntityCustomFieldsCard entityType="plan_remediacion" entityId={plan.id} />
        </TabsContent>
        <TabsContent value="vulns" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" />
                Vincular hallazgo (UUID)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium" htmlFor="vuln-id">
                  ID de vulnerabilidad
                </label>
                <Input
                  id="vuln-id"
                  placeholder="uuid del hallazgo (misma cuenta)"
                  value={draftVulnId}
                  onChange={(e) => setDraftVulnId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <Button type="button" onClick={() => void onLink()} disabled={linkMut.isPending}>
                {linkMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vincular
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {vulnsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : vulns.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Sin hallazgos vinculados aún.</p>
              ) : (
                <DataTable>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableTh>Hallazgo</DataTableTh>
                      <DataTableTh>Severidad</DataTableTh>
                      <DataTableTh>Estado</DataTableTh>
                      <DataTableTh>Fuente</DataTableTh>
                      <DataTableTh>SLA</DataTableTh>
                      <DataTableTh className="w-20" />
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {vulns.map((v) => (
                      <DataTableRow key={v.id}>
                        <DataTableCell className="max-w-xs">
                          <span className="font-medium">{v.titulo}</span>
                          <div className="font-mono text-[10px] text-muted-foreground">{v.id}</div>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant="outline">{v.severidad}</Badge>
                        </DataTableCell>
                        <DataTableCell>{v.estado}</DataTableCell>
                        <DataTableCell>{v.fuente}</DataTableCell>
                        <DataTableCell className="text-xs text-muted-foreground">
                          {v.fecha_limite_sla ? formatDate(v.fecha_limite_sla) : '—'}
                        </DataTableCell>
                        <DataTableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void onUnlink(v.id)}
                            disabled={unlinkMut.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
