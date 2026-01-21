'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MonoTextProps {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div';
  muted?: boolean;
}

export function MonoText({
  children,
  className,
  as: Component = 'span',
  muted = false,
}: MonoTextProps) {
  return (
    <Component
      className={cn(
        'mono',
        muted && 'text-foreground-muted',
        className
      )}
    >
      {children}
    </Component>
  );
}
