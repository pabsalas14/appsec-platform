'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RiskScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RISK_LEVELS = [
  { min: 0, max: 25, label: 'Muy Bajo', color: 'text-green-600', bg: 'bg-green-500' },
  { min: 26, max: 50, label: 'Bajo', color: 'text-green-500', bg: 'bg-green-400' },
  { min: 51, max: 75, label: 'Medio', color: 'text-yellow-600', bg: 'bg-yellow-500' },
  { min: 76, max: 90, label: 'Alto', color: 'text-orange-600', bg: 'bg-orange-500' },
  { min: 91, max: 100, label: 'Crítico', color: 'text-red-600', bg: 'bg-red-500' },
];

export function RiskScoreGauge({ score, size = 'md', showLabel = true }: RiskScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const riskLevel = RISK_LEVELS.find(level => clampedScore >= level.min && clampedScore <= level.max) || RISK_LEVELS[0];

  const sizeClasses = {
    sm: {
      container: 'w-24 h-24',
      text: 'text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'w-32 h-32',
      text: 'text-xl',
      label: 'text-sm',
    },
    lg: {
      container: 'w-40 h-40',
      text: 'text-2xl',
      label: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <Card className="inline-block">
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-2">
          {/* Circular Progress */}
          <div className={`relative ${classes.container}`}>
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - clampedScore / 100)}`}
                className={riskLevel.bg}
                strokeLinecap="round"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-bold ${classes.text} ${riskLevel.color}`}>
                {clampedScore}
              </span>
            </div>
          </div>

          {/* Risk level label */}
          {showLabel && (
            <div className="text-center">
              <div className={`font-medium ${classes.label} ${riskLevel.color}`}>
                {riskLevel.label}
              </div>
              <div className="text-xs text-muted-foreground">
                Riesgo
              </div>
            </div>
          )}

          {/* Linear progress bar */}
          <div className="w-full max-w-32">
            <Progress
              value={clampedScore}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}