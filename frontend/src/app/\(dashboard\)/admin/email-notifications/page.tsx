'use client';

import { Mail, Settings, History } from 'lucide-react';
import { useState } from 'react';

import {
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { EmailPreferencesTab } from '@/components/email/EmailPreferencesTab';
import { EmailTemplatesTab } from '@/components/email/EmailTemplatesTab';
import { EmailLogsTab } from '@/components/email/EmailLogsTab';

export default function EmailNotificationsPage() {
  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <PageWrapper>
      <PageHeader
        title="Email Notifications"
        description="Gestiona tus preferencias de correo, plantillas y visualiza el historial de envíos"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferencias
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <EmailPreferencesTab />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="logs">
          <EmailLogsTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
