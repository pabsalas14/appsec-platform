"use client";

import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  Plug,
  ScrollText,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader, PageWrapper } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isBackofficeUser } from '@/lib/roles';

type HubCard = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const BUILDER_CARDS: HubCard[] = [
  {
    href: '/admin/module-views',
    title: 'Module views',
    description: 'Vistas de tabla, Kanban, calendario y tarjetas por módulo.',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/custom-fields',
    title: 'Campos personalizados',
    description: 'Definición de campos dinámicos por tipo de entidad.',
    icon: ClipboardList,
  },
  {
    href: '/admin/validation-rules',
    title: 'Reglas de validación',
    description: 'Validaciones condicionales y mensajes de error.',
    icon: ShieldCheck,
  },
  {
    href: '/admin/formulas',
    title: 'Fórmulas',
    description: 'Expresiones reutilizables para indicadores y motor seguro.',
    icon: LineChart,
  },
  {
    href: '/admin/catalogs',
    title: 'Catálogos',
    description: 'Enumeraciones y valores centralizados editables.',
    icon: BookOpen,
  },
  {
    href: '/dashboards/builder',
    title: 'Dashboard builder',
    description: 'Widgets, layout y fuentes de datos de tableros.',
    icon: LayoutDashboard,
  },
];

const OPS_CARDS: HubCard[] = [
  {
    href: '/admin/ai-rules',
    title: 'AI automation',
    description: 'Disparadores y acciones de automatización con IA.',
    icon: Sparkles,
  },
  {
    href: '/admin/ia-config',
    title: 'Configuración de IA',
    description: 'Proveedores, modelos y pruebas de conectividad.',
    icon: Settings,
  },
  {
    href: '/admin/users',
    title: 'Usuarios',
    description: 'Alta, roles y reasignación de ownership.',
    icon: Users,
  },
  {
    href: '/admin/roles',
    title: 'Roles y permisos',
    description: 'Matriz de capacidades del backoffice.',
    icon: ShieldCheck,
  },
  {
    href: '/admin/operacion',
    title: 'Operación (BRD)',
    description: 'Parámetros de ciclo de vida, KPIs y congelación de periodo.',
    icon: Server,
  },
  {
    href: '/admin/risk-scoring',
    title: 'Risk scoring',
    description: 'Ponderación y umbrales de riesgo.',
    icon: ShieldCheck,
  },
  {
    href: '/admin/audit-logs',
    title: 'Audit logs',
    description: 'Trazabilidad de cambios con filtros en URL.',
    icon: ScrollText,
  },
  {
    href: '/admin/settings',
    title: 'Settings',
    description: 'Ajustes globales JSON y banderas de sistema.',
    icon: Settings,
  },
  {
    href: '/admin/email-notifications',
    title: 'Email notifications',
    description: 'Plantillas y envío transaccional.',
    icon: Send,
  },
  {
    href: '/admin/integrations',
    title: 'Integraciones',
    description: 'SCR: GitHub, LLM y credenciales de plataforma.',
    icon: Plug,
  },
];

function HubSection({ title, subtitle, cards }: { title: string; subtitle: string; cards: HubCard[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full border-border/80 bg-card/60 transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base leading-snug group-hover:text-primary">{c.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{c.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{c.href}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AdminHubPage() {
  const { data: user } = useCurrentUser();
  const allowed = isBackofficeUser(user?.role);

  if (!allowed) {
    return (
      <PageWrapper>
        <PageHeader title="Administración" description="Acceso restringido al backoffice." />
        <p className="text-sm text-muted-foreground">Tu cuenta no tiene rol de administración.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Centro de administración"
        description="Builder no-code, operación, integraciones y gobierno — mismas rutas profundas que antes, un solo punto de entrada."
      />
      <div className="space-y-12 pb-8">
        <HubSection
          title="Schema y tableros"
          subtitle="Catálogos, campos, reglas, fórmulas y composición de vistas."
          cards={BUILDER_CARDS}
        />
        <HubSection
          title="Operación y plataforma"
          subtitle="Usuarios, IA, auditoría, riesgo, notificaciones e integraciones."
          cards={OPS_CARDS}
        />
      </div>
    </PageWrapper>
  );
}
