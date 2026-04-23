import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'xs';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      className,
      disabled,
      ...props
    },
    ref,
  ) {
  const variants = {
    primary:
      'bg-primary-500 text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500/50',
    secondary:
      'bg-white/[0.03] border border-white/[0.06] text-foreground hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20',
    danger:
      'bg-red-600 text-white shadow-md hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50',
    ghost:
      'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] focus:outline-none',
    outline:
      'border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20',
    glass:
      'bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-foreground shadow-lg hover:bg-white/[0.08] hover:border-white/[0.15] active:scale-[0.98] focus:outline-none',
  };

  const sizes = {
    xs: 'text-xs py-1 px-2 rounded-md',
    sm: 'text-sm py-1.5 px-3 rounded-lg',
    md: 'text-sm py-2 px-4 rounded-lg',
    lg: 'text-base py-2.5 px-6 rounded-lg',
    icon: 'p-2 rounded-lg',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});
