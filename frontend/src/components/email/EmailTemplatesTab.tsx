'use client';

import { Copy, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui';
import { useEmailTemplates, type EmailTemplate } from '@/hooks/useEmailNotifications';

export function EmailTemplatesTab() {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const handleCopyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Plantillas transaccionales (backoffice). Contenido HTML y variables según el backend.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{template.nombre}</CardTitle>
                  <CardDescription className="mt-1">{template.descripcion ?? '—'}</CardDescription>
                </div>
                <Badge variant={template.activo ? 'default' : 'secondary'}>{template.activo ? 'Activa' : 'Inactiva'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Sheet open={selectedTemplate?.id === template.id} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setSelectedTemplate(template)}>
                    <Eye className="mr-1 h-3 w-3" />
                    Ver
                  </Button>
                </SheetTrigger>
                {selectedTemplate?.id === template.id && (
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{template.nombre}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium">Asunto</p>
                        <div className="mt-1 rounded-md bg-muted p-3 font-mono text-sm">{template.asunto}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contenido HTML</p>
                        <div className="mt-1 max-h-[400px] overflow-auto rounded-md bg-muted p-3">
                          <div
                            className="prose prose-sm dark:prose-invert text-sm"
                            dangerouslySetInnerHTML={{ __html: template.cuerpo_html }}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          type="button"
                          onClick={() => handleCopyToClipboard(template.cuerpo_html)}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Copiar HTML
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                )}
              </Sheet>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No hay plantillas disponibles</p>
        </div>
      )}
    </div>
  );
}
