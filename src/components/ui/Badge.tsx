'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        // Variants
        variant === 'default' && 'bg-white/10 text-foreground-muted',
        variant === 'success' && 'bg-success/20 text-success',
        variant === 'warning' && 'bg-warning/20 text-warning',
        variant === 'danger' && 'bg-danger/20 text-danger',
        variant === 'accent' && 'bg-accent/20 text-accent',
        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        className
      )}
    >
      {children}
    </span>
  );
}
