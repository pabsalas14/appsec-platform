import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IndicadoresFormulasPage from './page';
import * as hooks from '@/hooks/useIndicadorFormulas';

vi.mock('@/hooks/useIndicadorFormulas');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('IndicadoresFormulasPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders KPI formulas list', () => {
    const mockFormulas = [
      { id: '1', code: 'VULN_RATE', nombre: 'Vulnerability Rate', motor: 'sql', formula: {} },
    ];
    vi.mocked(hooks.useIndicadorFormulas).mockReturnValue({ data: mockFormulas, isLoading: false } as any);
    render(<IndicadoresFormulasPage />, { wrapper });
    expect(screen.getByText('Vulnerability Rate')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useIndicadorFormulas).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<IndicadoresFormulasPage />, { wrapper });
    expect(screen.getByText(/Fórmulas de Indicadores/i)).toBeInTheDocument();
  });
});
