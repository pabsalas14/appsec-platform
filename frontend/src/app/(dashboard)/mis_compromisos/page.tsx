'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';

import { SidePanel } from '@/components/charts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
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
  Textarea,
} from '@/components/ui';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  useOkrCompromisosData,
  useOkrEvidenciasData,
  useOkrPlanes,
  useOkrRevisionesData,
  useOkrSubcompromisosData,
  useSaveRevision,
  useUpdateOkrPlanEvaluador,
  useUploadAndLinkOkrEvidence,
  useWorkflowRevisionAction,
  type WorkflowAction,
} from '@/hooks/useOkrMbo';
import { getSemaforoBadgeClass, getSemaforoLabel, getSemaforoProgressClass } from '@/lib/okr/semaforo';

type RevisionFormState = {
  avance_validado: string;
  feedback_evaluador: string;
  comentario_colaborador: string;
  evidencia_url: string;
  evidencia_tipo: string;
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const EMPTY_FORM: RevisionFormState = {
  avance_validado: '',
  feedback_evaluador: '',
  comentario_colaborador: '',
  evidencia_url: '',
  evidencia_tipo: 'url',
};

export default function MisCompromisosPage() {
  const [quarter, setQuarter] = useState('Q1');
  const [selectedSubcompromisoId, setSelectedSubcompromisoId] = useState<string | null>(null);
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [form, setForm] = useState<RevisionFormState>(EMPTY_FORM);

  const { data: me } = useCurrentUser();
  const { data: users } = useAdminUsers({ page_size: 200 });

  const { data: planes = [], isLoading: isLoadingPlanes } = useOkrPlanes({
    colaborador_id: me?.id,
  });
  const { data: compromisos = [] } = useOkrCompromisosData();
  const { data: subcompromisos = [] } = useOkrSubcompromisosData();
  const { data: revisiones = [] } = useOkrRevisionesData({ quarter });
  const { data: evidencias = [] } = useOkrEvidenciasData();

  const updateEvaluador = useUpdateOkrPlanEvaluador();
  const saveRevision = useSaveRevision();
  const runWorkflow = useWorkflowRevisionAction();
  const uploadEvidence = useUploadAndLinkOkrEvidence();

  const myCompromisos = useMemo(() => {
    const planIds = new Set(planes.map((p) => p.id));
    return compromisos.filter((item) => planIds.has(item.plan_id));
  }, [planes, compromisos]);

  const mySubcompromisos = useMemo(() => {
    const compromisoIds = new Set(myCompromisos.map((item) => item.id));
    return subcompromisos.filter((item) => compromisoIds.has(item.compromiso_id));
  }, [myCompromisos, subcompromisos]);

  const selectedSubcompromiso = mySubcompromisos.find((item) => item.id === selectedSubcompromisoId) ?? null;
  const selectedRevision =
    revisiones.find(
      (item) => item.subcompromiso_id === selectedSubcompromisoId && item.quarter.toUpperCase() === quarter,
    ) ?? null;
  const selectedEvidencias = evidencias.filter((item) => item.revision_q_id === selectedRevision?.id);

  async function handleWorkflow(action: WorkflowAction) {
    if (!selectedRevision) return;
    try {
      await runWorkflow.mutateAsync({
        revisionId: selectedRevision.id,
        action,
        payload: {
          feedback_evaluador: form.feedback_evaluador || undefined,
          comentario_colaborador: form.comentario_colaborador || undefined,
          quarter,
        },
      });
      setStatusMessage(`Accion "${action}" ejecutada para ${quarter}.`);
    } catch {
      setStatusMessage(
        'No fue posible ejecutar la accion de workflow con los endpoints actuales. Revisa la implementacion backend.',
      );
    }
  }

  async function handleSaveRevision() {
    if (!selectedRevision) return;
    await saveRevision.mutateAsync({
      id: selectedRevision.id,
      avance_validado: form.avance_validado ? Number(form.avance_validado) : null,
      feedback_evaluador: form.feedback_evaluador || null,
      comentario_colaborador: form.comentario_colaborador || null,
      quarter,
    });
    setStatusMessage('Revision actualizada.');
  }

  async function handleUploadEvidence() {
    if (!selectedRevision) return;
    await uploadEvidence.mutateAsync({
      revision_q_id: selectedRevision.id,
      tipo_evidencia: form.evidencia_tipo,
      file: selectedEvidenceFile,
      url_evidencia: form.evidencia_url || undefined,
      nombre_archivo: selectedEvidenceFile?.name,
    });
    setSelectedEvidenceFile(null);
    setForm((prev) => ({ ...prev, evidencia_url: '' }));
    setStatusMessage('Evidencia vinculada al subcompromiso y quarter.');
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Mis Compromisos"
        description="Vista colaborador con revisiones trimestrales, semaforos unificados y evidencias."
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
          <CardTitle>Jerarquia de evaluador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {planes.map((plan) => (
            <div key={plan.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-3">
              <div className="text-sm">
                <div className="font-medium">Plan {plan.ano}</div>
                <div className="text-muted-foreground">Estado: {plan.estado}</div>
              </div>
              <Select
                value={plan.evaluador_id}
                options={(users?.items ?? []).map((user) => ({
                  value: user.id,
                  label: `${user.full_name || user.username} (${user.role})`,
                }))}
                onChange={(event) =>
                  updateEvaluador.mutate({
                    planId: plan.id,
                    evaluador_id: event.target.value,
                  })
                }
              />
              <div className="text-xs text-muted-foreground flex items-center">
                Configurable por UI para jerarquia evaluador.
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subcompromisos del colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPlanes ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compromiso</TableHead>
                  <TableHead>Subcompromiso</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Avance validado</TableHead>
                  <TableHead>Semaforo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubcompromisos.map((item) => {
                  const compromiso = myCompromisos.find((entry) => entry.id === item.compromiso_id);
                  const revision = revisiones.find(
                    (entry) => entry.subcompromiso_id === item.id && entry.quarter.toUpperCase() === quarter,
                  );
                  const avance = revision?.avance_validado ?? revision?.avance_reportado ?? 0;
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => {
                        setSelectedSubcompromisoId(item.id);
                        setForm({
                          avance_validado: revision?.avance_validado ? String(revision.avance_validado) : '',
                          feedback_evaluador: revision?.feedback_evaluador ?? '',
                          comentario_colaborador: revision?.comentario_colaborador ?? '',
                          evidencia_url: '',
                          evidencia_tipo: 'url',
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>{compromiso?.nombre_objetivo ?? 'N/A'}</TableCell>
                      <TableCell>{item.nombre_sub_item}</TableCell>
                      <TableCell>{quarter}</TableCell>
                      <TableCell className="space-y-2">
                        <div>{avance.toFixed(1)}%</div>
                        <Progress
                          value={avance}
                          className={`h-2 ${getSemaforoProgressClass(avance)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={getSemaforoBadgeClass(avance)}>
                          {getSemaforoLabel(avance)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SidePanel
        isOpen={Boolean(selectedSubcompromiso)}
        onClose={() => setSelectedSubcompromisoId(null)}
        title={`Evaluacion de subcompromiso ${quarter}`}
        width="lg"
      >
        {selectedSubcompromiso && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3">
              <div className="text-sm font-medium">{selectedSubcompromiso.nombre_sub_item}</div>
              <div className="text-xs text-muted-foreground">{selectedSubcompromiso.resultado_esperado}</div>
            </div>

            {selectedRevision ? (
              <>
                <Input
                  label="Avance validado (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={form.avance_validado}
                  onChange={(event) => setForm((prev) => ({ ...prev, avance_validado: event.target.value }))}
                />
                <Textarea
                  label="Feedback evaluador"
                  value={form.feedback_evaluador}
                  onChange={(event) => setForm((prev) => ({ ...prev, feedback_evaluador: event.target.value }))}
                />
                <Textarea
                  label="Comentario colaborador"
                  value={form.comentario_colaborador}
                  onChange={(event) => setForm((prev) => ({ ...prev, comentario_colaborador: event.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveRevision} loading={saveRevision.isPending}>
                    Guardar revision
                  </Button>
                  <Button variant="outline" onClick={() => handleWorkflow('aprobar')} loading={runWorkflow.isPending}>
                    Aprobar
                  </Button>
                  <Button variant="outline" onClick={() => handleWorkflow('editar')} loading={runWorkflow.isPending}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => handleWorkflow('rechazar')} loading={runWorkflow.isPending}>
                    Rechazar
                  </Button>
                  <Button variant="secondary" onClick={() => handleWorkflow('cerrar_q')} loading={runWorkflow.isPending}>
                    Cerrar Q
                  </Button>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Evidencias vinculadas a subcompromiso + Q
                  </div>
                  <Input
                    label="URL de evidencia"
                    placeholder="https://..."
                    value={form.evidencia_url}
                    onChange={(event) => setForm((prev) => ({ ...prev, evidencia_url: event.target.value }))}
                  />
                  <Input
                    label="Archivo de evidencia"
                    type="file"
                    onChange={(event) => setSelectedEvidenceFile(event.target.files?.[0] ?? null)}
                  />
                  <Button onClick={handleUploadEvidence} loading={uploadEvidence.isPending}>
                    Vincular evidencia
                  </Button>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {selectedEvidencias.map((ev) => (
                      <div key={ev.id}>
                        {ev.nombre_archivo || ev.url_evidencia || 'Evidencia'} - {ev.tipo_evidencia}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No existe revision para el quarter seleccionado.
              </div>
            )}

            {statusMessage && <div className="text-xs text-muted-foreground">{statusMessage}</div>}
          </div>
        )}
      </SidePanel>
    </PageWrapper>
  );
}
