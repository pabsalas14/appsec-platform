'use client';

import { Loader2 } from 'lucide-react';

import { EmailLogsTab } from '@/components/email/EmailLogsTab';
import { EmailPreferencesTab } from '@/components/email/EmailPreferencesTab';
import { EmailTemplatesTab } from '@/components/email/EmailTemplatesTab';
import { Card, CardContent, PageHeader, PageWrapper, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isBackofficeUser } from '@/lib/roles';

export default function AdminEmailNotificationsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const allowed = isBackofficeUser(user?.role);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    );
  }

  if (!allowed) {
    return (
      <PageWrapper>
        <PageHeader title="Notificaciones por correo" description="Acceso restringido al backoffice." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Notificaciones por correo"
        description="Plantillas transaccionales, preferencias de usuario y bitácora de envíos."
      />
      <Card className="border-border/80 bg-card/60">
        <CardContent className="pt-6">
          <Tabs defaultValue="templates">
            <TabsList className="mb-6">
              <TabsTrigger value="templates">Plantillas</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="templates">
              <EmailTemplatesTab />
            </TabsContent>
            <TabsContent value="preferences">
              <EmailPreferencesTab />
            </TabsContent>
            <TabsContent value="logs">
              <EmailLogsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
