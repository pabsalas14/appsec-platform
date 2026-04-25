'use client';

import { ArrowDownAZ, ArrowUpAZ, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Input,
  PageHeader,
  PageWrapper,
} from '@/components/ui';
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { useSesionThreatModelings } from '@/hooks/useSesionThreatModelings';
import { formatDate } from '@/lib/utils';

export default function SesionThreatModelingsPage() {
  const { data, isLoading, error } = useSesionThreatModelings();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.estado.toLowerCase().includes(n) ||
        (r.contexto && r.contexto.toLowerCase().includes(n)) ||
        (r.id && r.id.toLowerCase().includes(n)),
    );
  }, [data, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const ta = new Date(a.fecha).getTime();
      const tb = new Date(b.fecha).getTime();
      const cmp = ta - tb;
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [filtered, sortDesc]);

  const paged = useClientPagedList(sorted, [q, sortDesc]);

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <PageHeader title="Sesiones de threat modeling" description="Cargando…" />
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive">Error al cargar las sesiones de threat modeling.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Sesiones de threat modeling"
        description="Listado con búsqueda y paginación. Abre una sesión para amenazas e IA asistida."
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="max-w-md flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Estado, contexto, id…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
              {sortDesc ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}
              Fecha: {sortDesc ? 'reciente primero' : 'antigua primero'}
            </Button>
          </div>

          {paged.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Sesión</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Contexto</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {paged.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>
                      <div className="font-medium">Sesión {formatDate(item.fecha)}</div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.id}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{item.estado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="max-w-md text-sm text-muted-foreground">
                      {item.contexto ? (
                        <span className="line-clamp-2">{item.contexto}</span>
                      ) : (
                        '—'
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <Link
                        href={`/sesion_threat_modelings/${item.id}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Abrir
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
          {paged.total === 0 && <p className="text-sm text-muted-foreground">No hay sesiones que coincidan.</p>}

          <CatalogPaginationBar
            page={paged.page}
            pageCount={paged.pageCount}
            total={paged.total}
            from={paged.from}
            to={paged.to}
            pageSize={paged.pageSize}
            onPageChange={paged.setPage}
            onPageSizeChange={(n) => {
              paged.setPageSize(n);
              paged.setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
