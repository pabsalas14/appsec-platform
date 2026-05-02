'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';

interface GitHubTokenRow {
  id: string;
  label: string;
  platform: string;
  token_hint?: string;
  user: string | null;
  organizations: string[];
  repos_count: number;
  last_validated: string | null;
  expiration_date: string | null;
  created_at: string | null;
}

type ValidationPayload = {
  valid?: boolean;
  user?: string | null;
  organizations?: string[] | null;
  repos_count?: number | null;
  message?: string;
  expiration_date?: string | null;
};

export function GitHubTokenConfig() {
  const [tokens, setTokens] = useState<GitHubTokenRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationPayload | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    platform: 'github',
    token: '',
  });

  async function fetchTokens() {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/scr/github-tokens');
      const envelope = response.data as { status?: string; data?: { tokens?: GitHubTokenRow[] } };
      if (envelope?.status === 'success' && Array.isArray(envelope.data?.tokens)) {
        setTokens(envelope.data.tokens);
      }
    } catch (error) {
      logger.error('admin.github_tokens.fetch_failed', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchTokens();
  }, []);

  const handleValidateToken = async () => {
    if (!formData.token || !formData.nombre) {
      toast.error('Completa nombre y token');
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.post('/admin/scr/github-tokens/validate', {
        platform: formData.platform,
        token: formData.token,
        label: formData.nombre,
      });

      const envelope = response.data as { status?: string; data?: ValidationPayload };
      const data = envelope?.data;
      if (envelope?.status === 'success' && data?.valid) {
        setValidationResult(data);
        toast.success('Token válido');
      } else {
        toast.error(data?.message ?? 'Token inválido');
        setValidationResult(null);
      }
    } catch (error: unknown) {
      const detail =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === 'string' ? detail : 'Error al validar');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.token || !validationResult) {
      toast.error('Valida el token primero');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        label: formData.nombre,
        platform: formData.platform,
        token: formData.token,
        token_type: 'personal' as const,
      };

      if (editingId) {
        await api.patch(`/admin/scr/github-tokens/${editingId}`, payload);
        toast.success('Token actualizado');
      } else {
        await api.post('/admin/scr/github-tokens', payload);
        toast.success('Token guardado');
      }

      setIsOpen(false);
      setFormData({ nombre: '', platform: 'github', token: '' });
      setEditingId(null);
      setValidationResult(null);
      fetchTokens();
    } catch (error: unknown) {
      const detail =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === 'string' ? detail : 'Error al guardar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este token? No podrás deshacerlo.')) {
      return;
    }

    try {
      await api.delete(`/admin/scr/github-tokens/${id}`);
      toast.success('✅ Token eliminado');
      fetchTokens();
    } catch (error: unknown) {
      const detail =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === 'string' ? detail : 'Error al eliminar');
    }
  };

  const openEditDialog = (token: GitHubTokenRow) => {
    setEditingId(token.id);
    setFormData({
      nombre: token.label,
      platform: token.platform,
      token: '', // Don't load for security
    });
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      platform: 'github',
      token: '',
    });
    setValidationResult(null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Add Token Button */}
      <div className="flex justify-end">
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Token
        </Button>
      </div>

      {/* Tokens Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No hay tokens configurados</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                Crear primer token
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens.map((token) => (
            <Card key={token.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{token.label}</CardTitle>
                    <CardDescription className="mt-1 space-x-2">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100">
                        {token.platform === 'github' ? 'GitHub' : 'GitLab'}
                      </span>
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                        Registrado
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(token)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(token.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Usuario</p>
                    <p className="text-sm font-mono">{token.user}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Organizaciones</p>
                    <p className="text-sm font-mono">{token.organizations?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Repos (públicos)</p>
                    <p className="text-sm font-mono">{token.repos_count}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Expira</p>
                    <p className="text-sm font-mono">
                      {token.expiration_date ? new Date(token.expiration_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Agregar'} Token</DialogTitle>
            <DialogDescription>
              {formData.platform === 'github'
                ? 'Usa un Personal Access Token (PAT) o GitHub App Token con permisos de lectura de repositorios'
                : 'Usa un token de acceso personal de GitLab'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Descriptivo*</Label>
              <Input
                id="nombre"
                placeholder="Ej: Token Org Banregio"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma*</Label>
              <Select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                options={[
                  { value: 'github', label: 'GitHub' },
                  { value: 'gitlab', label: 'GitLab' },
                ]}
              />
            </div>

            {/* Token */}
            <div className="space-y-2">
              <Label htmlFor="token">Token*</Label>
              <Input
                id="token"
                type="password"
                placeholder={formData.platform === 'github' ? 'ghp_...' : 'glpat-...'}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              />
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Card className="border-emerald-500/30 bg-emerald-500/10">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Token válido</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-emerald-300/80">Usuario:</p>
                      <p className="font-mono text-foreground">{validationResult.user ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-300/80">Expira:</p>
                      <p className="font-mono text-foreground">
                        {validationResult.expiration_date
                          ? new Date(validationResult.expiration_date).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-300/80">Orgs:</p>
                      <p className="font-mono text-foreground">{validationResult.organizations?.length ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-300/80">Repos:</p>
                      <p className="font-mono text-foreground">{validationResult.repos_count ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validate Button */}
            <Button
              variant="outline"
              onClick={handleValidateToken}
              disabled={isValidating || !formData.token || !formData.nombre}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar Token'
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !validationResult}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Token'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
