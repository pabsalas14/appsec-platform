"use client";

import {
  AppWindow,
  Building2,
  Bug,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  FunctionSquare,
  Link2,
  ListChecks,
  Package,
  ScrollText,
  Server,
  Settings,
  Target,
  TrendingUp,
  Upload,
  UserCircle,
  Users,
  Workflow,
  Network,
  CheckSquare,
  Globe2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { CollapsibleNavSection } from '@/components/ui/collapsible';
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

type NavSectionDef = {
  id: string;
  title: string;
  emoji: string;
  /** Rutas que marcan esta sección como “activa” para dejarla expandida por defecto */
  pathPrefixes: string[];
  items: NavItem[];
  adminOnly?: boolean;
};

/**
 * Navegación relacional BRD — 7 secciones colapsables.
 * Las entidades hijas (p. ej. hallazgos por motor) no tienen ítem propio: se abren desde el padre o la paleta (Ctrl+K).
 */
const NAV_SECTIONS: NavSectionDef[] = [
  {
    id: 'dashboards',
    title: 'Dashboards principales',
    emoji: '📊',
    pathPrefixes: ['/dashboards/executive', '/dashboards/team', '/dashboards/programs', '/dashboards/concentrado', '/dashboards/vulnerabilities', '/dashboards/operacion', '/dashboards/kanban', '/dashboards/initiatives', '/dashboards/emerging-themes', '/madurez'],
    items: [
      { href: '/dashboards/executive', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
      { href: '/dashboards/team', label: 'Dashboard de Equipo', icon: Users },
      { href: '/dashboards/programs', label: 'Programas Anuales', icon: LineChart },
      { href: '/dashboards/concentrado', label: 'Concentrado de Hallazgos', icon: Bug },
      { href: '/dashboards/vulnerabilities', label: 'Vulnerabilidades (Drilldown)', icon: LineChart },
      { href: '/dashboards/operacion', label: 'Liberaciones', icon: Package },
      { href: '/dashboards/kanban', label: 'Kanban', icon: FolderKanban },
      { href: '/dashboards/initiatives', label: 'Iniciativas', icon: Target },
      { href: '/dashboards/emerging-themes', label: 'Temas Emergentes', icon: Briefcase },
      { href: '/madurez', label: 'Score de Madurez', icon: TrendingUp },
    ],
  },
  {
    id: 'org',
    title: 'Organización e inventario',
    emoji: '🏢',
    pathPrefixes: ['/subdireccions', '/repositorios', '/activo_webs'],
    items: [
      { href: '/subdireccions', label: 'Estructura organizacional', icon: Building2 },
      { href: '/repositorios', label: 'Repositorios', icon: GitBranch },
      { href: '/activo_webs', label: 'Activos web', icon: Link2 },
    ],
  },
  {
    id: 'vulns',
    title: 'Gestión de vulnerabilidades',
    emoji: '🛡️',
    pathPrefixes: [
      '/plan_remediacions',
      '/programa_threat_modelings',
      '/vulnerabilidads',
    ],
    items: [
      { href: '/vulnerabilidads/registros', label: 'Catálogo de vulnerabilidades', icon: ListChecks },
      { href: '/plan_remediacions', label: 'Planes de remediación', icon: CheckSquare },
      { href: '/programa_threat_modelings', label: 'Threat modeling (programas)', icon: Network },
    ],
  },
  {
    id: 'ops',
    title: 'Operación y liberaciones',
    emoji: '⚙️',
    pathPrefixes: [
      '/servicios',
      '/service_releases',
    ],
    items: [
      { href: '/servicios', label: 'Servicios', icon: Server },
      { href: '/service_releases/registros', label: 'Liberaciones de servicio', icon: Package },
    ],
  },
  {
    id: 'programs_audit',
    title: 'Programas y auditorías',
    emoji: '📅',
    pathPrefixes: [
      '/dashboards/program-detail',
      '/auditorias',
      '/programa_sasts',
      '/servicio_regulado_registros',
    ],
    items: [
      { href: '/auditorias/registros', label: 'Auditorías', icon: ClipboardList },
      { href: '/servicio_regulado_registros', label: 'Servicios regulados', icon: Globe2 },
    ],
  },
  {
    id: 'okr',
    title: 'Desempeño (OKR / MBO)',
    emoji: '🎯',
    pathPrefixes: ['/mis_compromisos', '/okr_equipo'],
    items: [
      { href: '/mis_compromisos', label: 'Mis compromisos', icon: Target },
      { href: '/okr_equipo', label: 'Mi equipo', icon: Users },
    ],
  },
  {
    id: 'admin',
    title: 'Administración',
    emoji: '🛠️',
    pathPrefixes: [
      '/admin',
      '/indicadores',
      '/indicadores_formulas',
      '/flujos_estatus',
      '/query-builder',
    ],
    items: [
      { href: '/admin/users', label: 'Usuarios y roles', icon: Users, adminOnly: true },
      { href: '/admin/catalogs', label: 'Catálogos', icon: ListChecks, adminOnly: true },
      { href: '/indicadores', label: 'Indicadores (KPIs)', icon: LineChart, adminOnly: true },
      { href: '/indicadores_formulas', label: 'Fórmulas de indicadores', icon: FunctionSquare, adminOnly: true },
      { href: '/flujos_estatus', label: 'Flujos de estatus', icon: Workflow, adminOnly: true },
      { href: '/admin/module-views', label: 'Module views y builder', icon: LayoutTemplate, adminOnly: true },
      { href: '/query-builder', label: 'Query builder (datos)', icon: FunctionSquare, adminOnly: true },
      { href: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText, adminOnly: true },
      { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
    ],
    adminOnly: true,
  },
  {
    id: 'dev',
    title: 'Cuenta y laboratorio',
    emoji: '🔧',
    pathPrefixes: ['/profile', '/kitchen-sink', '/uploads', '/tasks'],
    items: [
      { href: '/profile', label: 'Perfil', icon: UserCircle },
      { href: '/uploads', label: 'Archivos (uploads)', icon: Upload },
      { href: '/tasks', label: 'Tareas (legado)', icon: ListChecks },
      { href: '/kitchen-sink', label: 'Kitchen sink', icon: AppWindow, adminOnly: true },
    ],
  },
];

function sectionShouldOpen(pathname: string, section: NavSectionDef): boolean {
  return section.pathPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

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
      <div
        className={cn(
          'flex h-14 items-center gap-2 border-b border-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">A</span>
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">AppSec</span>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
        {NAV_SECTIONS.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          const visibleItems = section.items.filter((i) => !i.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          const defaultOpen = sectionShouldOpen(pathname, section) || section.id === 'dashboards';

          return (
            <CollapsibleNavSection
              key={section.id}
              title={section.title}
              emoji={section.emoji}
              defaultOpen={defaultOpen}
            >
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
            </CollapsibleNavSection>
          );
        })}
      </nav>

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
