import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlujoEstatusPage from './page';
import * as hooks from '@/hooks/useFlujoEstatus';

vi.mock('@/hooks/useFlujoEstatus');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('FlujoEstatusPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders status flows list', () => {
    const mockFlows = [
      { id: '1', entity_type: 'vulnerabilidad', from_status: 'abierta', to_status: 'cerrada' },
    ];
    vi.mocked(hooks.useFlujoEstatus).mockReturnValueOnce({ data: mockFlows, isLoading: false } as any);
    render(<FlujoEstatusPage />, { wrapper });
    expect(screen.getByText('vulnerabilidad')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useFlujoEstatus).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<FlujoEstatusPage />, { wrapper });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
