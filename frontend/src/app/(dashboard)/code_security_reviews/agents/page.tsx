'use client';

import { SCRAgentPromptConfig } from '@/components/admin/SCRAgentPromptConfig';
import { PageHeader, PageWrapper } from '@/components/ui';

export default function ScrAgentsHubPage() {
  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Agentes SCR"
        description="Configura Inspector, Detective y Fiscal: prompts, patrones, métricas y modelo LLM asignado."
      />
      <SCRAgentPromptConfig />
    </PageWrapper>
  );
}
