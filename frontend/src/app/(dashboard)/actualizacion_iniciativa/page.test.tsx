import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActualizacionIniciativaPage from './page';
import * as hooks from '@/hooks/useActualizacionIniciativas';

vi.mock('@/hooks/useActualizacionIniciativas');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('ActualizacionIniciativaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders updates list', () => {
    const mockUpdates = [
      { id: '1', descripcion: 'Phase 1 progress', tipo: 'progreso', porcentaje_avance: 25 },
    ];
    vi.mocked(hooks.useActualizacionIniciativas).mockReturnValueOnce({ data: mockUpdates, isLoading: false } as any);
    render(<ActualizacionIniciativaPage />, { wrapper });
    expect(screen.getByText('Phase 1 progress')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useActualizacionIniciativas).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<ActualizacionIniciativaPage />, { wrapper });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
