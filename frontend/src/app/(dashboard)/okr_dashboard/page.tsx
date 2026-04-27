'use client';

import { useMemo, useState } from 'react';
import { Building2, Target, User, Waypoints } from 'lucide-react';

import { SidePanel } from '@/components/charts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageWrapper,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import {
  useOkrCompromisosData,
  useOkrPlanes,
  useOkrRevisionesData,
  useOkrSubcompromisosData,
  useWorkflowRevisionAction,
} from '@/hooks/useOkrMbo';
import { getSemaforoBadgeClass, getSemaforoLabel, getSemaforoProgressClass } from '@/lib/okr/semaforo';

type DrillLevel = 'N0' | 'N1' | 'N2' | 'N3';

export default function OkrDashboardPage() {
  const [level, setLevel] = useState<DrillLevel>('N0');
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string | null>(null);
  const [selectedCompromisoId, setSelectedCompromisoId] = useState<string | null>(null);
  const [selectedSubcompromisoId, setSelectedSubcompromisoId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const workflow = useWorkflowRevisionAction();
  const { data: users } = useAdminUsers({ page_size: 200 });
  const { data: planes = [] } = useOkrPlanes();
  const { data: compromisos = [] } = useOkrCompromisosData();
  const { data: subcompromisos = [] } = useOkrSubcompromisosData();
  const { data: revisiones = [] } = useOkrRevisionesData();

  const globalScore = useMemo(() => {
    if (!revisiones.length) return 0;
    return revisiones.reduce((acc, item) => acc + (item.avance_validado ?? item.avance_reportado), 0) / revisiones.length;
  }, [revisiones]);

  const rowsN1 = useMemo(() => {
    return planes.map((plan) => {
      const user = users?.items.find((item) => item.id === plan.colaborador_id);
      const compromisosPlan = compromisos.filter((item) => item.plan_id === plan.id);
      const compromisoIds = new Set(compromisosPlan.map((item) => item.id));
      const subPlan = subcompromisos.filter((item) => compromisoIds.has(item.compromiso_id));
      const subIds = new Set(subPlan.map((item) => item.id));
      const revs = revisiones.filter((item) => subIds.has(item.subcompromiso_id));
      const score = revs.length
        ? revs.reduce((acc, item) => acc + (item.avance_validado ?? item.avance_reportado), 0) / revs.length
        : 0;
      return {
        colaboradorId: plan.colaborador_id,
        colaborador: user?.full_name || user?.username || plan.colaborador_id,
        score,
        objetivos: compromisosPlan.length,
      };
    });
  }, [planes, users?.items, compromisos, subcompromisos, revisiones]);

  const rowsN2 = useMemo(() => {
    if (!selectedColaboradorId) return [];
    const planIds = new Set(planes.filter((item) => item.colaborador_id === selectedColaboradorId).map((item) => item.id));
    return compromisos
      .filter((item) => planIds.has(item.plan_id))
      .map((item) => {
        const sub = subcompromisos.filter((entry) => entry.compromiso_id === item.id);
        const subIds = new Set(sub.map((entry) => entry.id));
        const revs = revisiones.filter((entry) => subIds.has(entry.subcompromiso_id));
        const score = revs.length
          ? revs.reduce((acc, entry) => acc + (entry.avance_validado ?? entry.avance_reportado), 0) / revs.length
          : 0;
        return { ...item, score, subTotal: sub.length };
      });
  }, [selectedColaboradorId, planes, compromisos, subcompromisos, revisiones]);

  const rowsN3 = useMemo(() => {
    if (!selectedCompromisoId) return [];
    return subcompromisos
      .filter((item) => item.compromiso_id === selectedCompromisoId)
      .map((item) => {
        const revs = revisiones.filter((entry) => entry.subcompromiso_id === item.id);
        const score = revs.length
          ? revs.reduce((acc, entry) => acc + (entry.avance_validado ?? entry.avance_reportado), 0) / revs.length
          : 0;
        return { ...item, score };
      });
  }, [selectedCompromisoId, subcompromisos, revisiones]);

  const selectedRevision =
    revisiones.find((item) => item.subcompromiso_id === selectedSubcompromisoId) ?? null;

  async function quickApprove() {
    if (!selectedRevision) return;
    try {
      await workflow.mutateAsync({
        revisionId: selectedRevision.id,
        action: 'aprobar',
      });
      setStatusMessage('Aprobacion enviada.');
    } catch {
      setStatusMessage('No se pudo aprobar con los endpoints actuales de workflow.');
    }
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard Ejecutivo OKR/MBO"
        description="Drill-down multinivel N0 a N3 con panel lateral para evaluacion."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer" onClick={() => setLevel('N0')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nivel N0</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Building2 className="h-4 w-4" /> Global
            </div>
            <div className="text-2xl font-semibold">{globalScore.toFixed(1)}%</div>
            <Badge className={getSemaforoBadgeClass(globalScore)}>{getSemaforoLabel(globalScore)}</Badge>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setLevel('N1')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nivel N1</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Colaborador
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setLevel('N2')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nivel N2</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" /> Compromiso
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setLevel('N3')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nivel N3</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
            <Waypoints className="h-4 w-4" /> Subcompromiso
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Heatmap / tabla clickable ({level})</CardTitle>
        </CardHeader>
        <CardContent>
          {level === 'N0' && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Vista global consolidada</div>
              <Progress value={globalScore} className={`h-3 ${getSemaforoProgressClass(globalScore)}`} />
            </div>
          )}

          {level === 'N1' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Objetivos</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsN1.map((row) => (
                  <TableRow
                    key={row.colaboradorId}
                    onClick={() => {
                      setSelectedColaboradorId(row.colaboradorId);
                      setLevel('N2');
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell>{row.colaborador}</TableCell>
                    <TableCell>{row.objetivos}</TableCell>
                    <TableCell>
                      <Badge className={getSemaforoBadgeClass(row.score)}>{row.score.toFixed(1)}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {level === 'N2' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compromiso</TableHead>
                  <TableHead>Subcompromisos</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsN2.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      setSelectedCompromisoId(row.id);
                      setLevel('N3');
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell>{row.nombre_objetivo}</TableCell>
                    <TableCell>{row.subTotal}</TableCell>
                    <TableCell>
                      <Badge className={getSemaforoBadgeClass(row.score)}>{row.score.toFixed(1)}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {level === 'N3' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcompromiso</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Semaforo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsN3.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedSubcompromisoId(row.id)}
                    className="cursor-pointer"
                  >
                    <TableCell>{row.nombre_sub_item}</TableCell>
                    <TableCell>{row.score.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={getSemaforoBadgeClass(row.score)}>{getSemaforoLabel(row.score)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SidePanel
        isOpen={Boolean(selectedSubcompromisoId)}
        onClose={() => setSelectedSubcompromisoId(null)}
        title="Panel lateral N3"
      >
        <div className="space-y-3">
          {selectedRevision ? (
            <>
              <div className="text-sm">
                Revision: {selectedRevision.quarter} - Estado {selectedRevision.estado}
              </div>
              <Button onClick={quickApprove} loading={workflow.isPending}>
                Aprobar subcompromiso
              </Button>
              {statusMessage && <div className="text-xs text-muted-foreground">{statusMessage}</div>}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No hay revision para este subcompromiso.</div>
          )}
        </div>
      </SidePanel>
    </PageWrapper>
  );
}
