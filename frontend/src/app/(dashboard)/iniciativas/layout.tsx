import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function IniciativasLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/iniciativas"
      tabs={[
        { href: '/iniciativas', label: 'Tablero analítico' },
        { href: '/iniciativas/registros', label: 'Registros' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
