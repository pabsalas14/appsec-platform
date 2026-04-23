'use client';

import React, { useState, useMemo } from 'react';
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
  isBefore,
  isAfter,
  isWithinInterval,
  parse,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  /** ISO date string (yyyy-MM-dd) */
  from: string;
  /** ISO date string (yyyy-MM-dd) */
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function MiniCalendar({
  month,
  onMonthChange,
  selectedFrom,
  selectedTo,
  hoveredDate,
  onDateClick,
  onDateHover,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedFrom: Date | null;
  selectedTo: Date | null;
  hoveredDate: Date | null;
  onDateClick: (d: Date) => void;
  onDateHover: (d: Date | null) => void;
}) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const allDays = eachDayOfInterval({ start, end });
    // Pad to start on Monday (getDay: 0=Sun..6=Sat → convert to Mon=0..Sun=6)
    const firstDayOfWeek = (getDay(start) + 6) % 7;
    const padding = Array.from({ length: firstDayOfWeek }, () => null);
    return [...padding, ...allDays];
  }, [month]);

  const isInRange = (day: Date) => {
    if (selectedFrom && selectedTo) {
      return isWithinInterval(day, {
        start: isBefore(selectedFrom, selectedTo) ? selectedFrom : selectedTo,
        end: isAfter(selectedFrom, selectedTo) ? selectedFrom : selectedTo,
      });
    }
    if (selectedFrom && hoveredDate) {
      const rangeStart = isBefore(selectedFrom, hoveredDate) ? selectedFrom : hoveredDate;
      const rangeEnd = isAfter(selectedFrom, hoveredDate) ? selectedFrom : hoveredDate;
      return isWithinInterval(day, { start: rangeStart, end: rangeEnd });
    }
    return false;
  };

  const isSelected = (day: Date) =>
    (selectedFrom && isSameDay(day, selectedFrom)) ||
    (selectedTo && isSameDay(day, selectedTo));

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-3">
        <button
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
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              onMouseEnter={() => onDateHover(day)}
              className={cn(
                'h-8 w-full rounded-md text-xs transition-colors',
                isSelected(day)
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : isInRange(day)
                    ? 'bg-primary/15 text-foreground'
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

export function DateRangePicker({ from, to, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    try {
      return startOfMonth(parse(from, 'yyyy-MM-dd', new Date()));
    } catch {
      return startOfMonth(new Date());
    }
  });
  const [tempFrom, setTempFrom] = useState<Date | null>(null);
  const [tempTo, setTempTo] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const selectedFrom = tempFrom ?? (from ? parse(from, 'yyyy-MM-dd', new Date()) : null);
  const selectedTo = tempTo ?? (to ? parse(to, 'yyyy-MM-dd', new Date()) : null);

  const handleDateClick = (day: Date) => {
    if (!selectingEnd) {
      setTempFrom(day);
      setTempTo(null);
      setSelectingEnd(true);
    } else {
      const finalFrom = isBefore(day, tempFrom!) ? day : tempFrom!;
      const finalTo = isAfter(day, tempFrom!) ? day : tempFrom!;
      setTempFrom(null);
      setTempTo(null);
      setSelectingEnd(false);
      onChange(format(finalFrom, 'yyyy-MM-dd'), format(finalTo, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  const displayText = from && to
    ? `${format(parse(from, 'yyyy-MM-dd', new Date()), 'dd MMM', { locale: es })} — ${format(parse(to, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy', { locale: es })}`
    : 'Seleccionar rango';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'text-foreground shadow-sm transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'hover:border-muted-foreground/30',
            className,
          )}
          aria-label="Seleccionar rango de fechas"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-4">
        <MiniCalendar
          month={month}
          onMonthChange={setMonth}
          selectedFrom={selectingEnd ? tempFrom : selectedFrom}
          selectedTo={selectingEnd ? tempTo : selectedTo}
          hoveredDate={selectingEnd ? hoveredDate : null}
          onDateClick={handleDateClick}
          onDateHover={setHoveredDate}
        />
        {selectingEnd && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Selecciona la fecha final
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
