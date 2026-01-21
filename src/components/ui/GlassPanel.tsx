'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'solid';
  hover?: boolean;
  glow?: 'none' | 'accent' | 'success' | 'danger';
}

export function GlassPanel({
  children,
  className,
  variant = 'default',
  hover = false,
  glow = 'none',
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variant === 'default' && 'glass',
        variant === 'subtle' && 'glass-subtle',
        variant === 'solid' && 'bg-background-secondary border border-glass-border',
        hover && 'card-hover cursor-pointer',
        glow === 'accent' && 'glow-accent',
        glow === 'success' && 'glow-success',
        glow === 'danger' && 'glow-danger',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
