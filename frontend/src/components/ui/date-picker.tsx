'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  parse,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** ISO date string yyyy-MM-dd */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Label shown above the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Name attribute for forms */
  name?: string;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function MiniCalendar({
  month,
  onMonthChange,
  selected,
  onDateClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: Date | null;
  onDateClick: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const allDays = eachDayOfInterval({ start, end });
    const firstDayOfWeek = (getDay(start) + 6) % 7;
    const padding: (Date | null)[] = Array.from({ length: firstDayOfWeek }, () => null);
    return [...padding, ...allDays];
  }, [month]);

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-foreground capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) =>
          day === null ? (
            <div key={`pad-${i}`} />
          ) : (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'h-8 w-full rounded-md text-xs transition-colors',
                selected && isSameDay(day, selected)
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : isToday(day)
                    ? 'bg-accent/60 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {format(day, 'd')}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/**
 * A polished single-date picker using a popover calendar.
 * Drop-in replacement for `<Input type="date" />`.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className,
  disabled,
  label,
  error,
  name,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsedValue = useMemo(() => {
    if (!value) return null;
    try {
      return parse(value, 'yyyy-MM-dd', new Date());
    } catch {
      return null;
    }
  }, [value]);

  const [month, setMonth] = useState(() =>
    parsedValue ? startOfMonth(parsedValue) : startOfMonth(new Date()),
  );

  const handleDateClick = useCallback(
    (day: Date) => {
      onChange(format(day, 'yyyy-MM-dd'));
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange],
  );

  const displayText = parsedValue
    ? format(parsedValue, 'dd MMM yyyy', { locale: es })
    : placeholder;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            name={name}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-lg border bg-white/[0.03] px-3 py-2 text-sm shadow-sm',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              parsedValue ? 'text-foreground' : 'text-muted-foreground/60',
              error
                ? 'border-red-500/50 focus-visible:ring-red-500/40'
                : 'border-white/[0.08] hover:border-white/[0.15]',
              className,
            )}
            aria-label={label || placeholder}
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate flex-1 text-left">{displayText}</span>
            {parsedValue && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent); }}
                className="text-muted-foreground/50 hover:text-foreground transition-colors text-xs"
                aria-label="Limpiar fecha"
              >
                ✕
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-4">
          <MiniCalendar
            month={month}
            onMonthChange={setMonth}
            selected={parsedValue}
            onDateClick={handleDateClick}
          />
          {parsedValue && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
            >
              Limpiar fecha
            </button>
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
