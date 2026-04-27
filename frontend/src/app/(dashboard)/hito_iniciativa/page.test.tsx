import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HitoIniciativaPage from '../hito_iniciativas/page';
import * as hooks from '@/hooks/useHitoIniciativas';

vi.mock('@/hooks/useHitoIniciativas');

function HitoIniciativaTestWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

const wrapper = HitoIniciativaTestWrapper;

describe('HitoIniciativaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders milestones list', () => {
    const mockHitos = [{ id: '1', nombre: 'Phase 1', fecha_objetivo: '2024-06-30', estado: 'pendiente' }];
    vi.mocked(hooks.useHitoIniciativas).mockReturnValueOnce({ data: mockHitos, isLoading: false } as any);
    render(<HitoIniciativaPage />, { wrapper });
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useHitoIniciativas).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<HitoIniciativaPage />, { wrapper });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
