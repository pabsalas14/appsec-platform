'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: number;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  value: number[];
  onChange: (value: number[]) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export function MultiSelect({
  label,
  placeholder = 'Seleccionar...',
  options,
  value,
  onChange,
  required,
  error,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Position dropdown below trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const remove = (id: number, e: React.MouseEvent) => { e.stopPropagation(); onChange(value.filter((v) => v !== id)); };

  const filtered = options.filter(
    (o) => !search || o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[];

  return (
    <div className={cn('space-y-1.5', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
          {required && ' *'}
        </label>
      )}

      {/* Trigger */}
      <div
        ref={triggerRef}
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-white/[0.03] px-3 py-1.5 text-sm cursor-pointer',
          'transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-primary-500/40 focus-within:border-primary-500/50',
          error
            ? 'border-red-500/50'
            : 'border-white/[0.08] hover:border-white/[0.15]',
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedLabels.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 rounded-md bg-primary-500/15 border border-primary-500/30 px-2 py-0.5 text-xs font-medium text-primary-400"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => remove(opt.value, e)}
              className="text-primary-400/60 hover:text-primary-400 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[60px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-sm"
          placeholder={selectedLabels.length === 0 ? placeholder : ''}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform', open && 'rotate-180')} />
      </div>

      {/* Dropdown via portal */}
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-white/[0.08] bg-background/95 backdrop-blur-2xl shadow-xl shadow-black/30 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground/50">Sin resultados</div>
            ) : (
              filtered.map((opt) => {
                const selected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                      'hover:bg-white/[0.06]',
                      selected && 'text-primary-400'
                    )}
                    onClick={() => toggle(opt.value)}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        selected
                          ? 'border-primary-500 bg-primary-500/20'
                          : 'border-white/20 bg-white/[0.03]'
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
