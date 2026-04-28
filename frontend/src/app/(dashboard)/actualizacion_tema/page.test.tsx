import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActualizacionTemaPage from '../actualizacion_temas/page';
import * as hooks from '@/hooks/useActualizacionTemas';

vi.mock('@/hooks/useActualizacionTemas');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('ActualizacionTemaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders topic updates list', () => {
    const mockUpdates = [
      { id: '1', titulo: 'CVE update', contenido: 'Detalle', tema_id: 'tema-1', fuente: 'external', created_at: new Date().toISOString() },
    ];
    vi.mocked(hooks.useActualizacionTemas).mockReturnValue({ data: mockUpdates, isLoading: false } as any);
    render(<ActualizacionTemaPage />, { wrapper });
    expect(screen.getByText('CVE update')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useActualizacionTemas).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<ActualizacionTemaPage />, { wrapper });
    expect(screen.getByText(/Actualizaciones de Temas Emergentes/i)).toBeInTheDocument();
  });
});
