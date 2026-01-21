'use client';

import { useEffect, useState } from 'react';
import { Settings, Bell, Clock, X, Plus, Trash2, Database, Download, RefreshCw } from 'lucide-react';
import { GlassPanel, Button, Badge, MonoText, Spinner } from '@/components/ui';
import { UserStats, UserPreferences } from '@/types';
import { FIXED_USER_ID } from '@/lib/utils';

export default function SettingsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState('');

  // Local form state
  const [preferences, setPreferences] = useState<UserPreferences>({
    newsletter_enabled: true,
    newsletter_time: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    excluded_subreddits: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/swipe');
      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
        if (data.stats.preferences) {
          setPreferences(data.stats.preferences);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // In a real app, you'd have an API endpoint for this
      // For now, we'll just update local state
      console.log('Saving preferences:', preferences);
      // Simulated save
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addExcludedSubreddit = () => {
    if (!newSubreddit.trim()) return;
    const cleaned = newSubreddit.trim().toLowerCase().replace(/^r\//, '');
    if (!preferences.excluded_subreddits.includes(cleaned)) {
      setPreferences({
        ...preferences,
        excluded_subreddits: [...preferences.excluded_subreddits, cleaned],
      });
    }
    setNewSubreddit('');
  };

  const removeExcludedSubreddit = (sub: string) => {
    setPreferences({
      ...preferences,
      excluded_subreddits: preferences.excluded_subreddits.filter(s => s !== sub),
    });
  };

  const exportData = async () => {
    // Export all user data as JSON
    const exportData = {
      stats,
      preferences,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reddit-dna-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">
          <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-foreground-muted text-sm">
          Customize your Reddit DNA experience
        </p>
      </div>

      {/* Stats Overview */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Your Stats</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <div className="text-2xl font-bold text-accent">
              {stats?.total_swipes || 0}
            </div>
            <MonoText muted className="text-xs">Total Swipes</MonoText>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <div className="text-2xl font-bold text-success">
              {stats?.likes_count || 0}
            </div>
            <MonoText muted className="text-xs">Likes</MonoText>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <div className="text-2xl font-bold text-danger">
              {stats?.dislikes_count || 0}
            </div>
            <MonoText muted className="text-xs">Skips</MonoText>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <div className="text-2xl font-bold text-foreground">
              {stats?.likes_count && stats?.total_swipes
                ? Math.round((stats.likes_count / stats.total_swipes) * 100)
                : 0}%
            </div>
            <MonoText muted className="text-xs">Like Rate</MonoText>
          </div>
        </div>
      </GlassPanel>

      {/* Newsletter Settings */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Newsletter</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Newsletter</p>
              <p className="text-sm text-foreground-muted">
                Receive curated intelligence briefings
              </p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, newsletter_enabled: !preferences.newsletter_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.newsletter_enabled ? 'bg-accent' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.newsletter_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.newsletter_enabled && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground-muted" />
                <MonoText muted className="text-sm">Delivery Time</MonoText>
              </div>
              <input
                type="time"
                value={preferences.newsletter_time}
                onChange={(e) => setPreferences({ ...preferences, newsletter_time: e.target.value })}
                className="bg-white/10 border border-glass-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Excluded Subreddits */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <X className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Excluded Subreddits</h2>
        </div>

        <p className="text-sm text-foreground-muted mb-4">
          Posts from these subreddits won't appear in your swipe feed.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSubreddit}
            onChange={(e) => setNewSubreddit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExcludedSubreddit()}
            placeholder="Enter subreddit name..."
            className="flex-1 bg-white/10 border border-glass-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button onClick={addExcludedSubreddit} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {preferences.excluded_subreddits.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {preferences.excluded_subreddits.map((sub) => (
              <Badge key={sub} variant="default" className="pr-1">
                r/{sub}
                <button
                  onClick={() => removeExcludedSubreddit(sub)}
                  className="ml-2 p-0.5 hover:bg-white/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted italic">
            No subreddits excluded
          </p>
        )}
      </GlassPanel>

      {/* Data Management */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Data Management</h2>
        </div>

        <div className="space-y-3">
          <Button variant="secondary" onClick={exportData} className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export My Data
          </Button>

          <Button variant="danger" className="w-full justify-start" onClick={() => {
            if (confirm('Are you sure? This will clear all your swipe history and dossiers.')) {
              // Clear data functionality would go here
              console.log('Clearing data...');
            }
          }}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </GlassPanel>

      {/* Save Button */}
      <Button onClick={savePreferences} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Saving...
          </>
        ) : (
          'Save Settings'
        )}
      </Button>

      {/* Version Info */}
      <div className="text-center">
        <MonoText muted className="text-xs">
          Reddit DNA v1.0.0 | Personal Edition
        </MonoText>
      </div>
    </div>
  );
}
