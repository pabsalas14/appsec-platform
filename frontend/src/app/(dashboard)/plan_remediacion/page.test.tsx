import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanRemediacionPage from '../plan_remediacions/page';
import * as hooks from '@/hooks/usePlanRemediacions';

vi.mock('@/hooks/usePlanRemediacions');

const createWrapper = () => {
  const queryClient = new QueryClient();
  function QueryClientTestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('PlanRemediacionPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => {
    vi.mocked(hooks.usePlanRemediacions).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<PlanRemediacionPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.mocked(hooks.usePlanRemediacions).mockReturnValueOnce({ data: [], isLoading: false } as any);
    render(<PlanRemediacionPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(/Sin planes/i)).toBeInTheDocument());
  });

  it('renders plans list', () => {
    const mockPlans = [
      { id: '1', descripcion: 'Fix vulnerability', estado: 'pendiente', responsable: 'team' },
    ];
    vi.mocked(hooks.usePlanRemediacions).mockReturnValueOnce({ data: mockPlans, isLoading: false } as any);
    render(<PlanRemediacionPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Fix vulnerability')).toBeInTheDocument();
  });
});
