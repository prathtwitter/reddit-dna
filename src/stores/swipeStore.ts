'use client';

import { create } from 'zustand';
import { RedditPost, SwipeAction } from '@/types';
import { PREFETCH_THRESHOLD, VISIBLE_CARDS } from '@/lib/utils';

interface SwipeState {
  // Card queue
  cardQueue: RedditPost[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;

  // Stats
  totalSwipes: number;
  likesCount: number;
  dislikesCount: number;

  // Seen posts (to prevent duplicates)
  seenPostIds: Set<string>;

  // Actions
  addCards: (posts: RedditPost[]) => void;
  swipeCard: (action: SwipeAction) => RedditPost | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markAsSeen: (postIds: string[]) => void;
  needsMoreCards: () => boolean;
  getCurrentCard: () => RedditPost | null;
  getVisibleCards: () => RedditPost[];
  resetStore: () => void;
  initializeFromDatabase: (stats: { totalSwipes: number; likesCount: number; dislikesCount: number }, seenIds: string[]) => void;
}

export const useSwipeStore = create<SwipeState>((set, get) => ({
  cardQueue: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  totalSwipes: 0,
  likesCount: 0,
  dislikesCount: 0,
  seenPostIds: new Set(),

  addCards: (posts) => {
    const { seenPostIds, cardQueue } = get();

    // Filter out already seen posts
    const newPosts = posts.filter(
      post => !seenPostIds.has(post.reddit_id) &&
        !cardQueue.some(c => c.reddit_id === post.reddit_id)
    );

    if (newPosts.length === 0) return;

    set(state => ({
      cardQueue: [...state.cardQueue, ...newPosts],
    }));
  },

  swipeCard: (action) => {
    const { cardQueue, currentIndex } = get();
    const currentCard = cardQueue[currentIndex];

    if (!currentCard) return null;

    set(state => ({
      currentIndex: state.currentIndex + 1,
      totalSwipes: state.totalSwipes + 1,
      likesCount: action === 'like' ? state.likesCount + 1 : state.likesCount,
      dislikesCount: action === 'dislike' ? state.dislikesCount + 1 : state.dislikesCount,
      seenPostIds: new Set([...state.seenPostIds, currentCard.reddit_id]),
    }));

    return currentCard;
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  markAsSeen: (postIds) => {
    set(state => ({
      seenPostIds: new Set([...state.seenPostIds, ...postIds]),
    }));
  },

  needsMoreCards: () => {
    const { cardQueue, currentIndex } = get();
    return cardQueue.length - currentIndex < PREFETCH_THRESHOLD;
  },

  getCurrentCard: () => {
    const { cardQueue, currentIndex } = get();
    return cardQueue[currentIndex] || null;
  },

  getVisibleCards: () => {
    const { cardQueue, currentIndex } = get();
    return cardQueue.slice(currentIndex, currentIndex + VISIBLE_CARDS);
  },

  resetStore: () => set({
    cardQueue: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
  }),

  initializeFromDatabase: (stats, seenIds) => {
    set({
      totalSwipes: stats.totalSwipes,
      likesCount: stats.likesCount,
      dislikesCount: stats.dislikesCount,
      seenPostIds: new Set(seenIds),
    });
  },
}));
