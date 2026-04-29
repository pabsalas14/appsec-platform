'use client';

import { FormEvent, useMemo, useState } from 'react';

import {
  useAnalyzeCodeSecurityReview,
  useCodeSecurityReviews,
  useCreateCodeSecurityReview,
  useCreateOrgBatchCodeSecurityReview,
  useReviewEvents,
  useReviewFindings,
  useReviewProgress,
  useReviewReport,
} from '@/hooks/useCodeSecurityReviews';

export default function CodeSecurityReviewsPage() {
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [orgSlug, setOrgSlug] = useState('');
  const [batchTitle, setBatchTitle] = useState('');

  const { data, isLoading, error } = useCodeSecurityReviews();
  const createReview = useCreateCodeSecurityReview();
  const createBatch = useCreateOrgBatchCodeSecurityReview();
  const analyze = useAnalyzeCodeSecurityReview();
  const progress = useReviewProgress(selectedReviewId ?? undefined);
  const findings = useReviewFindings(selectedReviewId ?? undefined);
  const events = useReviewEvents(selectedReviewId ?? undefined);
  const report = useReviewReport(selectedReviewId ?? undefined);

  const selectedReview = useMemo(
    () => data?.find((item) => item.id === selectedReviewId) ?? null,
    [data, selectedReviewId]
  );

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading code_security_reviews</div>;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createReview.mutate({
      titulo,
      estado: 'PENDING',
      descripcion: 'Creado desde dashboard SCR',
      progreso: 0,
      rama_analizar: branch,
      url_repositorio: repoUrl,
      scan_mode: 'PUBLIC_URL',
      repositorio_id: null,
    });
    setTitulo('');
    setRepoUrl('');
  };

  const onCreateBatch = (e: FormEvent) => {
    e.preventDefault();
    createBatch.mutate({
      github_org_slug: orgSlug,
      titulo: batchTitle,
      rama_analizar: branch,
    });
    setOrgSlug('');
    setBatchTitle('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Code Security Reviews</h1>
        <p className="text-sm text-muted-foreground">Inspector + Detective + Fiscal con enfoque en malicia.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-2 md:grid-cols-4 border rounded p-3">
        <input
          className="border rounded px-2 py-1"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="https://github.com/org/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
        />
        <input className="border rounded px-2 py-1" value={branch} onChange={(e) => setBranch(e.target.value)} />
        <button className="border rounded px-3 py-1" type="submit" disabled={createReview.isPending}>
          Crear revisión
        </button>
      </form>

      <form onSubmit={onCreateBatch} className="grid gap-2 md:grid-cols-4 border rounded p-3">
        <input
          className="border rounded px-2 py-1"
          placeholder="org github"
          value={orgSlug}
          onChange={(e) => setOrgSlug(e.target.value)}
          required
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="Título lote ORG"
          value={batchTitle}
          onChange={(e) => setBatchTitle(e.target.value)}
          required
        />
        <input className="border rounded px-2 py-1" value={branch} onChange={(e) => setBranch(e.target.value)} />
        <button className="border rounded px-3 py-1" type="submit" disabled={createBatch.isPending}>
          Crear lote ORG
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <ul className="space-y-2">
          {data?.map((item) => (
            <li key={item.id} className="border rounded px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button className="font-medium text-left" onClick={() => setSelectedReviewId(item.id)}>
                  {item.titulo}
                </button>
                <button
                  className="border rounded px-2 py-0.5 text-xs"
                  onClick={() => analyze.mutate(item.id)}
                  disabled={analyze.isPending}
                >
                  Analizar
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                {item.estado} - {item.progreso}% - {item.url_repositorio ?? 'sin repo'}
              </div>
              <a className="text-xs underline" href={`/api/v1/code_security_reviews/${item.id}/export?format=json`}>
                Exportar JSON
              </a>
            </li>
          ))}
        </ul>

        <div className="border rounded p-3 space-y-2">
          {!selectedReview && <div className="text-sm text-muted-foreground">Selecciona una revisión.</div>}
          {selectedReview && (
            <>
              <div className="font-medium">{selectedReview.titulo}</div>
              <div className="text-xs">
                Progreso: {progress.data?.progress ?? selectedReview.progreso}% ({progress.data?.status ?? selectedReview.estado})
              </div>
              <div className="text-xs">Hallazgos: {findings.data?.length ?? 0}</div>
              <div className="text-xs">Eventos forenses: {events.data?.length ?? 0}</div>
              <div className="text-xs">Reporte: {report.data ? 'Generado' : 'Pendiente'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
