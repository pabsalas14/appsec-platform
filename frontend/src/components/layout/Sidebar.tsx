"use client";

import {
  AppWindow,
  BarChart3,
  Bell,
  Bug,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  Network,
  Package,
  Rocket,
  Sigma,
  Smartphone,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCircle,
  Users,
  FileWarning,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { CollapsibleNavSection, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
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

type NavGroup = { title: string; items: NavItem[] };
type NavSection =
  | { title: string; items: NavItem[]; adminOnly?: boolean; groups?: undefined }
  | { title: string; groups: NavGroup[]; adminOnly?: boolean; items?: undefined };

/** 11 secciones — Dashboard + Registros por módulo (plan consolidado + ADR sidebar). */
const SECTIONS: NavSection[] = [
  {
    title: '1 · Dashboards',
    items: [
      { href: '/dashboards/executive', label: 'Dashboard ejecutivo', icon: LayoutDashboard },
      { href: '/madurez', label: 'Score de madurez', icon: TrendingUp },
      { href: '/dashboards', label: 'Índice de tableros', icon: LayoutGrid },
    ],
  },
  {
    title: '2 · Organización e inventario',
    items: [
      { href: '/organizacion/jerarquia', label: 'Dashboard / jerarquía', icon: Network },
      { href: '/inventario', label: 'Repositorios y activos', icon: Package },
    ],
  },
  {
    title: '3 · Gestión de vulnerabilidades',
    items: [
      { href: '/dashboards/vulnerabilities', label: 'Dashboard vulnerabilidades', icon: ShieldCheck },
      { href: '/dashboards/concentrado', label: 'Vista concentrada (motores)', icon: BarChart3 },
      { href: '/vulnerabilidads/registros', label: 'Registros de hallazgos', icon: Bug },
      { href: '/vulnerabilidads/import', label: 'Importación masiva', icon: FileSearch },
      { href: '/plan_remediacions', label: 'Planes de remediación', icon: ClipboardList },
      { href: '/excepcion_vulnerabilidads', label: 'Excepciones / riesgo aceptado', icon: FileWarning },
    ],
  },
  {
    title: '4 · Operación y liberaciones',
    items: [
      { href: '/dashboards/kanban', label: 'Dashboard Kanban', icon: Server },
      { href: '/dashboards/releases', label: 'Dashboard tabla liberaciones', icon: LayoutDashboard },
      { href: '/service_releases/registros', label: 'Servicios y liberaciones', icon: Package },
      { href: '/hallazgo_pipelines', label: 'Pipeline de escaneos', icon: GitBranch },
      { href: '/temas_emergentes/registros', label: 'Temas emergentes (registros)', icon: FileSearch },
    ],
  },
  {
    title: '5 · Programas anuales',
    items: [
      { href: '/dashboards/programs', label: 'Dashboard heatmap', icon: LineChart },
      { href: '/programas', label: 'Gestión de programas', icon: Target },
      { href: '/iniciativas/registros', label: 'Iniciativas', icon: Rocket },
      { href: '/auditorias/registros', label: 'Auditorías', icon: FileSearch },
      { href: '/servicio_regulado_registros', label: 'Servicios regulados', icon: ScrollText },
    ],
  },
  {
    title: '6 · Desempeño (OKR)',
    groups: [
      {
        title: 'Resumen',
        items: [
          { href: '/mis_compromisos', label: 'Mis compromisos', icon: UserCircle },
          { href: '/dashboards/team', label: 'Mi equipo', icon: Users },
          { href: '/okr_dashboard', label: 'Dashboard OKR', icon: LineChart },
        ],
      },
      {
        title: 'Registros OKR',
        items: [
          { href: '/okr_compromisos', label: 'Compromisos OKR', icon: ClipboardList },
          { href: '/okr_revision_qs', label: 'Revisiones Q', icon: FileSearch },
          { href: '/okr_cierre_qs', label: 'Cierre Q', icon: ScrollText },
        ],
      },
    ],
  },
  {
    title: '7 · Indicadores (KPIs)',
    groups: [
      {
        title: 'General',
        items: [
          { href: '/indicadores', label: 'Dashboard indicadores', icon: LineChart },
          { href: '/indicadores_formulas', label: 'Fórmulas', icon: Sigma },
        ],
      },
      {
        title: 'MAST — captura mensual',
        items: [
          { href: '/dashboards/mast', label: 'Dashboard MAST', icon: Smartphone },
          { href: '/indicadores?motor=MAST', label: 'KPIs MAST (tablero)', icon: LineChart },
          { href: '/ejecucion_masts', label: 'Ejecuciones MAST', icon: GitBranch },
          { href: '/vulnerabilidads/registros?fuente=MAST', label: 'Hallazgos fuente MAST', icon: Bug },
        ],
      },
    ],
  },
  {
    title: '8 · Code Security (SCR)',
    items: [
      { href: '/code_security_reviews/dashboard', label: 'Dashboard SCR', icon: LayoutDashboard },
      { href: '/code_security_reviews/new', label: 'Nuevo escaneo', icon: FileSearch },
      { href: '/code_security_reviews/findings', label: 'Hallazgos SCR', icon: Bug },
      { href: '/code_security_reviews/history', label: 'Historial', icon: ScrollText },
      { href: '/code_security_reviews/forensic', label: 'Investigación forense', icon: Network },
      { href: '/code_security_reviews/agents', label: 'Agentes', icon: ShieldCheck },
    ],
  },
  {
    title: '9 · Notificaciones',
    items: [
      { href: '/notificacions', label: 'Centro de notificaciones', icon: Bell },
      { href: '/notificacions/preferences', label: 'Preferencias', icon: Settings },
    ],
  },
  {
    title: '10 · Administración',
    adminOnly: true,
    items: [
      { href: '/admin', label: 'Panel admin', icon: Settings, adminOnly: true },
      { href: '/admin/operacion', label: 'Operación BRD', icon: Server, adminOnly: true },
      { href: '/admin/roles', label: 'Usuarios y roles', icon: Users, adminOnly: true },
      { href: '/admin/settings', label: 'Configuración', icon: ScrollText, adminOnly: true },
    ],
  },
  {
    title: '11 · Developer',
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
      prefetch={true}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-sm transition-all duration-150',
        'text-muted-foreground hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-foreground',
        active &&
          'border-primary/25 bg-primary/[0.12] text-foreground shadow-sm shadow-primary/5 dark:bg-primary/15',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100',
          active && 'text-primary opacity-100',
        )}
      />
      {!collapsed && <span className="truncate font-medium tracking-tight">{item.label}</span>}
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

/** Activo si coincide path; si `href` incluye query, también deben coincidir los params en la URL actual. */
function isItemActive(pathname: string, search: string, href: string) {
  const [pathPart, queryPart] = href.split('?');
  const base = pathPart || '/';
  const normSearch = search.startsWith('?') ? search.slice(1) : search;
  const have = new URLSearchParams(normSearch);

  if (base === '/') return pathname === '/';

  if (pathname !== base && !pathname.startsWith(`${base}/`)) return false;
  if (pathname !== base) return true;

  if (!queryPart) {
    const motor = have.get('motor');
    return motor == null || motor === '';
  }

  const want = new URLSearchParams(queryPart);
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false;
  }
  return true;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const { collapsed, toggle } = useSidebarState();
  const { data: user } = useCurrentUser();
  const isAdmin = isBackofficeUser(user?.role);

  const renderItems = (items: NavItem[]) =>
    items
      .filter((i) => !i.adminOnly || isAdmin)
      .map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          collapsed={collapsed}
          active={isItemActive(pathname, search, item.href)}
        />
      ));

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
          <span className="text-sm font-bold">F</span>
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">Plataforma AppSec</span>
        )}
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-2.5 py-4">
        {SECTIONS.map((section) => {
          if (section.adminOnly && !isAdmin) return null;

          if (section.groups) {
            const visibleGroups = section.groups
              .map((g) => ({
                ...g,
                items: g.items.filter((i) => !i.adminOnly || isAdmin),
              }))
              .filter((g) => g.items.length > 0);
            if (visibleGroups.length === 0) return null;

            return (
              <div key={section.title}>
                {!collapsed && (
                  <div className="mb-2.5 border-b border-white/[0.04] px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
                    {section.title}
                  </div>
                )}
                {collapsed ? (
                  <div className="space-y-0.5">
                    {visibleGroups.flatMap((g) => g.items).map((item) => (
                      <SidebarLink
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        active={isItemActive(pathname, search, item.href)}
                      />
                    ))}
                  </div>
                ) : (
                  visibleGroups.map((g) => (
                    <CollapsibleNavSection key={`${section.title}-${g.title}`} title={g.title} defaultOpen>
                      {renderItems(g.items)}
                    </CollapsibleNavSection>
                  ))
                )}
              </div>
            );
          }

          const visibleItems = section.items!.filter((i) => !i.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <div className="mb-2.5 border-b border-white/[0.04] px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">{renderItems(visibleItems)}</div>
            </div>
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
