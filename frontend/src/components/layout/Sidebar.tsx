"use client";

import {
  AppWindow,
  Bug,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Layers,
  ListTodo,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  Upload,
  UserCircle,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSidebarState } from '@/hooks/useSidebarState';
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
      { href: '/dashboards', label: 'Dashboards', icon: LayoutDashboard },
      { href: '/dashboards/executive', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
      { href: '/dashboards/vulnerabilities', label: 'Dashboard Vulnerabilidades', icon: ShieldCheck },
      { href: '/dashboards/team', label: 'Dashboard Team', icon: Users },
      { href: '/dashboards/releases', label: 'Dashboard Releases', icon: Layers },
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
    title: 'Administración',
    adminOnly: true,
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
      { href: '/admin/roles', label: 'Roles', icon: ShieldCheck, adminOnly: true },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
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
  const isAdmin = user?.role === 'admin';

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
