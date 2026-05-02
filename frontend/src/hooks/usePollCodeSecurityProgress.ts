'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ProgressData {
  progress: number;
  agent: string;
  activity: string;
  estado: string;
}

export function usePollCodeSecurityProgress(
  reviewId: string | undefined,
  enabled = true,
  onComplete?: () => void
) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollProgress = useCallback(async () => {
    if (!reviewId || !enabled) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/code_security_reviews/${reviewId}/stream`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data:'));

        for (const line of lines) {
          try {
            const jsonStr = line.replace('data: ', '');
            const progressData = JSON.parse(jsonStr);
            setData(progressData);

            if (progressData.estado === 'COMPLETED' || progressData.estado === 'FAILED') {
              onComplete?.();
              return;
            }
          } catch (_e) {
            // Silent parse error
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, enabled, onComplete]);

  useEffect(() => {
    if (!reviewId || !enabled) return;

    pollProgress();
    const interval = setInterval(pollProgress, 5000); // Poll every 5 seconds as fallback

    return () => clearInterval(interval);
  }, [reviewId, enabled, pollProgress]);

  return {
    data,
    isLoading,
    error,
  };
}
