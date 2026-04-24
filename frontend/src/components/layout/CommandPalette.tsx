"use client";

import {
  AlertTriangle,
  Bug,
  Briefcase,
  Building2,
  ClipboardList,
  GitBranch,
  Globe2,
  Link2,
  Users,
  FolderKanban,
  Layers,
  LayoutDashboard,
  ListTodo,
  Moon,
  Network,
  Plus,
  ScrollText,
  Settings,
  Sun,
  Upload,
  UserCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type PaletteContextValue = {
  open: () => void;
  close: () => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPalette>');
  return ctx;
}

export function CommandPalette({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ctx = useMemo<PaletteContextValue>(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  );

  const run = useCallback((action: () => void) => {
    setIsOpen(false);
    // Defer so the dialog close animation doesn't race the route change.
    setTimeout(action, 0);
  }, []);

  return (
    <PaletteContext.Provider value={ctx}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => run(() => router.push('/'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/tasks'))}>
              <ListTodo className="mr-2 h-4 w-4" /> Tasks
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/projects'))}>
              <FolderKanban className="mr-2 h-4 w-4" /> Projects
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/kanban'))}>
              <FolderKanban className="mr-2 h-4 w-4" /> Kanban
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/uploads'))}>
              <Upload className="mr-2 h-4 w-4" /> Uploads
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/vulnerabilidads'))}>
              <Bug className="mr-2 h-4 w-4" /> Vulnerabilidades
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/subdireccions'))}>
              <Building2 className="mr-2 h-4 w-4" /> Subdirecciones
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/gerencias'))}>
              <Briefcase className="mr-2 h-4 w-4" /> Gerencias
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/organizacions'))}>
              <Globe2 className="mr-2 h-4 w-4" /> Organizaciones
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/celulas'))}>
              <Users className="mr-2 h-4 w-4" /> Células
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/repositorios'))}>
              <GitBranch className="mr-2 h-4 w-4" /> Repositorios
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/activo_webs'))}>
              <Link2 className="mr-2 h-4 w-4" /> Activos web
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboards
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/executive'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard Ejecutivo
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/vulnerabilities'))}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Dashboard Vulnerabilidades
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/team'))}>
              <Users className="mr-2 h-4 w-4" /> Dashboard Team
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/releases'))}>
              <Layers className="mr-2 h-4 w-4" /> Dashboard Releases
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/programs'))}>
              <Layers className="mr-2 h-4 w-4" /> Dashboard Programas
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/program-detail'))}>
              <Layers className="mr-2 h-4 w-4" /> Dashboard Detalle Programa
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/initiatives'))}>
              <Layers className="mr-2 h-4 w-4" /> Dashboard Iniciativas
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/emerging-themes'))}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Dashboard Temas Emergentes
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/programa_threat_modelings'))}>
              <Network className="mr-2 h-4 w-4" /> Programas de threat modeling
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/sesion_threat_modelings'))}>
              <ClipboardList className="mr-2 h-4 w-4" /> Sesiones de threat modeling
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/profile'))}>
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </CommandItem>
          </CommandGroup>

          {isAdmin && (
            <CommandGroup heading="Admin">
              <CommandItem onSelect={() => run(() => router.push('/admin/users'))}>
                <Users className="mr-2 h-4 w-4" /> Users
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/roles'))}>
                <Users className="mr-2 h-4 w-4" /> Roles
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/audit-logs'))}>
                <ScrollText className="mr-2 h-4 w-4" /> Audit Logs
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/settings'))}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(() => router.push('/tasks?new=1'))}>
              <Plus className="mr-2 h-4 w-4" /> Create Task
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/projects?new=1'))}>
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => run(() => setTheme('light'))}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme('dark'))}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme('system'))}>
              <Settings className="mr-2 h-4 w-4" /> System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </PaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="hidden h-9 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent md:inline-flex"
    >
      <span className="inline-flex items-center gap-1 text-muted-foreground/80">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
        </svg>
        Search...
      </span>
      <span className="ml-auto rounded border border-border px-1.5 text-[10px] font-medium leading-5 text-muted-foreground">
        Ctrl K
      </span>
    </button>
  );
}
