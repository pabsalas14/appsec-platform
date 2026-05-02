'use client';

import { useState } from 'react';
import { GitHubTokenConfig } from '@/components/admin/GitHubTokenConfig';
import { LLMProviderConfig } from '@/components/admin/LLMProviderConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader, PageWrapper } from '@/components/ui';

type TabId = 'github' | 'llm';

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'github', label: 'GitHub', description: 'Tokens validados, usuario, organizaciones y repos privados.' },
  { id: 'llm', label: 'LLM', description: 'Proveedores, modelos, API keys y endpoints locales/remotos.' },
];

export default function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('github');

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Integraciones SCR"
        description="Configura integraciones externas para escaneos reales: GitHub y proveedores LLM."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg border p-4 text-left transition ${
              activeTab === tab.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <p className="font-semibold">{tab.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tab.description}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{TABS.find((tab) => tab.id === activeTab)?.label}</CardTitle>
          <CardDescription>{TABS.find((tab) => tab.id === activeTab)?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'github' && <GitHubTokenConfig />}
          {activeTab === 'llm' && <LLMProviderConfig />}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
