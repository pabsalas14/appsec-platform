'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Target } from 'lucide-react';

import {
  Badge,
  Card,
  CardContent,
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import { useIniciativa } from '@/hooks/useIniciativas';
import { cn } from '@/lib/utils';

const linkBtnBase =
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20';
const linkOutlineSm = cn(
  linkBtnBase,
  'text-sm py-1.5 px-3 rounded-lg border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08]',
);
const linkSecondaryMd = cn(
  linkBtnBase,
  'text-sm py-2 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-foreground hover:bg-white/[0.08]',
);
const linkOutlineMd = cn(
  linkBtnBase,
  'text-sm py-2 px-4 rounded-lg border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08]',
);

export default function IniciativaDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : undefined;
  const { data: ini, isLoading, error } = useIniciativa(id);

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/iniciativas/registros" className={linkOutlineSm}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Registros
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error || !ini ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontró la iniciativa o no tienes permiso para verla.
          </CardContent>
        </Card>
      ) : (
        <>
          <PageHeader
            title={ini.titulo ?? 'Iniciativa'}
            description={ini.descripcion ?? 'Detalle de iniciativa de seguridad.'}
          >
            <Badge variant="secondary">{ini.estado ?? '—'}</Badge>
          </PageHeader>

          <Tabs defaultValue="detalle" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="programas">Programas y enlaces</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="space-y-6">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Tipo: </span>
                        {ini.tipo ?? '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Inicio: </span>
                        {ini.fecha_inicio ? new Date(ini.fecha_inicio).toLocaleString('es-ES') : '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Fin estimada: </span>
                        {ini.fecha_fin_estimada
                          ? new Date(ini.fecha_fin_estimada).toLocaleString('es-ES')
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href="/hito_iniciativas" className={linkSecondaryMd}>
                      Hitos de iniciativas
                    </Link>
                    <Link href="/dashboards/iniciativas" className={linkOutlineMd}>
                      Dashboard iniciativas
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <EntityCustomFieldsCard entityType="iniciativa" entityId={ini.id} />
            </TabsContent>

            <TabsContent value="programas">
              <Card>
                <CardContent className="space-y-4 p-6 text-sm">
                  <p className="text-muted-foreground">
                    Navegación relacional hacia programas anuales por motor y tableros (spec §5).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/programas" className={linkSecondaryMd}>
                      Hub programas e iniciativas
                    </Link>
                    <Link href="/dashboards/programs" className={linkOutlineMd}>
                      Dashboard programas anuales
                    </Link>
                    <Link href="/programa_sasts" className={linkOutlineMd}>
                      Programas SAST
                    </Link>
                    <Link href="/programa_dasts" className={linkOutlineMd}>
                      Programas DAST
                    </Link>
                    <Link href="/programa_threat_modelings" className={linkOutlineMd}>
                      Threat modeling
                    </Link>
                    <Link href="/iniciativas/registros" className={linkOutlineMd}>
                      Registro de iniciativas
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageWrapper>
  );
}
