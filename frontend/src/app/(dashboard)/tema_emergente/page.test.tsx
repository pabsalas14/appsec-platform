import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemaEmergentePage from '../temas_emergentes/registros/page';
import * as hooks from '@/hooks/useTemaEmergentes';

vi.mock('@/hooks/useTemaEmergentes');

const createWrapper = () => {
  const queryClient = new QueryClient();
  function QueryClientTestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('TemaEmergentePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => {
    vi.mocked(hooks.useTemaEmergentes).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
    } as any);

    render(<TemaEmergentePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.mocked(hooks.useTemaEmergentes).mockReturnValueOnce({
      data: [],
      isLoading: false,
    } as any);

    render(<TemaEmergentePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Sin temas emergentes/i)).toBeInTheDocument();
    });
  });

  it('renders emerging topics list', async () => {
    const mockTopics = [
      {
        id: '1',
        titulo: 'CVE-2024-001',
        descripcion: 'Critical vulnerability',
        tipo: 'tecnologico',
        impacto: 'alto',
        estado: 'abierto',
      },
    ];

    vi.mocked(hooks.useTemaEmergentes).mockReturnValueOnce({
      data: mockTopics,
      isLoading: false,
    } as any);

    render(<TemaEmergentePage />, { wrapper: createWrapper() });

    expect(screen.getByText('CVE-2024-001')).toBeInTheDocument();
  });

  it('renders create button', () => {
    vi.mocked(hooks.useTemaEmergentes).mockReturnValueOnce({
      data: [],
      isLoading: false,
    } as any);

    render(<TemaEmergentePage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Nuevo tema/i)).toBeInTheDocument();
  });
});
