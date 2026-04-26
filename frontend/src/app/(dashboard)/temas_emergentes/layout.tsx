import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function TemasEmergentesLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/temas_emergentes"
      tabs={[
        { href: '/temas_emergentes', label: 'Tablero analítico' },
        { href: '/temas_emergentes/registros', label: 'Registros' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
