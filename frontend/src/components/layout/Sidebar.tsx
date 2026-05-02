"use client";

import {
  AppWindow,
  Bell,
  Briefcase,
  Bug,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  Network,
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
import { usePathname } from 'next/navigation';

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

/** Arquitectura menú v3 — navegación relacional; SCR se mantiene aparte (producto). */
const SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboards/executive', label: 'Dashboard ejecutivo', icon: LayoutDashboard },
      { href: '/madurez', label: 'Score de madurez', icon: TrendingUp },
      { href: '/dashboards', label: 'Índice de tableros', icon: LayoutDashboard },
      { href: '/notificacions', label: 'Notificaciones', icon: Bell },
    ],
  },
  {
    title: 'Organización e inventario',
    items: [
      { href: '/organizacion/jerarquia', label: 'Estructura organizacional', icon: Network },
      { href: '/inventario', label: 'Inventario de activos', icon: Briefcase },
    ],
  },
  {
    title: 'Gestión de vulnerabilidades',
    items: [
      { href: '/dashboards/vulnerabilities', label: 'Concentrado de hallazgos', icon: ShieldCheck },
      { href: '/plan_remediacions', label: 'Planes de remediación', icon: ClipboardList },
      { href: '/programa_threat_modelings', label: 'Threat modeling', icon: Network },
    ],
  },
  {
    title: 'Operación y seguimiento',
    items: [
      { href: '/dashboards/releases', label: 'Liberaciones de servicio', icon: Server },
      { href: '/dashboards/programs', label: 'Programas anuales', icon: Target },
      { href: '/dashboards/emerging-themes', label: 'Temas emergentes y auditorías', icon: FileSearch },
      { href: '/iniciativas', label: 'Iniciativas', icon: Target },
      { href: '/revision_terceros', label: 'Revisión de terceros', icon: FileWarning },
    ],
  },
  {
    title: 'Desempeño (OKR)',
    items: [
      { href: '/mis_compromisos', label: 'Mis compromisos', icon: UserCircle },
      { href: '/dashboards/team', label: 'Mi equipo', icon: Users },
    ],
  },
  {
    title: 'Code Security (SCR)',
    items: [
      { href: '/code_security_reviews/dashboard', label: 'Dashboard SCR', icon: LayoutDashboard },
      { href: '/code_security_reviews/new', label: 'Nuevo escaneo', icon: FileSearch },
      { href: '/code_security_reviews/findings', label: 'Hallazgos SCR', icon: Bug },
      { href: '/code_security_reviews/history', label: 'Historial de escaneos', icon: ScrollText },
      { href: '/code_security_reviews/forensic', label: 'Investigación forense', icon: Network },
      { href: '/code_security_reviews/agents', label: 'Agentes', icon: ShieldCheck },
    ],
  },
  {
    title: 'Administración',
    adminOnly: true,
    items: [{ href: '/admin', label: 'Administración', icon: Settings, adminOnly: true }],
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

function isItemActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
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
          active={isItemActive(pathname, item.href)}
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

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
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
                  <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
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
                        active={isItemActive(pathname, item.href)}
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
                <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">{renderItems(visibleItems)}</div>
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
