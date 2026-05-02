'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useCreateVulnerabilidad } from '@/hooks/useVulnerabilidads';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { extractErrorMessage } from '@/lib/utils';
import type { components } from '@/types/api';

type Fuente = components['schemas']['VulnerabilidadCreate']['fuente'];

const MOTORES: { key: string; fuente: Fuente; label: string }[] = [
  { key: 'sast', fuente: 'SAST', label: 'SAST' },
  { key: 'sca', fuente: 'SCA', label: 'SCA' },
  { key: 'cds', fuente: 'CDS', label: 'CDS' },
  { key: 'dast', fuente: 'DAST', label: 'DAST' },
  { key: 'mast', fuente: 'MAST', label: 'MAST' },
];

const SEVERIDADES = ['Critica', 'Alta', 'Media', 'Baja'].map((s) => ({ value: s, label: s }));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VulnerabilidadMotorCreateSheet({ open, onOpenChange }: Props) {
  const { data: repos = [] } = useRepositorios();
  const { data: flujo } = useVulnerabilidadFlujoConfig();
  const createMut = useCreateVulnerabilidad();

  const [motorKey, setMotorKey] = useState(MOTORES[0]?.key ?? 'sast');
  const fuente = useMemo(() => MOTORES.find((m) => m.key === motorKey)?.fuente ?? 'SAST', [motorKey]);

  const [titulo, setTitulo] = useState('');
  const [severidad, setSeveridad] = useState('Media');
  const [estado, setEstado] = useState('');
  const [repositorioId, setRepositorioId] = useState('');
  const [activoWebId, setActivoWebId] = useState('');
  const [branch, setBranch] = useState('');
  const [packageName, setPackageName] = useState('');
  const [cve, setCve] = useState('');
  const [filePath, setFilePath] = useState('');
  // SAST específico
  const [queryRule, setQueryRule] = useState('');
  const [linea, setLinea] = useState('');
  const [snippet, setSnippet] = useState('');
  const [similarityId, setSimilarityId] = useState('');
  // SCA
  const [versionActual, setVersionActual] = useState('');
  const [versionSegura, setVersionSegura] = useState('');
  const [cvss, setCvss] = useState('');
  // CDS
  const [imagenDocker, setImagenDocker] = useState('');
  const [tagDocker, setTagDocker] = useState('');
  const [paqueteOs, setPaqueteOs] = useState('');
  // DAST
  const [urlAfectada, setUrlAfectada] = useState('');
  const [metodoHttp, setMetodoHttp] = useState('GET');
  const [payloadDast, setPayloadDast] = useState('');
  const [respuestaDast, setRespuestaDast] = useState('');
  // MAST
  const [fechaDeteccion, setFechaDeteccion] = useState('');
  const [fechaRemediacion, setFechaRemediacion] = useState('');

  const estatusOptions = useMemo(
    () => (flujo?.estatus ?? []).map((e) => ({ value: e.id, label: e.label ?? e.id })),
    [flujo?.estatus],
  );

  useEffect(() => {
    if (!estado && estatusOptions.length > 0) {
      setEstado(estatusOptions[0].value);
    }
  }, [estado, estatusOptions]);

  const repoOptions = useMemo(
    () => [{ value: '', label: '— Repositorio —' }, ...repos.map((r) => ({ value: r.id, label: r.nombre }))],
    [repos],
  );

  const reset = () => {
    setTitulo('');
    setSeveridad('Media');
    setEstado(estatusOptions[0]?.value ?? '');
    setRepositorioId('');
    setActivoWebId('');
    setBranch('');
    setPackageName('');
    setCve('');
    setFilePath('');
    setQueryRule('');
    setLinea('');
    setSnippet('');
    setSimilarityId('');
    setVersionActual('');
    setVersionSegura('');
    setCvss('');
    setImagenDocker('');
    setTagDocker('');
    setPaqueteOs('');
    setUrlAfectada('');
    setMetodoHttp('GET');
    setPayloadDast('');
    setRespuestaDast('');
    setFechaDeteccion('');
    setFechaRemediacion('');
  };

  const buildCustomFields = (): Record<string, unknown> => {
    const cf: Record<string, unknown> = {};
    if (fuente === 'SAST') {
      if (branch) cf.branch = branch;
      if (filePath) cf.file_path = filePath;
      if (queryRule) cf.query = queryRule;
      if (linea) cf.linea = linea;
      if (snippet) cf.snippet = snippet;
      if (similarityId) cf.similarity_id = similarityId;
    }
    if (fuente === 'SCA') {
      if (branch) cf.branch = branch;
      if (filePath) cf.file_path = filePath;
      if (packageName) cf.package = packageName;
      if (versionActual) cf.version_actual = versionActual;
      if (versionSegura) cf.version_segura = versionSegura;
      if (cve) cf.cve_id = cve;
      if (cvss) cf.cvss = cvss;
    }
    if (fuente === 'CDS') {
      if (branch) cf.branch = branch;
      if (imagenDocker) cf.imagen_docker = imagenDocker;
      if (tagDocker) cf.tag = tagDocker;
      if (paqueteOs) cf.os_package = paqueteOs;
      if (cve) cf.cve_id = cve;
    }
    if (fuente === 'DAST') {
      if (urlAfectada) cf.url_afectada = urlAfectada;
      if (filePath) cf.endpoint = filePath;
      if (metodoHttp) cf.metodo_http = metodoHttp;
      if (payloadDast) cf.payload = payloadDast;
      if (respuestaDast) cf.response_sample = respuestaDast;
    }
    if (fuente === 'MAST') {
      if (fechaDeteccion) cf.fecha_deteccion = fechaDeteccion;
      if (fechaRemediacion) cf.fecha_remediacion = fechaRemediacion;
    }
    return cf;
  };

  const onSubmit = async () => {
    if (!titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    const rid = repositorioId.trim();
    const wid = activoWebId.trim();
    if (!rid && !wid) {
      toast.error('Indica repositorio o activo web');
      return;
    }
    if (!estado) {
      toast.error('Selecciona un estado del flujo');
      return;
    }
    try {
      await createMut.mutateAsync({
        titulo: titulo.trim(),
        fuente,
        severidad,
        estado,
        descripcion: null,
        repositorio_id: rid || null,
        activo_web_id: wid || null,
        servicio_id: null,
        aplicacion_movil_id: null,
        custom_fields: buildCustomFields(),
      });
      toast.success('Vulnerabilidad creada');
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(extractErrorMessage(e, 'No se pudo crear'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(100vw,440px)] overflow-y-auto border-border sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>Nueva vulnerabilidad por motor</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Select
            label="Motor"
            options={MOTORES.map((m) => ({ value: m.key, label: m.label }))}
            value={motorKey}
            onChange={(e) => setMotorKey(e.target.value)}
          />
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Título</span>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre del hallazgo" />
          </div>
          <Select
            label="Severidad"
            options={SEVERIDADES}
            value={severidad}
            onChange={(e) => setSeveridad(e.target.value)}
          />
          <Select
            label="Estado"
            options={estatusOptions.length ? estatusOptions : [{ value: '', label: 'Cargando…' }]}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            disabled={estatusOptions.length === 0}
          />
          <Select
            label="Repositorio"
            options={repoOptions}
            value={repositorioId}
            onChange={(e) => setRepositorioId(e.target.value)}
            placeholder="Opcional si indicas activo web"
          />
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Activo web (UUID)</span>
            <Input value={activoWebId} onChange={(e) => setActivoWebId(e.target.value)} placeholder="Opcional" />
          </div>

          {fuente === 'SAST' && (
            <>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Rama / branch</span>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Query / regla</span>
                <Input value={queryRule} onChange={(e) => setQueryRule(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Ruta de archivo</span>
                <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Línea</span>
                  <Input value={linea} onChange={(e) => setLinea(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Similarity ID</span>
                  <Input value={similarityId} onChange={(e) => setSimilarityId(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Snippet</span>
                <Input value={snippet} onChange={(e) => setSnippet(e.target.value)} />
              </div>
            </>
          )}

          {fuente === 'SCA' && (
            <>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Rama / branch</span>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Paquete</span>
                <Input value={packageName} onChange={(e) => setPackageName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Versión actual</span>
                  <Input value={versionActual} onChange={(e) => setVersionActual(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Versión segura</span>
                  <Input value={versionSegura} onChange={(e) => setVersionSegura(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">CVE</span>
                  <Input value={cve} onChange={(e) => setCve(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">CVSS</span>
                  <Input value={cvss} onChange={(e) => setCvss(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Ruta / lockfile (opcional)</span>
                <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} />
              </div>
            </>
          )}

          {fuente === 'CDS' && (
            <>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Imagen Docker</span>
                <Input value={imagenDocker} onChange={(e) => setImagenDocker(e.target.value)} placeholder="repo/imagen" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Tag</span>
                <Input value={tagDocker} onChange={(e) => setTagDocker(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Paquete SO</span>
                <Input value={paqueteOs} onChange={(e) => setPaqueteOs(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">CVE</span>
                <Input value={cve} onChange={(e) => setCve(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Repo / contexto (opcional)</span>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="rama o nota" />
              </div>
            </>
          )}

          {fuente === 'DAST' && (
            <>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">URL afectada</span>
                <Input value={urlAfectada} onChange={(e) => setUrlAfectada(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Endpoint / ruta</span>
                <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} />
              </div>
              <Select
                label="Método HTTP"
                options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map((m) => ({ value: m, label: m }))}
                value={metodoHttp}
                onChange={(e) => setMetodoHttp(e.target.value)}
              />
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Payload (opcional)</span>
                <Input value={payloadDast} onChange={(e) => setPayloadDast(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Respuesta / evidencia (opcional)</span>
                <Input value={respuestaDast} onChange={(e) => setRespuestaDast(e.target.value)} />
              </div>
            </>
          )}

          {fuente === 'MAST' && (
            <>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Fecha detección</span>
                <Input type="datetime-local" value={fechaDeteccion} onChange={(e) => setFechaDeteccion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Fecha remediación (opcional)</span>
                <Input type="datetime-local" value={fechaRemediacion} onChange={(e) => setFechaRemediacion(e.target.value)} />
              </div>
            </>
          )}

          <Button className="w-full" type="button" onClick={() => void onSubmit()} disabled={createMut.isPending}>
            {createMut.isPending ? 'Guardando…' : 'Crear hallazgo'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
