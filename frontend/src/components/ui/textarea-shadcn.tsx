import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ShadcnTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const ShadcnTextarea = React.forwardRef<HTMLTextAreaElement, ShadcnTextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = props.id || props.name;
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-foreground shadow-sm',
            'resize-y transition-all duration-200',
            'placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500/50 focus-visible:ring-red-500/40'
              : 'border-white/[0.08] hover:border-white/[0.15]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
ShadcnTextarea.displayName = 'Textarea';

export { ShadcnTextarea };
