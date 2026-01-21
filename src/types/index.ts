// Reddit Types
export interface RedditPost {
  id: string;
  reddit_id: string;
  title: string;
  selftext: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  author: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
  is_self: boolean;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  };
  post_hint?: string;
  link_flair_text?: string;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  replies?: RedditComment[];
}

// Swipe Types
export type SwipeAction = 'like' | 'dislike';

export interface SwipeRecord {
  id: string;
  user_id: string;
  reddit_id: string;
  action: SwipeAction;
  subreddit: string;
  post_title: string;
  post_score: number;
  post_url: string;
  strategic_pulse?: StrategicPulse;
  created_at: string;
}

// AI Types
export interface StrategicPulse {
  core_debate: string;
  expert_lens: string;
  logic_quality: 'strong' | 'moderate' | 'weak';
  key_insight: string;
  contrarian_take?: string;
}

export interface DNADossier {
  id: string;
  user_id: string;
  version: number;
  swipe_count_at_generation: number;
  analysis_type: 'initial' | 'refinement';
  content: DNAContent;
  created_at: string;
}

export interface DNAContent {
  intellectual_profile: {
    primary_interests: string[];
    thinking_style: string;
    knowledge_depth_areas: string[];
    curiosity_patterns: string[];
  };
  cognitive_signature: {
    analytical_tendencies: string;
    information_preferences: string;
    debate_engagement_style: string;
  };
  topic_clusters: TopicCluster[];
  evolution_notes?: string;
  summary: string;
}

export interface TopicCluster {
  name: string;
  strength: number; // 0-100
  keywords: string[];
  sample_interests: string[];
}

// Newsletter Types
export interface Newsletter {
  id: string;
  user_id: string;
  subject: string;
  content_markdown: string;
  scheduled_for: string;
  included_threads: IncludedThread[];
  created_at: string;
  sent_at?: string;
}

export interface IncludedThread {
  reddit_id: string;
  title: string;
  subreddit: string;
  reason: string;
}

// User Types
export interface UserStats {
  id: string;
  preferences: UserPreferences;
  total_swipes: number;
  likes_count: number;
  dislikes_count: number;
  last_dossier_swipe_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  newsletter_enabled: boolean;
  newsletter_time: string; // "08:00"
  timezone: string;
  excluded_subreddits: string[];
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
}
