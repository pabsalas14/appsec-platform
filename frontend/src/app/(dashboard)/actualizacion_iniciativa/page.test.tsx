import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActualizacionIniciativaPage from '../actualizacion_iniciativas/page';
import * as hooks from '@/hooks/useActualizacionIniciativas';

vi.mock('@/hooks/useActualizacionIniciativas');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('ActualizacionIniciativaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders updates list', () => {
    const mockUpdates = [
      { id: '1', titulo: 'Phase 1 progress', contenido: 'Update', iniciativa_id: 'ini-1', created_at: new Date().toISOString() },
    ];
    vi.mocked(hooks.useActualizacionIniciativas).mockReturnValue({ data: mockUpdates, isLoading: false } as any);
    render(<ActualizacionIniciativaPage />, { wrapper });
    expect(screen.getByText('Phase 1 progress')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useActualizacionIniciativas).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<ActualizacionIniciativaPage />, { wrapper });
    expect(screen.getByText(/Actualizaciones de Iniciativas/i)).toBeInTheDocument();
  });
});
