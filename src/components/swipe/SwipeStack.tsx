'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Heart, X } from 'lucide-react';
import { SwipeCard } from './SwipeCard';
import { Button, GlassPanel, Spinner, MonoText } from '@/components/ui';
import { useSwipeStore } from '@/stores';
import { RedditComment } from '@/types';
import { VISIBLE_CARDS, INITIAL_DOSSIER_THRESHOLD, REFINEMENT_DOSSIER_INTERVAL } from '@/lib/utils';

export function SwipeStack() {
  const {
    cardQueue,
    currentIndex,
    isLoading,
    error,
    totalSwipes,
    likesCount,
    dislikesCount,
    swipeCard,
    needsMoreCards,
    getVisibleCards,
    setLoading,
    setError,
    addCards,
  } = useSwipeStore();

  const [commentsCache, setCommentsCache] = useState<Record<string, RedditComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  const visibleCards = getVisibleCards();
  const currentCard = visibleCards[0];

  // Fetch comments for current card
  const fetchComments = useCallback(async (permalink: string, redditId: string) => {
    if (commentsCache[redditId]) return;

    setLoadingComments(redditId);
    try {
      const response = await fetch(`/api/reddit/comments?permalink=${encodeURIComponent(permalink)}`);
      const data = await response.json();

      if (data.comments) {
        setCommentsCache(prev => ({
          ...prev,
          [redditId]: data.comments,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(null);
    }
  }, [commentsCache]);

  // Fetch comments when current card changes
  useEffect(() => {
    if (currentCard && !commentsCache[currentCard.reddit_id]) {
      fetchComments(currentCard.permalink, currentCard.reddit_id);
    }
  }, [currentCard, commentsCache, fetchComments]);

  // Prefetch comments for next card
  useEffect(() => {
    const nextCard = visibleCards[1];
    if (nextCard && !commentsCache[nextCard.reddit_id]) {
      fetchComments(nextCard.permalink, nextCard.reddit_id);
    }
  }, [visibleCards, commentsCache, fetchComments]);

  // Fetch more posts when needed
  const fetchMorePosts = useCallback(async () => {
    if (isLoading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reddit/fetch');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.posts) {
        addCards(data.posts);
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [isLoading, setLoading, setError, addCards]);

  // Initial load
  useEffect(() => {
    if (cardQueue.length === 0 && !isLoading) {
      fetchMorePosts();
    }
  }, [cardQueue.length, isLoading, fetchMorePosts]);

  // Prefetch when running low
  useEffect(() => {
    if (needsMoreCards() && !isLoading) {
      fetchMorePosts();
    }
  }, [currentIndex, needsMoreCards, isLoading, fetchMorePosts]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    const action = direction === 'right' ? 'like' : 'dislike';
    const swipedCard = swipeCard(action);

    if (swipedCard) {
      // Record swipe to database
      try {
        await fetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reddit_id: swipedCard.reddit_id,
            action,
            subreddit: swipedCard.subreddit,
            post_title: swipedCard.title,
            post_score: swipedCard.score,
            post_url: `https://reddit.com${swipedCard.permalink}`,
          }),
        });
      } catch (err) {
        console.error('Failed to record swipe:', err);
      }
    }
  }, [swipeCard]);

  // Calculate progress to next dossier
  const nextDossierAt = totalSwipes < INITIAL_DOSSIER_THRESHOLD
    ? INITIAL_DOSSIER_THRESHOLD
    : Math.ceil((totalSwipes - INITIAL_DOSSIER_THRESHOLD) / REFINEMENT_DOSSIER_INTERVAL + 1) *
      REFINEMENT_DOSSIER_INTERVAL + INITIAL_DOSSIER_THRESHOLD;
  const progressToNext = totalSwipes < INITIAL_DOSSIER_THRESHOLD
    ? (totalSwipes / INITIAL_DOSSIER_THRESHOLD) * 100
    : ((totalSwipes - (nextDossierAt - REFINEMENT_DOSSIER_INTERVAL)) / REFINEMENT_DOSSIER_INTERVAL) * 100;

  if (error) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={fetchMorePosts}>Try Again</Button>
      </GlassPanel>
    );
  }

  if (isLoading && visibleCards.length === 0) {
    return (
      <GlassPanel className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <Spinner size="lg" />
        <p className="mt-4 text-foreground-muted">Loading posts...</p>
      </GlassPanel>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-foreground-muted mb-4">No more posts available</p>
        <Button onClick={fetchMorePosts}>Load More</Button>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <MonoText className="text-2xl font-bold">{totalSwipes}</MonoText>
            <MonoText muted className="text-xs">Total Swipes</MonoText>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Heart className="w-4 h-4 text-success fill-success" />
              <MonoText className="text-xl font-bold text-success">{likesCount}</MonoText>
            </div>
            <MonoText muted className="text-xs">Liked</MonoText>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <X className="w-4 h-4 text-danger" />
              <MonoText className="text-xl font-bold text-danger">{dislikesCount}</MonoText>
            </div>
            <MonoText muted className="text-xs">Skipped</MonoText>
          </div>
        </div>
        <div className="text-right">
          <MonoText muted className="text-xs block mb-1">
            DNA Update in {nextDossierAt - totalSwipes} swipes
          </MonoText>
          <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full h-[550px]">
        <AnimatePresence mode="popLayout">
          {visibleCards.slice(0, VISIBLE_CARDS).reverse().map((post, index) => {
            const isTop = index === visibleCards.length - 1;
            return (
              <SwipeCard
                key={post.reddit_id}
                post={post}
                comments={commentsCache[post.reddit_id] || []}
                isTop={isTop}
                onSwipe={handleSwipe}
              />
            );
          })}
        </AnimatePresence>

        {/* Loading Comments Indicator */}
        {loadingComments && loadingComments === currentCard?.reddit_id && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-2">
            <Spinner size="sm" />
            <MonoText muted className="text-xs">Loading comments...</MonoText>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="secondary"
          size="lg"
          className="w-20 h-20 rounded-full border-2 border-danger/30 hover:border-danger hover:bg-danger/10 transition-all"
          onClick={() => handleSwipe('left')}
        >
          <X className="w-8 h-8 text-danger" />
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="w-20 h-20 rounded-full border-2 border-success/30 hover:border-success bg-success/20 hover:bg-success/30 transition-all"
          onClick={() => handleSwipe('right')}
        >
          <Heart className="w-8 h-8 text-success" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center">
        <MonoText muted className="text-xs">
          Drag card or use keyboard: ← Skip | → Like
        </MonoText>
      </div>
    </div>
  );
}
