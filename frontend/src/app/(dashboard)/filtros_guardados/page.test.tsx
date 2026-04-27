import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FiltrosGuardadosPage from './page';
import * as hooks from '@/hooks/useFiltrosGuardados';

vi.mock('@/hooks/useFiltrosGuardados');

const createWrapper = () => {
  const queryClient = new QueryClient();
  function QueryClientTestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('FiltrosGuardadosPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => {
    vi.mocked(hooks.useFiltrosGuardados).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
    } as any);

    render(<FiltrosGuardadosPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders empty state when no filters', async () => {
    vi.mocked(hooks.useFiltrosGuardados).mockReturnValueOnce({
      data: [],
      isLoading: false,
    } as any);

    render(<FiltrosGuardadosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Sin filtros guardados/i)).toBeInTheDocument();
    });
  });

  it('renders saved filters list', async () => {
    const mockFilters = [
      {
        id: '1',
        nombre: 'Critical Vulnerabilities',
        modulo: 'vulnerabilidads',
        parametros: { severidad: 'Crítica' },
        compartido: false,
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.useFiltrosGuardados).mockReturnValueOnce({
      data: mockFilters,
      isLoading: false,
    } as any);

    render(<FiltrosGuardadosPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Critical Vulnerabilities')).toBeInTheDocument();
  });

  it('renders create filter dialog button', () => {
    vi.mocked(hooks.useFiltrosGuardados).mockReturnValueOnce({
      data: [],
      isLoading: false,
    } as any);

    render(<FiltrosGuardadosPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Guardar filtro/i)).toBeInTheDocument();
  });

  it('displays filter metadata correctly', () => {
    const mockFilters = [
      {
        id: '1',
        nombre: 'Test Filter',
        modulo: 'vulnerabilidads',
        parametros: { test: 'value' },
        compartido: true,
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.useFiltrosGuardados).mockReturnValueOnce({
      data: mockFilters,
      isLoading: false,
    } as any);

    render(<FiltrosGuardadosPage />, { wrapper: createWrapper() });

    expect(screen.getByText('vulnerabilidads')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument(); // compartido
  });
});
