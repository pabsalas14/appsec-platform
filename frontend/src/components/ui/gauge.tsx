import React, { ReactNode } from 'react';

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  children?: ReactNode;
  className?: string;
}

interface GaugeContainerProps {
  children: ReactNode;
  className?: string;
}

interface GaugeValueDisplayProps {
  className?: string;
}

export function GaugeContainer({ children, className = '' }: GaugeContainerProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      {children}
    </div>
  );
}

export function Gauge({ value, min = 0, max = 100, children, className = '' }: GaugeProps) {
  const percentage = ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100;
  
  // Determine color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    if (pct >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColor = (pct: number) => {
    if (pct >= 80) return 'from-green-100 to-green-50';
    if (pct >= 60) return 'from-yellow-100 to-yellow-50';
    if (pct >= 40) return 'from-orange-100 to-orange-50';
    return 'from-red-100 to-red-50';
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getBgColor(percentage)} flex items-center justify-center border-4 border-gray-200`}>
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <div className={`text-center ${getColor(percentage)}`}>
            <div className="text-2xl font-bold">{Math.round(percentage)}</div>
            <div className="text-xs text-muted-foreground">%</div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export function GaugeValueDisplay({ className = '' }: GaugeValueDisplayProps) {
  return <div className={className} />;
}
