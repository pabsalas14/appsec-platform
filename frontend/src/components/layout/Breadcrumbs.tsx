"use client";

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

const LABELS: Record<string, string> = {
  '': 'Inicio',
  tasks: 'Tareas',
  projects: 'Proyectos',
  kanban: 'Kanban',
  uploads: 'Archivos',
  admin: 'Administración',
  users: 'Usuarios',
  roles: 'Roles',
  'audit-logs': 'Registro de auditoría',
  settings: 'Configuración',
  profile: 'Perfil',
  'kitchen-sink': 'Kitchen sink',
  dashboards: 'Dashboards',
  executive: 'Ejecutivo',
  vulnerabilities: 'Vulnerabilidades',
  team: 'Equipo',
  programs: 'Programas',
  'program-detail': 'Detalle de programa',
  releases: 'Liberaciones',
  initiatives: 'Iniciativas',
  'emerging-themes': 'Temas emergentes',
  vulnerabilidads: 'Vulnerabilidades',
  'programa_threat_modelings': 'Programas de threat modeling',
  'sesion_threat_modelings': 'Sesiones de threat modeling',
  subdireccions: 'Subdirecciones',
  gerencias: 'Gerencias',
  organizacions: 'Organizaciones',
  celulas: 'Células',
  repositorios: 'Repositorios',
  'activo_webs': 'Activos web',
  'service_releases': 'Liberaciones de servicio',
  amenazas: 'Amenazas',
  iniciativas: 'Iniciativas',
};

function toLabel(segment: string): string {
  if (segment in LABELS) return LABELS[segment];
  // UUIDs and IDs → shortened
  if (/^[0-9a-f]{8}-/i.test(segment)) return segment.slice(0, 8);
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/" className="transition-colors hover:text-foreground">
        {LABELS['']}
      </Link>
      {segments.map((seg, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const isLast = idx === segments.length - 1;
        return (
          <Fragment key={href}>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            {isLast ? (
              <span className="truncate font-medium text-foreground">{toLabel(seg)}</span>
            ) : (
              <Link href={href} className="transition-colors hover:text-foreground">
                {toLabel(seg)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
