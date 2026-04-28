'use client';

import { Moon, Sun, Monitor, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useUpdateThemePreference } from '@/hooks/useThemePreference';

const THEMES = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Interfaz con fondo blanco',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Oscuro',
    description: 'Interfaz con fondo oscuro',
    icon: Moon,
  },
  {
    id: 'system',
    label: 'Sistema',
    description: 'Usar configuración del dispositivo',
    icon: Monitor,
  },
];

export function ThemeSettingsTab() {
  const { theme: currentTheme, setTheme } = useTheme();
  const updatePreference = useUpdateThemePreference();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system' | null>(null);

  useEffect(() => {
    setSelectedTheme((currentTheme || 'system') as 'light' | 'dark' | 'system');
  }, [currentTheme]);

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      setTheme(theme);
      setSelectedTheme(theme);

      // Guardar preferencia en servidor
      await updatePreference.mutateAsync(theme);
      toast.success('Tema actualizado');
    } catch (_err) {
      toast.error('Error al actualizar tema');
      setTheme(currentTheme || 'system');
      setSelectedTheme((currentTheme || 'system') as 'light' | 'dark' | 'system');
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Tu preferencia de tema se guardará en tu perfil y se sincronizará en todos tus dispositivos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {THEMES.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = selectedTheme === themeOption.id;

          return (
            <Card
              key={themeOption.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleThemeChange(themeOption.id as 'light' | 'dark' | 'system')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{themeOption.label}</CardTitle>
                    <CardDescription>{themeOption.description}</CardDescription>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    {isSelected && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {updatePreference.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando preferencia...
        </div>
      )}
    </div>
  );
}
