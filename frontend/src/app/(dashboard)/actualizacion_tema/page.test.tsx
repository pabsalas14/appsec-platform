import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActualizacionTemaPage from './page';
import * as hooks from '@/hooks/useActualizacionTemas';

vi.mock('@/hooks/useActualizacionTemas');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('ActualizacionTemaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders topic updates list', () => {
    const mockUpdates = [
      { id: '1', descripcion: 'CVE update', fuente: 'external', impacto_cambio: 'alto' },
    ];
    vi.mocked(hooks.useActualizacionTemas).mockReturnValueOnce({ data: mockUpdates, isLoading: false } as any);
    render(<ActualizacionTemaPage />, { wrapper });
    expect(screen.getByText('CVE update')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useActualizacionTemas).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<ActualizacionTemaPage />, { wrapper });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
