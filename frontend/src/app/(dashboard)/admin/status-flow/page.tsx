'use client';

import { GitBranch, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
  PremiumPageHeader,
  Select,
} from '@/components/ui';
import { useFlujoEstatus } from '@/hooks/useFlujoEstatus';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isBackofficeUser } from '@/lib/roles';
import type { FlujoEstatus } from '@/lib/schemas/flujo_estatus.schema';

function buildGraph(flows: FlujoEstatus[], entityType: string): { nodes: Node[]; edges: Edge[] } {
  const filtered = flows.filter((f) => f.entity_type === entityType);
  const ids = new Set<string>();
  for (const f of filtered) {
    ids.add(f.from_status);
    ids.add(f.to_status);
  }
  const nodesArr = Array.from(ids).sort((a, b) => a.localeCompare(b));
  const n = Math.max(nodesArr.length, 1);
  const radius = Math.min(280, 60 + n * 28);
  const nodes: Node[] = nodesArr.map((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id,
      position: { x: 280 + radius * Math.cos(angle), y: 260 + radius * Math.sin(angle) },
      data: { label: id },
      style: { fontSize: 12 },
    };
  });
  const edges: Edge[] = filtered.map((f) => ({
    id: String(f.id),
    source: f.from_status,
    target: f.to_status,
    label: f.allowed ? 'permitida' : 'bloqueada',
    animated: f.requires_approval,
    style: { stroke: f.allowed ? '#16a34a' : '#dc2626' },
    markerEnd: { type: MarkerType.ArrowClosed, color: f.allowed ? '#16a34a' : '#dc2626' },
  }));
  return { nodes, edges };
}

export default function AdminStatusFlowPage() {
  const { data: user } = useCurrentUser();
  const allowed = isBackofficeUser(user?.role);
  const { data: flows = [], isLoading } = useFlujoEstatus();
  const entityTypes = useMemo(
    () => [...new Set(flows.map((f) => f.entity_type))].sort((a, b) => a.localeCompare(b)),
    [flows],
  );
  const [entityType, setEntityType] = useState('vulnerabilidad');

  useEffect(() => {
    if (entityTypes.length && !entityTypes.includes(entityType)) {
      setEntityType(entityTypes[0]);
    }
  }, [entityTypes, entityType]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildGraph(flows, entityType),
    [flows, entityType],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  if (!allowed) {
    return (
      <PageWrapper className="p-6">
        <p className="text-sm text-muted-foreground">No tienes permisos para esta sección.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Administración"
        title="Status flow (FlujoEstatus)"
        description="Vista de grafo de transiciones configuradas. Las reglas se validan en runtime al cambiar estado (p. ej. vulnerabilidades)."
        icon={GitBranch}
        action={
          <Link
            href="/flujos_estatus"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 text-sm font-medium backdrop-blur-sm hover:bg-white/[0.08]"
          >
            Editar registros (CRUD)
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de entidad</CardTitle>
          <CardDescription>
            Solo se muestran transiciones del tipo seleccionado. Si no hay datos, crea filas en Flujos de estatus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entityTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin reglas `FlujoEstatus` todavía.{' '}
              <Link href="/flujos_estatus" className="text-primary underline-offset-2 hover:underline">
                Crear transiciones
              </Link>
            </p>
          ) : (
            <Select
              className="max-w-md"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              options={entityTypes.map((t) => ({ value: t, label: t }))}
            />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Mapa de transiciones</CardTitle>
          <CardDescription>Nodos = estados; flechas = reglas (etiqueta = permitida / bloqueada).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-[520px] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Cargando…
            </div>
          ) : (
            <div className="h-[560px] w-full border-t border-border/60 bg-muted/20">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <Controls />
                <MiniMap zoomable pannable />
              </ReactFlow>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
