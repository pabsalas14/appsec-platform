"use client";

import {
  AppWindow,
  Building2,
  Bug,
  Briefcase,
  ChevronLeft,
  Globe2,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Flag,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Layers,
  Link2,
  ListChecks,
  ListTodo,
  LineChart,
  FunctionSquare,
  LayoutTemplate,
  MessageSquare,
  Package,
  Server,
  Target,
  Workflow,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  SquareChartGantt,
  Upload,
  UserCircle,
  Users,
  AlertTriangle,
  CheckSquare,
  Bookmark,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSidebarState } from '@/hooks/useSidebarState';
import { isBackofficeUser } from '@/lib/roles';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
};

const SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/tasks', label: 'Tasks', icon: ListTodo },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/kanban', label: 'Kanban', icon: Layers },
      { href: '/uploads', label: 'Uploads', icon: Upload },
      { href: '/vulnerabilidads', label: 'Vulnerabilidades', icon: Bug },
      { href: '/madurez', label: 'Score de Madurez', icon: TrendingUp },
      { href: '/filtros_guardados', label: 'Filtros guardados', icon: Bookmark },
      { href: '/dashboards', label: 'Dashboards', icon: LayoutDashboard },
      { href: '/indicadores', label: 'Indicadores (KPIs)', icon: LineChart },
      { href: '/dashboards/executive', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
      { href: '/dashboards/vulnerabilities', label: 'Dashboard Vulnerabilidades', icon: ShieldCheck },
      { href: '/dashboards/team', label: 'Dashboard Team', icon: Users },
      { href: '/dashboards/releases', label: 'Dashboard Releases', icon: Layers },
    ],
  },
  {
    title: 'Organización (BRD)',
    items: [
      { href: '/subdireccions', label: 'Subdirecciones', icon: Building2 },
      { href: '/direccions', label: 'Direcciones', icon: Building2 },
      { href: '/gerencias', label: 'Gerencias', icon: Briefcase },
      { href: '/organizacions', label: 'Organizaciones', icon: Globe2 },
      { href: '/celulas', label: 'Células', icon: Users },
    ],
  },
  {
    title: 'Inventario (BRD)',
    items: [
      { href: '/repositorios', label: 'Repositorios', icon: GitBranch },
      { href: '/activo_webs', label: 'Activos web', icon: Link2 },
    ],
  },
  {
    title: 'Entrega y plan (BRD)',
    items: [
      { href: '/servicios', label: 'Servicios', icon: Server },
      { href: '/service_releases', label: 'Liberaciones de servicio', icon: Package },
      { href: '/etapa_releases', label: 'Etapas de liberación', icon: ListChecks },
      { href: '/pipeline_releases', label: 'Pipelines', icon: Workflow },
      { href: '/iniciativas', label: 'Iniciativas', icon: Target },
      { href: '/hito_iniciativas', label: 'Hitos de iniciativa', icon: Flag },
      { href: '/actualizacion_iniciativas', label: 'Actualizaciones iniciativa', icon: MessageSquare },
    ],
  },
  {
    title: 'Hallazgos (BRD)',
    items: [
      { href: '/hallazgo_sasts', label: 'Hallazgos SAST', icon: Bug },
      { href: '/hallazgo_dasts', label: 'Hallazgos DAST', icon: Globe2 },
      { href: '/hallazgo_masts', label: 'Hallazgos MAST', icon: Smartphone },
      { href: '/hallazgo_pipelines', label: 'Hallazgos pipeline', icon: Workflow },
      { href: '/hallazgo_terceros', label: 'Hallazgos tercero', icon: Building2 },
    ],
  },
  {
    title: 'Programas anuales',
    items: [
      { href: '/programa_sasts', label: 'Programas SAST', icon: Bug },
      { href: '/actividad_mensual_sasts', label: 'Actividad SAST', icon: LineChart },
      { href: '/programa_dasts', label: 'Programas DAST', icon: Globe2 },
      { href: '/actividad_mensual_dasts', label: 'Actividad DAST', icon: LineChart },
      { href: '/programa_source_codes', label: 'Programas SC', icon: GitBranch },
      { href: '/actividad_mensual_source_codes', label: 'Actividad SC', icon: LineChart },
      { href: '/servicio_regulado_registros', label: 'Servicios regulados', icon: Layers },
      { href: '/actividad_mensual_servicios_regulados', label: 'Actividad SR', icon: LineChart },
    ],
  },
  {
    title: 'Auditorías (BRD)',
    items: [
      { href: '/auditorias', label: 'Auditorías', icon: ClipboardList },
      { href: '/hallazgo_auditorias', label: 'Hallazgos auditoría', icon: FileSearch },
      { href: '/evidencia_auditorias', label: 'Evidencias auditoría', icon: FileSearch },
      { href: '/plan_remediacions', label: 'Planes de remediación', icon: CheckSquare },
    ],
  },
  {
    title: 'Temas Emergentes (BRD)',
    items: [
      { href: '/temas_emergentes', label: 'Temas emergentes', icon: AlertTriangle },
      { href: '/actualizacion_temas', label: 'Actualizaciones de tema', icon: MessageSquare },
      { href: '/cierre_conclusiones', label: 'Cierres y conclusiones', icon: CheckSquare },
    ],
  },
  {
    title: 'Threat modeling',
    items: [
      { href: '/programa_threat_modelings', label: 'Programas TM', icon: Network },
      { href: '/sesion_threat_modelings', label: 'Sesiones TM', icon: ClipboardList },
    ],
  },
  {
    title: 'OKR / MBO',
    items: [
      { href: '/mis_compromisos', label: 'Mis Compromisos', icon: Target },
      { href: '/okr_equipo', label: 'Mi Equipo', icon: Users },
      { href: '/okr_dashboard', label: 'Dashboard Ejecutivo OKR', icon: SquareChartGantt },
    ],
  },
  {
    title: 'Administración',
    adminOnly: true,
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
      { href: '/admin/roles', label: 'Roles', icon: ShieldCheck, adminOnly: true },
      { href: '/admin/catalogs', label: 'Catálogos', icon: ListChecks, adminOnly: true },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
      { href: '/admin/module-views', label: 'Module Views', icon: LayoutTemplate, adminOnly: true },
      { href: '/admin/formulas', label: 'Formula Engine', icon: FunctionSquare, adminOnly: true },
      { href: '/indicadores_formulas', label: 'Fórmulas de indicadores', icon: FunctionSquare, adminOnly: true },
      { href: '/flujos_estatus', label: 'Flujos de estatus', icon: Workflow, adminOnly: true },
      { href: '/admin/operacion', label: 'Operación (BRD)', icon: LayoutDashboard, adminOnly: true },
      { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
    ],
  },
  {
    title: 'Developer',
    items: [
      { href: '/kitchen-sink', label: 'Kitchen Sink', icon: AppWindow },
      { href: '/profile', label: 'Profile', icon: UserCircle },
    ],
  },
];

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        active && 'bg-primary/10 text-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarState();
  const { data: user } = useCurrentUser();
  const isAdmin = isBackofficeUser(user?.role);

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 items-center gap-2 border-b border-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">F</span>
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">Framework</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        {SECTIONS.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          const visibleItems = section.items.filter((i) => !i.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    active={
                      item.href === '/'
                        ? pathname === '/'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse handle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full',
          'border border-border bg-background text-muted-foreground shadow-sm',
          'hover:text-foreground hover:bg-accent transition-colors',
        )}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
