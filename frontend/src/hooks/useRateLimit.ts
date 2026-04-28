import { useMemo } from "react";

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  percentage: number;
  isAtLimit: boolean;
  resetAt: Date | null;
}

interface UseRateLimitResult {
  rateLimitInfo: RateLimitInfo | null;
}

export function useRateLimit(): UseRateLimitResult {
  // Hook placeholder: backend headers wiring can populate this later.
  return useMemo(
    () => ({
      rateLimitInfo: null,
    }),
    []
  );
}
