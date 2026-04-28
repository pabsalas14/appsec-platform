'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateDashboard } from '@/hooks/useDashboard';
import { DashboardLayout } from '@/schemas/dashboard-schema';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function DashboardBuilderPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const createMutation = useCreateDashboard();

  const defaultLayout: DashboardLayout = {
    version: 1,
    grid: {
      cols: 12,
      rowHeight: 80,
      compactType: 'vertical',
    },
    widgets: [],
  };

  const handleCreate = async () => {
    try {
      const newDashboard = await createMutation.mutateAsync({
        nombre,
        descripcion: descripcion || undefined,
        layout_json: defaultLayout,
        is_system: false,
        is_template: false,
        activo: true,
      });

      router.push(`/dashboards/${newDashboard.id}/edit`);
    } catch (error) {
      logger.error('dashboard.builder.create_failed', { error: String(error) });
    }
  };

  const isValid = nombre.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="w-fit gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Dashboard</CardTitle>
            <CardDescription>
              Crea un dashboard personalizado desde cero
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Dashboard</label>
              <Input
                placeholder="Ej: Métricas de Seguridad"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (Opcional)</label>
              <Textarea
                placeholder="Ej: Dashboard para monitorear KPIs de seguridad en tiempo real"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreate}
                disabled={!isValid || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crear Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
