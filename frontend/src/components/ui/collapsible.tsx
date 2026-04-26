'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

type SectionProps = {
  title: string;
  emoji?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Sección de sidebar colapsable (patrón BRD: menú relacional, pocas secciones). */
export function CollapsibleNavSection({
  title,
  emoji,
  defaultOpen = true,
  className,
  children,
}: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('space-y-0.5', className)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/90 hover:bg-accent/50">
        <span className="flex items-center gap-1.5 truncate">
          {emoji ? <span aria-hidden>{emoji}</span> : null}
          {title}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pl-0 pt-0.5 data-[state=closed]:hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
