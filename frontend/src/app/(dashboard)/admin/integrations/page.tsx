'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';

const INTEGRATION_TYPES = [
  { value: 'GitHub', label: 'GitHub', color: 'bg-gray-100' },
  { value: 'LLM', label: 'LLM Provider', color: 'bg-blue-100' },
];

interface ExternalIntegration {
  id: string;
  nombre: string;
  tipo: string;
  url_base?: string;
  api_token?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<ExternalIntegration>>({
    nombre: '',
    tipo: 'GitHub',
    url_base: '',
    api_token: '',
  });

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/admin/herramientas-externas');
      const result = await response.json();

      if (result.success) {
        // Filter only GitHub and LLM integrations
        const filtered = (result.data || []).filter(
          (item: ExternalIntegration) => ['GitHub', 'LLM'].includes(item.tipo)
        );
        setIntegrations(filtered);
      }
    } catch (error) {
      toast.error('Error loading integrations');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSave = async () => {
    if (!formData.nombre || !formData.tipo) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        url_base: formData.url_base || null,
        api_token: formData.api_token || null,
      };

      let response;
      if (editingId) {
        response = await fetch(`/api/v1/admin/herramientas-externas/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/v1/admin/herramientas-externas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      if (result.success) {
        toast.success(editingId ? 'Integración actualizada' : 'Integración creada');
        setIsOpen(false);
        setFormData({ nombre: '', tipo: 'GitHub', url_base: '', api_token: '' });
        setEditingId(null);
        fetchIntegrations();
      } else {
        toast.error(result.error?.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error saving integration');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta integración?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/herramientas-externas/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Integración eliminada');
        fetchIntegrations();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error deleting integration');
      console.error(error);
    }
  };

  const openEditDialog = (integration: ExternalIntegration) => {
    setEditingId(integration.id);
    setFormData({
      nombre: integration.nombre,
      tipo: integration.tipo,
      url_base: integration.url_base,
      api_token: '', // Don't load existing token for security
    });
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      tipo: 'GitHub',
      url_base: '',
      api_token: '',
    });
    setIsOpen(true);
  };

  const getTypeColor = (tipo: string) => {
    const type = INTEGRATION_TYPES.find((t) => t.value === tipo);
    return type?.color || 'bg-gray-100';
  };

  const getTypeLabel = (tipo: string) => {
    const type = INTEGRATION_TYPES.find((t) => t.value === tipo);
    return type?.label || tipo;
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Integraciones Externas"
          description="Configura tokens y credenciales para GitHub, LLM y otras herramientas externas. Los tokens se almacenan encriptados."
        />
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Integración
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No hay integraciones configuradas</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                Crear primera integración
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{integration.nombre}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(integration.tipo)}`}>
                        {getTypeLabel(integration.tipo)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(integration)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(integration.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {integration.url_base && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">URL Base</label>
                    <p className="break-all text-sm font-mono text-gray-600">{integration.url_base}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Token</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">
                      {showToken[integration.id] ? (integration.api_token || '•••••••••••') : '•••••••••••'}
                    </p>
                    {integration.api_token && (
                      <button
                        onClick={() =>
                          setShowToken({
                            ...showToken,
                            [integration.id]: !showToken[integration.id],
                          })
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showToken[integration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
                {integration.created_at && (
                  <div className="pt-2 text-xs text-muted-foreground">
                    Creado: {new Date(integration.created_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for create/edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nueva'} Integración</DialogTitle>
            <DialogDescription>
              {formData.tipo === 'GitHub'
                ? 'Configura tu token de acceso personal (PAT) de GitHub con permisos de lectura de repositorios.'
                : 'Configura la clave API de tu proveedor LLM (Anthropic, OpenAI, etc).'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre*</label>
              <Input
                placeholder="Ej: GitHub Personal, Claude API"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo*</label>
              <Select
                value={formData.tipo || 'GitHub'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                options={INTEGRATION_TYPES}
              />
            </div>

            {formData.tipo === 'GitHub' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Base (Opcional)</label>
                <Input
                  placeholder="Ej: https://api.github.com"
                  value={formData.url_base || ''}
                  onChange={(e) => setFormData({ ...formData, url_base: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deja en blanco para usar GitHub.com. Para GitHub Enterprise, ingresa tu URL.
                </p>
              </div>
            )}

            {formData.tipo === 'LLM' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Base (Opcional)</label>
                <Input
                  placeholder="Ej: https://api.openai.com/v1 (para OpenAI Custom)"
                  value={formData.url_base || ''}
                  onChange={(e) => setFormData({ ...formData, url_base: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Solo necesaria para algunos proveedores (OpenAI Custom, Ollama, etc)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Token/API Key*</label>
              <Input
                type="password"
                placeholder={formData.tipo === 'GitHub' ? 'ghp_xxxxxxxxxxxx' : 'sk-xxxxxxxxxxxx'}
                value={formData.api_token || ''}
                onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              />
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  Deja vacío para mantener el token actual.
                </p>
              )}
            </div>

            {formData.tipo === 'GitHub' && (
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">Cómo crear un token de GitHub:</p>
                <ol className="text-xs list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Ve a GitHub → Settings → Developer settings → Personal access tokens</li>
                  <li>Haz clic en "Generate new token (classic)"</li>
                  <li>Selecciona los scopes: repo (recomendado: repo:status, repo_deployment, public_repo)</li>
                  <li>Copia el token y pégalo aquí</li>
                </ol>
              </div>
            )}

            {formData.tipo === 'LLM' && (
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">Ejemplos de proveedores soportados:</p>
                <ul className="text-xs list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Anthropic Claude: ANTHROPIC_API_KEY (sk-ant-...)</li>
                  <li>OpenAI: OPENAI_API_KEY (sk-proj-...)</li>
                  <li>OpenRouter: OPENROUTER_API_KEY</li>
                  <li>Ollama: Base URL (http://localhost:11434)</li>
                  <li>LiteLLM Proxy: LITELLM_PROXY_URL</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.nombre || !formData.tipo || !formData.api_token}>
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
