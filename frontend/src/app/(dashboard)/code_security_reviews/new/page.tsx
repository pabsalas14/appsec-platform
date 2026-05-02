'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { useAnalyzeCodeSecurityReview, useCreateCodeSecurityReview } from '@/hooks/useCodeSecurityReviews';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PageHeader,
  PageWrapper,
  Select,
  Textarea,
} from '@/components/ui';

type ScanMode = 'PUBLIC_URL' | 'REPO_TOKEN' | 'BRANCH_TARGET' | 'ORG_BATCH';
type WizardStep = 1 | 2 | 3;

type GitHubToken = {
  id: string;
  label: string;
  user: string | null;
  organizations: string[];
  repos_count: number;
};

type Repository = {
  name?: string;
  full_name?: string;
  url?: string;
  html_url?: string;
  default_branch?: string;
  visibility?: string;
};

type Branch = { name: string; is_default?: boolean };
type Envelope<T> = { status: 'success'; data: T };

const MODES: { value: ScanMode; title: string; description: string }[] = [
  { value: 'PUBLIC_URL', title: 'Público', description: 'URL pública; la rama se define en alcance.' },
  { value: 'REPO_TOKEN', title: 'Repositorio', description: 'Elige un repo privado desde un token guardado.' },
  { value: 'BRANCH_TARGET', title: 'Rama', description: 'Elige repo y rama específica desde el token.' },
  { value: 'ORG_BATCH', title: 'Organización', description: 'Elige organización y 1..N repositorios.' },
];

function repoUrl(repo: Repository): string {
  return repo.html_url ?? repo.url ?? '';
}

function repoName(repo: Repository): string {
  return repo.full_name ?? repo.name ?? repoUrl(repo);
}

export default function NewCodeSecurityReviewPage() {
  const router = useRouter();
  const createReview = useCreateCodeSecurityReview();
  const analyzeReview = useAnalyzeCodeSecurityReview();

  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState<WizardStep>(1);
  const [scanMode, setScanMode] = useState<ScanMode>('PUBLIC_URL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [tokens, setTokens] = useState<GitHubToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orgs, setOrgs] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedOrgRepos, setSelectedOrgRepos] = useState<string[]>([]);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);

  const selectedToken = useMemo(
    () => tokens.find((token) => token.id === selectedTokenId),
    [selectedTokenId, tokens]
  );
  const selectedRepo = useMemo(
    () => repos.find((repo) => repoUrl(repo) === selectedRepoUrl),
    [repos, selectedRepoUrl]
  );
  const selectedBranch = scanMode === 'REPO_TOKEN' ? selectedRepo?.default_branch ?? 'main' : branch || 'main';
  const isSubmitting = createReview.isPending || analyzeReview.isPending;

  useEffect(() => {
    async function loadTokens() {
      try {
        const response = await api.get<Envelope<{ tokens: GitHubToken[] }>>('/admin/scr/github-tokens');
        const rows = response.data.data.tokens ?? [];
        setTokens(rows);
        setSelectedTokenId(rows[0]?.id ?? '');
      } catch (error) {
        logger.error('scr.new_scan.tokens_failed', { error: String(error) });
      toast.error(getApiErrorMessage(error, 'No se pudieron cargar los tokens configurados'));
      }
    }

    void loadTokens();
  }, []);

  useEffect(() => {
    if (!selectedTokenId || scanMode === 'PUBLIC_URL') {
      setRepos([]);
      setOrgState('');
      return;
    }

    async function loadTokenScope() {
      try {
        setIsLoadingGitHub(true);
        const reposResponse = await api.get<Envelope<{ repos: Repository[] }>>(
          `/admin/scr/github-tokens/${selectedTokenId}/repos`
        );
        setRepos(reposResponse.data.data.repos ?? []);
        if (scanMode === 'ORG_BATCH') {
          const orgsResponse = await api.get<Envelope<{ orgs: string[] }>>(
            `/admin/scr/github-tokens/${selectedTokenId}/orgs`
          );
          setOrgs(orgsResponse.data.data.orgs ?? []);
        }
      } catch (error) {
        logger.error('scr.new_scan.github_scope_failed', { error: String(error), tokenId: selectedTokenId });
        toast.error(getApiErrorMessage(error, 'No se pudo cargar el alcance del token'));
      } finally {
        setIsLoadingGitHub(false);
      }
    }

    void loadTokenScope();
  }, [scanMode, selectedTokenId]);

  useEffect(() => {
    if (!selectedTokenId || !selectedRepoUrl || scanMode !== 'BRANCH_TARGET') {
      setBranches([]);
      return;
    }

    async function loadBranches() {
      try {
        setIsLoadingGitHub(true);
        const response = await api.get<Envelope<{ branches: Branch[] }>>(
          `/admin/scr/github-tokens/${selectedTokenId}/branches`,
          { params: { repo_url: selectedRepoUrl } }
        );
        const rows = response.data.data.branches ?? [];
        setBranches(rows);
        setBranch(rows.find((row) => row.is_default)?.name ?? selectedRepo?.default_branch ?? rows[0]?.name ?? 'main');
      } catch (error) {
        logger.error('scr.new_scan.branches_failed', { error: String(error), repoUrl: selectedRepoUrl });
        toast.error(getApiErrorMessage(error, 'No se pudieron cargar ramas'));
      } finally {
        setIsLoadingGitHub(false);
      }
    }

    void loadBranches();
  }, [scanMode, selectedRepo?.default_branch, selectedRepoUrl, selectedTokenId]);

  useEffect(() => {
    if (!selectedTokenId || !selectedOrg || scanMode !== 'ORG_BATCH') {
      return;
    }

    async function loadOrgRepos() {
      try {
        setIsLoadingGitHub(true);
        const response = await api.get<Envelope<{ repos: Repository[] }>>(
          `/admin/scr/github-tokens/${selectedTokenId}/orgs/${selectedOrg}/repos`
        );
        const rows = response.data.data.repos ?? [];
        setRepos(rows);
        setSelectedOrgRepos(rows.map(repoUrl).filter(Boolean));
      } catch (error) {
        logger.error('scr.new_scan.org_repos_failed', { error: String(error), org: selectedOrg });
        toast.error(getApiErrorMessage(error, 'No se pudieron cargar repositorios de la organización'));
      } finally {
        setIsLoadingGitHub(false);
      }
    }

    void loadOrgRepos();
  }, [scanMode, selectedOrg, selectedTokenId]);

  function setOrgState(nextOrg: string) {
    setSelectedOrg(nextOrg);
    setSelectedOrgRepos([]);
  }

  function canGoNext(): boolean {
    if (step === 1) return Boolean(title.trim());
    if (step === 2 && scanMode === 'PUBLIC_URL') return Boolean(publicUrl.trim());
    if (step === 2 && scanMode === 'REPO_TOKEN') return Boolean(selectedTokenId && selectedRepoUrl);
    if (step === 2 && scanMode === 'BRANCH_TARGET') return Boolean(selectedTokenId && selectedRepoUrl && branch);
    if (step === 2 && scanMode === 'ORG_BATCH') return Boolean(selectedTokenId && selectedOrg && selectedOrgRepos.length > 0);
    return true;
  }

  function toggleOrgRepo(url: string) {
    setSelectedOrgRepos((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url]
    );
  }

  async function handleSubmit() {
    if (!canGoNext()) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const scrConfig = {
        github_token_id: selectedTokenId || undefined,
        llm_provider: 'agent-assigned',
        temperature: 0.3,
        max_tokens: 4096,
      };

      if (scanMode === 'ORG_BATCH') {
        await api.post('/code_security_reviews/batch/org', {
          titulo: title.trim(),
          github_org_slug: selectedOrg,
          rama_analizar: selectedBranch,
          github_token_id: selectedTokenId,
          repo_urls: selectedOrgRepos,
          scr_config: scrConfig,
        });
        toast.success('Lote de escaneos encolado');
        router.push('/code_security_reviews');
        return;
      }

      const created = await createReview.mutateAsync({
        titulo: title.trim(),
        descripcion: description.trim() || null,
        url_repositorio: scanMode === 'PUBLIC_URL' ? publicUrl.trim() : selectedRepoUrl,
        rama_analizar: selectedBranch,
        scan_mode: scanMode,
        scr_config: scrConfig,
      });
      await analyzeReview.mutateAsync(created.id);
      toast.success('Escaneo encolado');
      router.push(`/code_security_reviews/${created.id}`);
    } catch (error) {
      logger.error('scr.new_scan.submit_failed', { error: String(error), scanMode });
      toast.error(getApiErrorMessage(error, 'No se pudo iniciar el escaneo'));
    }
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Nuevo Escaneo SCR"
        description="Flujo guiado basado en las integraciones configuradas. Los LLM se asignan en Agentes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Crear escaneo guiado</CardTitle>
          <CardDescription>
            Selecciona el tipo de escaneo y avanza en un wizard. No se ingresan tokens ni API keys en esta pantalla.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>GitHub configurado: {tokens.length} token(s) disponibles.</p>
            <p>LLM: se toma de la configuración de cada agente Inspector, Detective y Fiscal.</p>
          </div>
          <Button onClick={() => setIsOpen(true)}>Abrir wizard</Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Escaneo SCR</DialogTitle>
            <DialogDescription>
              Paso {step} de 3: {step === 1 ? 'configuración' : step === 2 ? 'alcance' : 'confirmación'}.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {(['Configuración', 'Alcance', 'Confirmación'] as const).map((label, index) => {
              const current = index + 1;
              return (
                <div
                  key={label}
                  className={`rounded-full px-3 py-2 text-center text-xs font-semibold ${
                    step >= current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {current}. {label}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                {MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setScanMode(mode.value);
                      setSelectedRepoUrl('');
                      setBranches([]);
                      setOrgState('');
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      scanMode === mode.value ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-semibold">{mode.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{mode.description}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del escaneo</Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Auditoría Q2 pagos" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {scanMode === 'PUBLIC_URL' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>URL pública del repositorio</Label>
                    <Input
                      value={publicUrl}
                      onChange={(event) => setPublicUrl(event.target.value)}
                      placeholder="https://github.com/org/repo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rama</Label>
                    <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integración GitHub configurada</Label>
                    <Select
                      value={selectedTokenId}
                      onChange={(event) => setSelectedTokenId(event.target.value)}
                      placeholder="Selecciona un token configurado"
                      options={tokens.map((token) => ({
                        value: token.id,
                        label: `${token.label} - ${token.user ?? 'sin usuario'} (${token.repos_count} repos)`,
                      }))}
                    />
                    {selectedToken && (
                      <p className="text-xs text-emerald-400">
                        Validado como {selectedToken.user ?? 'usuario desconocido'} · {selectedToken.organizations.length} orgs ·{' '}
                        {selectedToken.repos_count} repos
                      </p>
                    )}
                  </div>

                  {scanMode === 'ORG_BATCH' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Organización</Label>
                        <Select
                          value={selectedOrg}
                          onChange={(event) => setOrgState(event.target.value)}
                          placeholder="Selecciona organización"
                          options={orgs.map((org) => ({ value: org, label: org }))}
                        />
                      </div>
                      <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-border p-3">
                        {repos.map((repo) => {
                          const url = repoUrl(repo);
                          return (
                            <label
                              key={url}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                                selectedOrgRepos.includes(url) ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
                              }`}
                            >
                              <input type="checkbox" checked={selectedOrgRepos.includes(url)} onChange={() => toggleOrgRepo(url)} />
                              <span className="text-sm">{repoName(repo)}</span>
                            </label>
                          );
                        })}
                        {repos.length === 0 && (
                          <p className="p-4 text-center text-sm text-muted-foreground">
                            {isLoadingGitHub ? 'Cargando repositorios...' : 'Selecciona una organización para cargar repositorios.'}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label>Repositorio</Label>
                      <Select
                        value={selectedRepoUrl}
                        onChange={(event) => {
                          setSelectedRepoUrl(event.target.value);
                          setBranch(repos.find((repo) => repoUrl(repo) === event.target.value)?.default_branch ?? 'main');
                        }}
                        placeholder={isLoadingGitHub ? 'Cargando repos...' : 'Selecciona repositorio'}
                        options={repos.map((repo) => ({ value: repoUrl(repo), label: `${repoName(repo)} (${repo.visibility})` }))}
                      />
                    </div>
                  )}

                  {scanMode === 'BRANCH_TARGET' && (
                    <div className="space-y-2">
                      <Label>Rama</Label>
                      <Select
                        value={branch}
                        onChange={(event) => setBranch(event.target.value)}
                        placeholder="Selecciona rama"
                        options={branches.map((row) => ({
                          value: row.name,
                          label: row.is_default ? `${row.name} (default)` : row.name,
                        }))}
                      />
                    </div>
                  )}
                  {scanMode === 'ORG_BATCH' && (
                    <div className="space-y-2">
                      <Label>Rama base para el lote</Label>
                      <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
                      <p className="text-xs text-muted-foreground">
                        Se usará como rama por defecto para los repos seleccionados.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
              <SummaryRow label="Modo" value={MODES.find((mode) => mode.value === scanMode)?.title ?? scanMode} />
              <SummaryRow label="Título" value={title || 'Sin título'} />
              <SummaryRow label="Repositorio/URL" value={scanMode === 'PUBLIC_URL' ? publicUrl : selectedRepoUrl || `${selectedOrgRepos.length} repos`} />
              <SummaryRow label="Rama" value={selectedBranch} />
              <SummaryRow label="Token" value={selectedToken?.label ?? 'No aplica'} />
              <SummaryRow label="LLM" value="Asignado por agente en Agentes SCR" />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => (step === 1 ? router.push('/code_security_reviews') : setStep((step - 1) as WizardStep))}>
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            {step < 3 ? (
              <Button disabled={!canGoNext() || isLoadingGitHub} onClick={() => setStep((step + 1) as WizardStep)}>
                Siguiente
              </Button>
            ) : (
              <Button disabled={isSubmitting || !canGoNext()} onClick={handleSubmit}>
                {isSubmitting ? 'Encolando...' : 'Iniciar escaneo'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate font-medium">{value}</span>
    </div>
  );
}
