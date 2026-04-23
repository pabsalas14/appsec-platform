'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary.
 *
 * Catches render-time exceptions in the React tree, reports them via
 * `logger.error("ui.crash", ...)` and shows a minimal fallback. Runtime
 * (non-React) errors are handled by the `window.error` /
 * `unhandledrejection` listeners in `providers.tsx`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ui.crash', {
      message: error.message,
      stack: error.stack,
      component_stack: info.componentStack,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full w-full items-center justify-center p-8 text-center">
            <div>
              <h1 className="text-xl font-semibold">Something went wrong</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The error has been reported. Try refreshing the page.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
