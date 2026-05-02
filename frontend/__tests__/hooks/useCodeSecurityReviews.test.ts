import { createElement, ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCodeSecurityReviews } from '@/hooks/useCodeSecurityReviews';

describe('useCodeSecurityReviews Hook', () => {
  it('should export useCodeSecurityReviews function', () => {
    expect(typeof useCodeSecurityReviews).toBe('function');
  });

  it('should return query object', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCodeSecurityReviews(), { wrapper });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
});
