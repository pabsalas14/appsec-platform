import type { ReactNode } from 'react';

import { ModuleWorkspaceLayout } from '@/components/module/ModuleWorkspaceLayout';

export default function ServiceReleasesLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleWorkspaceLayout
      basePath="/service_releases"
      tabs={[
        { href: '/service_releases', label: 'Tablero (operación)' },
        { href: '/service_releases/registros', label: 'Registros' },
      ]}
    >
      {children}
    </ModuleWorkspaceLayout>
  );
}
