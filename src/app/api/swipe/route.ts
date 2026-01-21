import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId } from '@/lib/db';
import { FIXED_USER_ID, INITIAL_DOSSIER_THRESHOLD, REFINEMENT_DOSSIER_INTERVAL } from '@/lib/utils';
import { SwipeAction, StrategicPulse } from '@/types';

export const dynamic = 'force-dynamic';

interface SwipeBody {
  reddit_id: string;
  action: SwipeAction;
  subreddit: string;
  post_title: string;
  post_score: number;
  post_url: string;
  strategic_pulse?: StrategicPulse;
}

export async function POST(request: NextRequest) {
  try {
    const body: SwipeBody = await request.json();
    const { reddit_id, action, subreddit, post_title, post_score, post_url, strategic_pulse } = body;

    const id = generateId();
    const pulseJson = strategic_pulse ? JSON.stringify(strategic_pulse) : null;

    // Insert or update swipe record
    await sql`
      INSERT INTO swipe_history (id, user_id, reddit_id, action, subreddit, post_title, post_score, post_url, strategic_pulse)
      VALUES (${id}, ${FIXED_USER_ID}, ${reddit_id}, ${action}, ${subreddit}, ${post_title}, ${post_score}, ${post_url}, ${pulseJson}::jsonb)
      ON CONFLICT (user_id, reddit_id) DO UPDATE SET
        action = EXCLUDED.action,
        strategic_pulse = EXCLUDED.strategic_pulse
    `;

    // Get current stats
    const statsResult = await sql`
      SELECT * FROM user_stats WHERE id = ${FIXED_USER_ID}
    `;
    const currentStats = statsResult[0];

    const newStats = {
      total_swipes: (currentStats?.total_swipes || 0) + 1,
      likes_count: action === 'like'
        ? (currentStats?.likes_count || 0) + 1
        : (currentStats?.likes_count || 0),
      dislikes_count: action === 'dislike'
        ? (currentStats?.dislikes_count || 0) + 1
        : (currentStats?.dislikes_count || 0),
    };

    // Update user stats
    await sql`
      UPDATE user_stats
      SET total_swipes = ${newStats.total_swipes},
          likes_count = ${newStats.likes_count},
          dislikes_count = ${newStats.dislikes_count},
          updated_at = NOW()
      WHERE id = ${FIXED_USER_ID}
    `;

    // Check if dossier generation is needed
    const shouldGenerateDossier = checkDossierTrigger(
      newStats.total_swipes,
      currentStats?.last_dossier_swipe_count || 0
    );

    return NextResponse.json({
      success: true,
      stats: newStats,
      triggerDossier: shouldGenerateDossier,
    });
  } catch (error) {
    console.error('Swipe error:', error);
    return NextResponse.json(
      { error: 'Failed to process swipe' },
      { status: 500 }
    );
  }
}

function checkDossierTrigger(currentSwipes: number, lastDossierCount: number): boolean {
  if (lastDossierCount === 0 && currentSwipes >= INITIAL_DOSSIER_THRESHOLD) {
    return true;
  }
  if (lastDossierCount >= INITIAL_DOSSIER_THRESHOLD &&
      currentSwipes >= lastDossierCount + REFINEMENT_DOSSIER_INTERVAL) {
    return true;
  }
  return false;
}

export async function GET() {
  try {
    // Get user stats
    const statsResult = await sql`
      SELECT * FROM user_stats WHERE id = ${FIXED_USER_ID}
    `;
    const stats = statsResult[0];

    // Get seen post IDs
    const swipes = await sql`
      SELECT reddit_id FROM swipe_history WHERE user_id = ${FIXED_USER_ID}
    `;

    return NextResponse.json({
      stats: stats ? {
        total_swipes: stats.total_swipes,
        likes_count: stats.likes_count,
        dislikes_count: stats.dislikes_count,
        preferences: stats.preferences || {},
      } : {
        total_swipes: 0,
        likes_count: 0,
        dislikes_count: 0,
      },
      seenIds: swipes.map((s: Record<string, unknown>) => s.reddit_id as string),
    });
  } catch (error) {
    console.error('Get swipe data error:', error);
    return NextResponse.json(
      { error: 'Failed to get swipe data' },
      { status: 500 }
    );
  }
}
