'use client';

import { useMemo, useState } from 'react';

import { SidePanel } from '@/components/charts';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageWrapper,
  Progress,
  Select,
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
} from '@/hooks/useOkrMbo';
import { getSemaforoBadgeClass, getSemaforoLabel, getSemaforoProgressClass } from '@/lib/okr/semaforo';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function OkrEquipoPage() {
  const [quarter, setQuarter] = useState('Q1');
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string | null>(null);

  const { data: users } = useAdminUsers({ page_size: 200 });
  const { data: planes = [] } = useOkrPlanes();
  const { data: compromisos = [] } = useOkrCompromisosData();
  const { data: subcompromisos = [] } = useOkrSubcompromisosData();
  const { data: revisiones = [] } = useOkrRevisionesData({ quarter });

  const teamRows = useMemo(() => {
    return planes.map((plan) => {
      const compromisosPlan = compromisos.filter((item) => item.plan_id === plan.id);
      const compromisoIds = new Set(compromisosPlan.map((item) => item.id));
      const subcompromisosPlan = subcompromisos.filter((item) => compromisoIds.has(item.compromiso_id));
      const subIds = new Set(subcompromisosPlan.map((item) => item.id));
      const revisionesPlan = revisiones.filter((item) => subIds.has(item.subcompromiso_id));
      const total = revisionesPlan.length;
      const avg = total
        ? revisionesPlan.reduce((acc, item) => acc + (item.avance_validado ?? item.avance_reportado), 0) / total
        : 0;
      return {
        colaboradorId: plan.colaborador_id,
        planId: plan.id,
        quarter,
        objetivos: compromisosPlan.length,
        subcompromisos: subcompromisosPlan.length,
        score: avg,
      };
    });
  }, [planes, compromisos, subcompromisos, revisiones, quarter]);

  const selectedDetail = teamRows.filter((row) => row.colaboradorId === selectedColaboradorId);
  const selectedCompromisos = useMemo(() => {
    if (!selectedDetail.length) return [];
    const planIds = new Set(selectedDetail.map((item) => item.planId));
    return compromisos.filter((item) => planIds.has(item.plan_id));
  }, [selectedDetail, compromisos]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Mi Equipo"
        description="Vista coordinador con seguimiento por colaborador y semaforo homologado."
      >
        <div className="w-32">
          <Select
            value={quarter}
            onChange={(event) => setQuarter(event.target.value)}
            options={QUARTERS.map((value) => ({ value, label: value }))}
          />
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Semaforo por colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Objetivos</TableHead>
                <TableHead>Subcompromisos</TableHead>
                <TableHead>Score global</TableHead>
                <TableHead>Semaforo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamRows.map((row) => {
                const user = users?.items.find((entry) => entry.id === row.colaboradorId);
                return (
                  <TableRow
                    key={`${row.planId}-${row.colaboradorId}`}
                    onClick={() => setSelectedColaboradorId(row.colaboradorId)}
                    className="cursor-pointer"
                  >
                    <TableCell>{user?.full_name || user?.username || row.colaboradorId}</TableCell>
                    <TableCell>{row.objetivos}</TableCell>
                    <TableCell>{row.subcompromisos}</TableCell>
                    <TableCell className="space-y-2">
                      <div>{row.score.toFixed(1)}%</div>
                      <Progress value={row.score} className={`h-2 ${getSemaforoProgressClass(row.score)}`} />
                    </TableCell>
                    <TableCell>
                      <Badge className={getSemaforoBadgeClass(row.score)}>
                        {getSemaforoLabel(row.score)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SidePanel
        isOpen={Boolean(selectedColaboradorId)}
        onClose={() => setSelectedColaboradorId(null)}
        title={`Detalle colaborador ${quarter}`}
        width="md"
      >
        <div className="space-y-3">
          {selectedCompromisos.map((compromiso) => (
            <div key={compromiso.id} className="rounded-lg border border-border p-3">
              <div className="text-sm font-medium">{compromiso.nombre_objetivo}</div>
              <div className="text-xs text-muted-foreground">{compromiso.descripcion || 'Sin descripcion'}</div>
            </div>
          ))}
        </div>
      </SidePanel>
    </PageWrapper>
  );
}
