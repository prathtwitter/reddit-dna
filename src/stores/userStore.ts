'use client';

import { create } from 'zustand';
import { UserStats, UserPreferences, DNADossier } from '@/types';
import { FIXED_USER_ID } from '@/lib/utils';

interface UserState {
  stats: UserStats | null;
  currentDossier: DNADossier | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStats: (stats: UserStats) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setDossier: (dossier: DNADossier) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  shouldGenerateDossier: (currentSwipes: number, threshold: number, interval: number) => boolean;
}

const defaultPreferences: UserPreferences = {
  newsletter_enabled: true,
  newsletter_time: '08:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  excluded_subreddits: [],
};

export const useUserStore = create<UserState>((set, get) => ({
  stats: null,
  currentDossier: null,
  isLoading: false,
  error: null,

  setStats: (stats) => set({ stats }),

  updatePreferences: (prefs) => {
    const { stats } = get();
    if (!stats) return;

    set({
      stats: {
        ...stats,
        preferences: {
          ...stats.preferences,
          ...prefs,
        },
      },
    });
  },

  setDossier: (dossier) => set({ currentDossier: dossier }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  shouldGenerateDossier: (currentSwipes, threshold, interval) => {
    const { stats } = get();
    if (!stats) return false;

    const lastCount = stats.last_dossier_swipe_count;

    // Initial dossier at threshold
    if (lastCount === 0 && currentSwipes >= threshold) {
      return true;
    }

    // Refinements every interval after initial
    if (lastCount >= threshold && currentSwipes >= lastCount + interval) {
      return true;
    }

    return false;
  },
}));
