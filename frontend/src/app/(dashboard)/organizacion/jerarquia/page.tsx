'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Badge, PageHeader, PageWrapper, Skeleton, Card, CardContent } from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import { useDireccions } from '@/hooks/useDireccions';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { cn } from '@/lib/utils';
import type { Repositorio } from '@/lib/schemas/repositorio.schema';

const LEVEL = {
  direccion: 'Dirección',
  subdireccion: 'Subdirección',
  gerencia: 'Gerencia',
  organizacion: 'Organización',
  celula: 'Célula',
} as const;

type NodeKind = keyof typeof LEVEL;

type TreeNode = {
  kind: NodeKind;
  id: string;
  nombre: string;
  responsable: string;
  href: string;
  children: TreeNode[];
};

function countReposCel(celId: string, repos: { celula_id?: string | null }[]) {
  return repos.filter((r) => r.celula_id === celId).length;
}

function countOrphanReposOrg(orgId: string, repos: { organizacion_id: string; celula_id?: string | null }[]) {
  return repos.filter((r) => r.organizacion_id === orgId && (r.celula_id == null || r.celula_id === '')).length;
}

function repoCountForNode(node: TreeNode, repos: Repositorio[]): number {
  if (node.kind === 'celula') return countReposCel(node.id, repos);
  if (node.kind === 'organizacion') {
    const fromCels = node.children.reduce(
      (sum, ch) => (ch.kind === 'celula' ? sum + countReposCel(ch.id, repos) : sum),
      0,
    );
    return fromCels + countOrphanReposOrg(node.id, repos);
  }
  return node.children.reduce((sum, ch) => sum + repoCountForNode(ch, repos), 0);
}

function TreeRows2({
  node,
  depth,
  expanded,
  toggle,
  repos,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  repos: Repositorio[];
}) {
  const key = `${node.kind}:${node.id}`;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(key);
  const selfCount = repoCountForNode(node, repos);
  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/40">
        <td className="py-2 pl-1 align-middle" style={{ paddingLeft: `${8 + depth * 16}px` }}>
          <div className="flex min-w-0 items-center gap-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(key)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-expanded={isOpen}
              >
                <ChevronRight
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
                />
              </button>
            ) : (
              <span className="inline-block w-7" />
            )}
            <Link href={node.href} className="min-w-0 truncate font-medium text-primary hover:underline">
              {node.nombre}
            </Link>
          </div>
        </td>
        <td className="px-1 py-2 align-middle">
          <Badge variant="outline" className="whitespace-nowrap text-[10px]">
            {LEVEL[node.kind]}
          </Badge>
        </td>
        <td
          className="max-w-[180px] truncate px-1 py-2 text-sm text-muted-foreground"
          title={node.responsable}
        >
          {node.responsable}
        </td>
        <td className="w-24 px-1 py-2 text-right text-sm tabular-nums text-muted-foreground">
          {selfCount}
        </td>
        <td className="w-24 px-1 py-2 text-right text-sm text-muted-foreground">—</td>
      </tr>
      {hasChildren &&
        isOpen &&
        node.children.map((ch) => (
          <TreeRows2
            key={`${ch.kind}-${ch.id}`}
            node={ch}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            repos={repos}
          />
        ))}
    </>
  );
}

export default function OrganizacionJerarquiaPage() {
  const d = useDireccions();
  const s = useSubdireccions();
  const g = useGerencias();
  const o = useOrganizacions();
  const c = useCelulas();
  const r = useRepositorios();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((k: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }, []);

  const tree: TreeNode[] = useMemo(() => {
    const dir = d.data ?? [];
    const sub = s.data ?? [];
    const ger = g.data ?? [];
    const org = o.data ?? [];
    const cel = c.data ?? [];
    return dir
      .map((direccion) => {
        const subs = sub
          .filter((x) => x.direccion_id === direccion.id)
          .map((subd) => {
            const gers = ger
              .filter((x) => x.subdireccion_id === subd.id)
              .map((gerencia) => {
                const orgs = org
                  .filter((x) => x.gerencia_id === gerencia.id)
                  .map((organizacion) => {
                    const cels = cel
                      .filter((x) => x.organizacion_id === organizacion.id)
                      .map((celula) => ({
                        kind: 'celula' as const,
                        id: celula.id,
                        nombre: celula.nombre,
                        responsable: celula.tipo,
                        href: '/celulas',
                        children: [] as TreeNode[],
                      }));
                    return {
                      kind: 'organizacion' as const,
                      id: organizacion.id,
                      nombre: organizacion.nombre,
                      responsable: organizacion.responsable ?? '—',
                      href: '/organizacions',
                      children: cels,
                    };
                  });
                return {
                  kind: 'gerencia' as const,
                  id: gerencia.id,
                  nombre: gerencia.nombre,
                  responsable: '—',
                  href: '/gerencias',
                  children: orgs,
                };
              });
            return {
              kind: 'subdireccion' as const,
              id: subd.id,
              nombre: subd.nombre,
              responsable: subd.director_nombre ?? '—',
              href: '/subdireccions',
              children: gers,
            };
          });
        return {
          kind: 'direccion' as const,
          id: direccion.id,
          nombre: direccion.nombre,
          responsable: '—',
          href: '/direccions',
          children: subs,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [d.data, s.data, g.data, o.data, c.data]);

  const loading = d.isLoading || s.isLoading || g.isLoading || o.isLoading || c.isLoading || r.isLoading;
  const repos = r.data ?? [];

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader title="Organización — Jerarquía" description="Cargando estructura…" />
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-12 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Organización — Jerarquía"
        description="Vista de árbol: Dirección → Subdirección → Gerencia → Organización → Célula. Los totales de repositorio se acumulan por rama (célula + sin célula en la organización). El score de madurez requiere métrica de producto (columna reservada)."
      />
      <Card>
        <CardContent className="p-0 sm:p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="py-2 pl-1">Nombre</th>
                  <th className="w-32 px-1 py-2">Nivel</th>
                  <th className="w-40 px-1 py-2">Responsable</th>
                  <th className="w-24 px-1 py-2 text-right">Repos</th>
                  <th className="w-28 px-1 py-2 text-right">Madurez</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((node) => (
                  <TreeRows2
                    key={`${node.kind}-${node.id}`}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    toggle={toggle}
                    repos={repos}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {tree.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No hay nodos. Crea al menos una dirección.</p>
      )}
    </PageWrapper>
  );
}
