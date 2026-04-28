'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RateLimitInfo } from '@/hooks/useRateLimit';

interface RateLimitIndicatorProps {
  rateLimitInfo: RateLimitInfo | null;
}

export function RateLimitIndicator({ rateLimitInfo }: RateLimitIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!rateLimitInfo?.resetAt) return;

    const updateTime = () => {
      const now = new Date();
      const diffMs = rateLimitInfo.resetAt!.getTime() - now.getTime();
      const diffSecs = Math.ceil(diffMs / 1000);
      setTimeRemaining(diffSecs > 0 ? diffSecs : 0);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo?.resetAt]);

  if (!rateLimitInfo || rateLimitInfo.percentage > 25) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'resetting...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <Alert
      className={`mb-4 ${rateLimitInfo.isAtLimit ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {rateLimitInfo.isAtLimit
                ? 'Rate limit reached'
                : `Rate limit: ${rateLimitInfo.remaining} / ${rateLimitInfo.limit} remaining`}
            </span>
            {timeRemaining !== null && (
              <span className="text-xs text-gray-600">
                Resets in {formatTime(timeRemaining)}
              </span>
            )}
          </div>
          <Progress value={rateLimitInfo.percentage} className="h-2" />
          {rateLimitInfo.isAtLimit && (
            <p className="text-xs text-red-600 font-semibold">
              No more requests allowed. Please wait until the limit resets.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
