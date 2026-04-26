'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lightbulb, MessageCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { DataTable } from '@/components/charts';

interface Tema {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  impacto: 'Alto' | 'Medio' | 'Bajo';
  fecha_identificacion: string;
  comentarios?: Array<{
    autor: string;
    texto: string;
    fecha: string;
  }>;
}

interface TemasDashboardData {
  total_themes: number;
  high_impact_themes: number;
  recent_themes: number;
  themes: Tema[];
}

export default function TemasDashboardPage() {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-temas'],
    queryFn: async () => {
      logger.info('dashboard.temas.fetch');
      const response = await apiClient.get('/api/v1/dashboard/emerging-themes');
      return response.data.data as TemasDashboardData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de temas emergentes</span>
      </div>
    );
  }

  const columns = [
    { key: 'titulo', label: 'Título' },
    { key: 'estado', label: 'Estado' },
    { key: 'impacto', label: 'Impacto' },
    { key: 'fecha_identificacion', label: 'Identificado' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Temas Emergentes</h1>
          <p className="text-muted-foreground mt-1">Seguimiento de tendencias y riesgos emergentes</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-themes-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Total de Temas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.total_themes || 0}</div>
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
              <div className="text-3xl font-bold text-red-600">
                {data?.high_impact_themes || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recientemente Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">
                {data?.recent_themes || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Temas con Bitácora */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : data?.themes ? (
        <div className="space-y-3">
          {data.themes.map(tema => (
            <Card
              key={tema.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedTheme(expandedTheme === tema.id ? null : tema.id)}
              data-testid={`tema-card-${tema.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{tema.titulo}</CardTitle>
                    {tema.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">{tema.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {tema.estado}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {expandedTheme === tema.id && (
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Identificado: {new Date(tema.fecha_identificacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  {tema.comentarios && tema.comentarios.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Bitácora ({tema.comentarios.length})
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {tema.comentarios.map((comentario, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-muted rounded text-xs"
                            data-testid={`comentario-${tema.id}-${idx}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{comentario.autor}</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(comentario.fecha).toLocaleString('es-ES')}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{comentario.texto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
