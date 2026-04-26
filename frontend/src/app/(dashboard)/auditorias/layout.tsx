import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function AuditoriasLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/auditorias"
      tabs={[
        { href: '/auditorias', label: 'Resumen' },
        { href: '/auditorias/registros', label: 'Registros' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
