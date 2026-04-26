import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function ProgramaSastsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/programa_sasts"
      tabs={[
        { href: '/programa_sasts', label: 'Tablero (consolidado)' },
        { href: '/programa_sasts/registros', label: 'Registros' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
