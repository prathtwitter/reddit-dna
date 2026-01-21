'use client';

import { useEffect, useCallback } from 'react';
import { SwipeStack } from '@/components/swipe';
import { useSwipeStore } from '@/stores';

export default function Home() {
  const { swipeCard, getCurrentCard } = useSwipeStore();

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      swipeCard('dislike');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      swipeCard('like');
    }
  }, [swipeCard, getCurrentCard]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gradient">Discover Your</span>
          <br />
          <span className="text-foreground">Intellectual DNA</span>
        </h1>
        <p className="text-foreground-muted">
          Swipe through content to build your personalized intelligence profile
        </p>
      </div>

      {/* Swipe Interface */}
      <SwipeStack />
    </div>
  );
}
