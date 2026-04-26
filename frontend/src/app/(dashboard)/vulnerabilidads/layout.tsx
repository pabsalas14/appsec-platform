import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function VulnerabilidadsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/vulnerabilidads"
      tabs={[
        { href: '/vulnerabilidads', label: 'Tablero (concentrado)' },
        { href: '/vulnerabilidads/registros', label: 'Catálogo' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
