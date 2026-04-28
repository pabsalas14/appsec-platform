'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lightbulb, MessageCircle, ChevronDown, ChevronUp, Calendar, User, TrendingUp, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';

interface Tema {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  impacto: 'Alto' | 'Medio' | 'Bajo';
  tipo: string;
  fuente: string;
  fecha_identificacion: string;
  dias_abierto: number;
  created_at: string;
  updated_at: string;
}

interface Bitacora {
  id: string;
  titulo: string;
  contenido: string;
  fuente?: string;
  autor: string;
  fecha: string;
}

interface TemaDetail {
  tema: Tema & {
    creado_por: string;
  };
  bitacora: Bitacora[];
  metadata: {
    total_updates: number;
    last_update: string;
  };
}

interface TemasDashboardData {
  total_themes: number;
  high_impact_themes: number;
  recent_themes: number;
  themes: Tema[];
}

const EMPTY_ENTRY = { titulo: '', contenido: '', fuente: '' };

export default function TemasDashboardPage() {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'fecha' | 'impacto' | 'estado'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState(EMPTY_ENTRY);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-temas-summary'],
    queryFn: async () => {
      logger.info('dashboard.temas_summary.fetch');
      const response = await apiClient.get('/dashboard/emerging-themes-summary');
      return response.data.data as TemasDashboardData;
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (payload: { tema_id: string; titulo: string; contenido: string; fuente?: string }) => {
      logger.info('dashboard.temas.add_entry', { tema_id: payload.tema_id });
      const response = await apiClient.post('/actualizacion_temas/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tema-detail', expandedTheme] });
      setNewEntry(EMPTY_ENTRY);
      setShowAddForm(false);
    },
  });

  const handleAddEntry = () => {
    if (!expandedTheme || !newEntry.titulo.trim() || !newEntry.contenido.trim()) return;
    addEntryMutation.mutate({
      tema_id: expandedTheme,
      titulo: newEntry.titulo.trim(),
      contenido: newEntry.contenido.trim(),
      fuente: newEntry.fuente.trim() || undefined,
    });
  };

  const { data: selectedData, isLoading: selectedLoading } = useQuery({
    queryKey: ['dashboard-tema-detail', expandedTheme],
    queryFn: async () => {
      if (!expandedTheme) return null;
      logger.info('dashboard.tema_detail.fetch', { tema_id: expandedTheme });
      const response = await apiClient.get(`/dashboard/tema/${expandedTheme}/detail`);
      return response.data.data as TemaDetail;
    },
    enabled: !!expandedTheme,
  });

  if (selectedData && expandedTheme) {
    // Theme detail is stored in selectedData and shown in the panel below
  }

  const getDaysColor = (days: number): string => {
    if (days <= 7) return 'text-green-600 bg-green-50';
    if (days <= 14) return 'text-yellow-600 bg-yellow-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getDaysLabel = (days: number): string => {
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `${days} días`;
  };

  const sortedThemes = data?.themes
    ? [...data.themes].sort((a, b) => {
        let compareA: number | string;
        let compareB: number | string;

        if (sortBy === 'fecha') {
          compareA = new Date(a.fecha_identificacion).getTime();
          compareB = new Date(b.fecha_identificacion).getTime();
        } else if (sortBy === 'impacto') {
          const impactoOrder = { Alto: 3, Medio: 2, Bajo: 1 };
          compareA = impactoOrder[a.impacto as 'Alto' | 'Medio' | 'Bajo'] || 0;
          compareB = impactoOrder[b.impacto as 'Alto' | 'Medio' | 'Bajo'] || 0;
        } else if (sortBy === 'estado') {
          compareA = a.estado.toLowerCase();
          compareB = b.estado.toLowerCase();
        } else {
          return 0;
        }

        if (typeof compareA === 'number' && typeof compareB === 'number') {
          return sortOrder === 'asc' ? compareA - compareB : compareB - compareA;
        }

        return sortOrder === 'asc'
          ? String(compareA).localeCompare(String(compareB))
          : String(compareB).localeCompare(String(compareA));
      })
    : [];

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de temas emergentes</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Temas Emergentes</h1>
          <p className="text-muted-foreground mt-1">Seguimiento de tendencias y riesgos emergentes</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-themes-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Total Temas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold">{data?.total_themes || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Tema(s) registrado(s)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alto Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-red-600">
                  {data?.high_impact_themes || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requiere atención</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">
                  {((data?.total_themes || 0) - (data?.recent_themes || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Movidos en 7 días</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sin Movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-600">
                  {data?.recent_themes || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">7+ días inactivos</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Temas Table */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : sortedThemes.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Temas Emergentes</CardTitle>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'fecha' | 'impacto' | 'estado')}
                  className="text-xs px-2 py-1 border rounded bg-background"
                  data-testid="sort-by-select"
                >
                  <option value="fecha">Ordenar: Fecha</option>
                  <option value="impacto">Ordenar: Impacto</option>
                  <option value="estado">Ordenar: Estado</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                  data-testid="toggle-sort-order"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Título</th>
                    <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold">Impacto</th>
                    <th className="text-left py-3 px-4 font-semibold">Días Abierto</th>
                    <th className="text-center py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedThemes.map((tema) => (
                    <tr
                      key={tema.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                      data-testid={`tema-row-${tema.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">{tema.titulo}</div>
                        <div className="text-xs text-muted-foreground">{tema.descripcion?.substring(0, 50)}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">{tema.tipo}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded bg-muted">
                          {tema.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            tema.impacto === 'Alto'
                              ? 'bg-red-100 text-red-700'
                              : tema.impacto === 'Medio'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {tema.impacto}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${getDaysColor(tema.dias_abierto)}`}>
                        {getDaysLabel(tema.dias_abierto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTheme(expandedTheme === tema.id ? null : tema.id)}
                          data-testid={`expand-btn-${tema.id}`}
                        >
                          {expandedTheme === tema.id ? 'Cerrar' : 'Ver'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No hay temas emergentes registrados</p>
          </CardContent>
        </Card>
      )}

      {/* SidePanel - Timeline/Bitácora */}
      {expandedTheme && selectedData && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedData.tema.titulo}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{selectedData.tema.descripcion}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedTheme(null)}
                data-testid="close-detail-btn"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tema Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-semibold">{selectedData.tema.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <span className="inline-block text-xs px-2 py-1 rounded bg-muted">
                  {selectedData.tema.estado}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impacto</p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                    selectedData.tema.impacto === 'Alto'
                      ? 'bg-red-100 text-red-700'
                      : selectedData.tema.impacto === 'Medio'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {selectedData.tema.impacto}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Días Abierto</p>
                <p className="font-semibold">{selectedData.tema.dias_abierto}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Creado por: <strong>{selectedData.tema.creado_por}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Identificado: <strong>{new Date(selectedData.tema.fecha_identificacion).toLocaleDateString('es-ES')}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Última actualización: <strong>{new Date(selectedData.metadata.last_update).toLocaleString('es-ES')}</strong></span>
              </div>
            </div>

            {/* Bitácora Timeline */}
            {selectedLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Bitácora ({selectedData.bitacora.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowAddForm(!showAddForm); setNewEntry(EMPTY_ENTRY); }}
                    data-testid="add-entry-btn"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar actualización
                  </Button>
                </div>

                {showAddForm && (
                  <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3" data-testid="add-entry-form">
                    <Input
                      placeholder="Título de la actualización *"
                      value={newEntry.titulo}
                      onChange={(e) => setNewEntry((p) => ({ ...p, titulo: e.target.value }))}
                      data-testid="entry-titulo-input"
                    />
                    <Textarea
                      placeholder="Descripción del avance o comentario *"
                      value={newEntry.contenido}
                      onChange={(e) => setNewEntry((p) => ({ ...p, contenido: e.target.value }))}
                      rows={3}
                      data-testid="entry-contenido-input"
                    />
                    <Input
                      placeholder="Fuente (opcional)"
                      value={newEntry.fuente}
                      onChange={(e) => setNewEntry((p) => ({ ...p, fuente: e.target.value }))}
                      data-testid="entry-fuente-input"
                    />
                    {addEntryMutation.isError && (
                      <p className="text-xs text-destructive">Error al guardar. Intenta de nuevo.</p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowAddForm(false); setNewEntry(EMPTY_ENTRY); }}
                        disabled={addEntryMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddEntry}
                        disabled={!newEntry.titulo.trim() || !newEntry.contenido.trim() || addEntryMutation.isPending}
                        data-testid="save-entry-btn"
                      >
                        {addEntryMutation.isPending ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedData.bitacora.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedData.bitacora.map((item, idx) => (
                      <div key={item.id} className="relative">
                        {idx !== selectedData.bitacora.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-8 bg-muted"></div>
                        )}
                        <div className="flex gap-3">
                          <div className="relative z-10">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                          </div>
                          <div className="pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{item.titulo}</p>
                                <p className="text-xs text-muted-foreground">Por: {item.autor}</p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(item.fecha).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">{item.contenido}</p>
                            {item.fuente && (
                              <p className="text-xs mt-1 text-muted-foreground">Fuente: {item.fuente}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No hay actualizaciones aún. Agrega la primera entrada.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
