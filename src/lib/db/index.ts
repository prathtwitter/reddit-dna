import { neon } from '@neondatabase/serverless';

// Create SQL query function
const sql = neon(process.env.DATABASE_URL!);

// Helper function to generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    // User Stats table
    await sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        id TEXT PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
        preferences JSONB DEFAULT '{"newsletter_enabled":true,"newsletter_time":"08:00","timezone":"UTC","excluded_subreddits":[]}',
        total_swipes INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        last_dossier_swipe_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Insert default user if not exists
    await sql`
      INSERT INTO user_stats (id)
      VALUES ('00000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING
    `;

    // Swipe History table
    await sql`
      CREATE TABLE IF NOT EXISTS swipe_history (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
        reddit_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('like', 'dislike')),
        subreddit TEXT NOT NULL,
        post_title TEXT NOT NULL,
        post_score INTEGER DEFAULT 0,
        post_url TEXT,
        strategic_pulse JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, reddit_id)
      )
    `;

    // DNA Dossiers table
    await sql`
      CREATE TABLE IF NOT EXISTS dna_dossiers (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
        version INTEGER NOT NULL DEFAULT 1,
        swipe_count_at_generation INTEGER NOT NULL,
        analysis_type TEXT NOT NULL CHECK (analysis_type IN ('initial', 'refinement')),
        content JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Newsletters table
    await sql`
      CREATE TABLE IF NOT EXISTS newsletters (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
        subject TEXT NOT NULL,
        content_markdown TEXT NOT NULL,
        scheduled_for TIMESTAMPTZ,
        included_threads JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      )
    `;

    // AI Cache table
    await sql`
      CREATE TABLE IF NOT EXISTS ai_cache (
        id TEXT PRIMARY KEY,
        reddit_id TEXT NOT NULL,
        cache_type TEXT NOT NULL DEFAULT 'pulse',
        content JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (reddit_id, cache_type)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_swipe_history_user_id ON swipe_history(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_swipe_history_reddit_id ON swipe_history(reddit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_swipe_history_action ON swipe_history(action)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dna_dossiers_user_id ON dna_dossiers(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_cache_reddit_id ON ai_cache(reddit_id)`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Export sql for use in API routes
export { sql };
