import { NextRequest, NextResponse } from 'next/server';
import { generateStrategicPulse } from '@/lib/ai';
import { fetchPostComments } from '@/lib/reddit';
import { sql, generateId } from '@/lib/db';
import { RedditPost } from '@/types';
import { AI_CACHE_TTL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { post }: { post: RedditPost } = await request.json();

    if (!post) {
      return NextResponse.json(
        { error: 'Post data is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheResult = await sql`
      SELECT * FROM ai_cache WHERE reddit_id = ${post.reddit_id} AND cache_type = 'pulse'
    `;
    const cached = cacheResult[0];

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < AI_CACHE_TTL) {
        return NextResponse.json({ pulse: cached.content, cached: true });
      }
    }

    // Fetch only 2 comments to save tokens
    const comments = await fetchPostComments(post.permalink, 2);
    const commentTexts = comments.map(c => c.body.slice(0, 100));

    // Generate pulse
    const pulse = await generateStrategicPulse(post, commentTexts);

    // Cache the result (upsert)
    const id = generateId();
    const pulseJson = JSON.stringify(pulse);
    await sql`
      INSERT INTO ai_cache (id, reddit_id, cache_type, content)
      VALUES (${id}, ${post.reddit_id}, 'pulse', ${pulseJson}::jsonb)
      ON CONFLICT (reddit_id, cache_type) DO UPDATE SET
        content = EXCLUDED.content,
        created_at = NOW()
    `;

    return NextResponse.json({ pulse, cached: false });
  } catch (error) {
    console.error('Pulse generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate pulse' },
      { status: 500 }
    );
  }
}
