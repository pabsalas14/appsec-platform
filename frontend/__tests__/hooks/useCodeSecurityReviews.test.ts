import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCodeSecurityReviews } from '@/hooks/useCodeSecurityReviews';

describe('useCodeSecurityReviews Hook', () => {
  it('should export useCodeSecurityReviews function', () => {
    expect(typeof useCodeSecurityReviews).toBe('function');
  });

  it('should return query object', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCodeSecurityReviews(), { wrapper });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
});
