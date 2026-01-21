'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'accent' | 'success';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  variant = 'default',
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-foreground-muted">{value}</span>
          <span className="text-foreground-muted">{max}</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-white/10 overflow-hidden',
          size === 'sm' && 'h-1',
          size === 'md' && 'h-2',
          size === 'lg' && 'h-3'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variant === 'default' && 'bg-foreground-muted',
            variant === 'accent' && 'bg-accent',
            variant === 'success' && 'bg-success'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
