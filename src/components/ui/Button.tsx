'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && [
            'bg-accent text-white hover:bg-accent-hover',
            'shadow-lg shadow-accent/25 hover:shadow-accent/40',
          ],
          variant === 'secondary' && [
            'bg-background-secondary text-foreground border border-glass-border',
            'hover:bg-white/5',
          ],
          variant === 'ghost' && [
            'text-foreground-muted hover:text-foreground hover:bg-white/5',
          ],
          variant === 'danger' && [
            'bg-danger text-white hover:bg-danger/90',
            'shadow-lg shadow-danger/25',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          size === 'icon' && 'w-10 h-10',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
