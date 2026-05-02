"use client";

import {
  AlertTriangle,
  Bug,
  Briefcase,
  Building2,
  ClipboardList,
  FileSearch,
  GitBranch,
  Globe2,
  Link2,
  Package,
  Server,
  Target,
  Users,
  FolderKanban,
  Layers,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Moon,
  Network,
  Plus,
  ScrollText,
  Settings,
  GanttChartSquare,
  Smartphone,
  Sun,
  Upload,
  UserCircle,
  Workflow,
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
import { isBackofficeUser } from '@/lib/roles';

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
  const isAdmin = isBackofficeUser(user?.role);

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
            <CommandItem onSelect={() => run(() => router.push('/mis_compromisos'))}>
              <Target className="mr-2 h-4 w-4" /> Mis Compromisos
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/okr_equipo'))}>
              <Users className="mr-2 h-4 w-4" /> Mi Equipo OKR
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/okr_dashboard'))}>
              <GanttChartSquare className="mr-2 h-4 w-4" /> Dashboard Ejecutivo OKR
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/vulnerabilidads/registros'))}>
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
            <CommandItem onSelect={() => run(() => router.push('/servicios'))}>
              <Server className="mr-2 h-4 w-4" /> Servicios
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/service_releases/registros'))}>
              <Package className="mr-2 h-4 w-4" /> Liberaciones de servicio
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/etapa_releases'))}>
              <ListChecks className="mr-2 h-4 w-4" /> Etapas de liberación
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/pipeline_releases'))}>
              <Workflow className="mr-2 h-4 w-4" /> Pipelines
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/iniciativas'))}>
              <Target className="mr-2 h-4 w-4" /> Iniciativas
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_sasts'))}>
              <Bug className="mr-2 h-4 w-4" /> Hallazgos SAST
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_dasts'))}>
              <Globe2 className="mr-2 h-4 w-4" /> Hallazgos DAST
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_masts'))}>
              <Smartphone className="mr-2 h-4 w-4" /> Hallazgos MAST
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_pipelines'))}>
              <Workflow className="mr-2 h-4 w-4" /> Hallazgos pipeline
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_terceros'))}>
              <Building2 className="mr-2 h-4 w-4" /> Hallazgos tercero
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/hallazgo_auditorias'))}>
              <FileSearch className="mr-2 h-4 w-4" /> Hallazgos auditoría
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboards
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push('/dashboards/hub'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard Hub operativo
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
              <CommandItem onSelect={() => run(() => router.push('/admin'))}>
                <Settings className="mr-2 h-4 w-4" /> Centro de administración
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/users'))}>
                <Users className="mr-2 h-4 w-4" /> Users
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/roles'))}>
                <Users className="mr-2 h-4 w-4" /> Roles
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/module-views'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Module Views
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/custom-fields'))}>
                <ClipboardList className="mr-2 h-4 w-4" /> Custom Fields
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/validation-rules'))}>
                <ListChecks className="mr-2 h-4 w-4" /> Validation Rules
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/formulas'))}>
                <FileSearch className="mr-2 h-4 w-4" /> Formulas
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/catalogs'))}>
                <ScrollText className="mr-2 h-4 w-4" /> Catalogs
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/ai-rules'))}>
                <AlertTriangle className="mr-2 h-4 w-4" /> AI Builder
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/ia-config'))}>
                <Settings className="mr-2 h-4 w-4" /> IA Config
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/dashboards/builder'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard Builder
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/audit-logs'))}>
                <ScrollText className="mr-2 h-4 w-4" /> Audit Logs
              </CommandItem>
              <CommandItem onSelect={() => run(() => router.push('/admin/settings'))}>
                <Settings className="mr-2 h-4 w-4" /> Configuración del sistema
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
