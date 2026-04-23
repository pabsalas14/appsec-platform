import React from 'react';
import { cn } from '@/lib/utils';

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-primary-500', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="relative">
        <Spinner className="h-10 w-10" />
        <div className="absolute inset-0 h-10 w-10 rounded-full bg-primary-500/20 animate-ping" />
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}
