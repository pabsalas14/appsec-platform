'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Renders a dash instead of a check (for "select-all" partial state) */
  indeterminate?: boolean;
  /** Compat Radix/shadcn */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, onCheckedChange, onChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current!);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    const isChecked = indeterminate || checked;

    return (
      <label
        className={cn(
          'relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 cursor-pointer',
          isChecked
            ? 'border-primary-500 bg-primary-500/20 text-primary-400'
            : 'border-white/[0.15] bg-white/[0.03] text-transparent hover:border-white/[0.25]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={innerRef}
          type="checkbox"
          checked={checked}
          className="sr-only"
          {...props}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
        />
        {indeterminate ? (
          <Minus className="h-3.5 w-3.5" />
        ) : checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : null}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
