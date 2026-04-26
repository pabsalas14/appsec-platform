import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MadurezPage from './page';
import * as hooks from '@/hooks/useMadurez';

vi.mock('@/hooks/useMadurez');
vi.mock('@/hooks/useDashboardHierarchyFilters', () => ({
  useDashboardHierarchyFilters: () => ({
    filters: { subdireccion_id: null, gerencia_id: null, organizacion_id: null, celula_id: null },
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    applyFilters: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('MadurezPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => {
    vi.mocked(hooks.useMadurez).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<MadurezPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('renders empty state when no data', async () => {
    vi.mocked(hooks.useMadurez).mockReturnValueOnce({
      data: null,
      isLoading: false,
      isError: false,
    } as any);

    render(<MadurezPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Sin datos/i)).toBeInTheDocument();
    });
  });

  it('renders maturity score and metrics', async () => {
    const mockData = {
      score: 75,
      total: 100,
      cerradas: 75,
      activas: 25,
      by_celula: [],
      by_organizacion: [],
    };

    vi.mocked(hooks.useMadurez).mockReturnValueOnce({
      data: mockData,
      isLoading: false,
      isError: false,
    } as any);

    render(<MadurezPage />, { wrapper: createWrapper() });

    expect(screen.getByText('75')).toBeInTheDocument(); // Score
    expect(screen.getByText('100')).toBeInTheDocument(); // Total
  });

  it('renders export CSV button', () => {
    vi.mocked(hooks.useMadurez).mockReturnValueOnce({
      data: { score: 75, total: 100, cerradas: 75, activas: 25 },
      isLoading: false,
      isError: false,
    } as any);

    render(<MadurezPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Exportar CSV/i)).toBeInTheDocument();
  });

  it('displays breakdown by celula when available', async () => {
    const mockData = {
      score: 75,
      total: 100,
      cerradas: 75,
      activas: 25,
      by_celula: [
        { celula: 'Security Team', score: 85, total: 30 },
        { celula: 'Engineering', score: 70, total: 70 },
      ],
    };

    vi.mocked(hooks.useMadurez).mockReturnValueOnce({
      data: mockData,
      isLoading: false,
      isError: false,
    } as any);

    render(<MadurezPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Security Team/)).toBeInTheDocument();
  });
});
