'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dna, Newspaper, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MonoText } from '@/components/ui';

const navItems = [
  { href: '/', label: 'Swipe', icon: Sparkles },
  { href: '/my-dna', label: 'My DNA', icon: Dna },
  { href: '/newsletter', label: 'Newsletter', icon: Newspaper },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Dna className="w-5 h-5 text-accent" />
          </div>
          <div className="hidden sm:block">
            <MonoText className="text-lg font-semibold tracking-tight">
              Reddit<span className="text-accent">DNA</span>
            </MonoText>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
