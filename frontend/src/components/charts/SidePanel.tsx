'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface SidePanelTab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  tabs?: SidePanelTab[];
  children?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  className?: string;
}

const widthClass = {
  sm: 'w-80',
  md: 'w-[500px]',
  lg: 'w-[700px]',
};

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  tabs,
  children,
  width = 'md',
  className,
}) => {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || 'default');

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background border-l border-border shadow-lg z-50 transition-transform duration-300 ease-out overflow-y-auto',
          widthClass[width],
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background p-4 z-10">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tabs && tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="p-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="p-4">{children}</div>
          )}
        </div>
      </div>
    </>
  );
};
