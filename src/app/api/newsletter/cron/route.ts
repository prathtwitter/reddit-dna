import { NextRequest, NextResponse } from 'next/server';
import { generateNewsletter } from '@/lib/ai';
import { sql, generateId } from '@/lib/db';
import { FIXED_USER_ID } from '@/lib/utils';
import { SwipeRecord, StrategicPulse } from '@/types';

export const dynamic = 'force-dynamic';

// Vercel Cron handler for automated newsletter generation
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has newsletter enabled
    const statsResult = await sql`
      SELECT preferences FROM user_stats WHERE id = ${FIXED_USER_ID}
    `;
    const stats = statsResult[0];

    const preferences = stats?.preferences || {};

    if (!preferences.newsletter_enabled) {
      return NextResponse.json({ message: 'Newsletter disabled' });
    }

    // Get current dossier
    const dossierResult = await sql`
      SELECT * FROM dna_dossiers
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY version DESC
      LIMIT 1
    `;
    const dossier = dossierResult[0];

    if (!dossier) {
      return NextResponse.json({ message: 'No dossier found, skipping newsletter' });
    }

    // Get recent liked posts (from the past week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const likedPosts = await sql`
      SELECT * FROM swipe_history
      WHERE user_id = ${FIXED_USER_ID} AND action = 'like' AND created_at >= ${oneWeekAgo.toISOString()}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    if (likedPosts.length < 3) {
      return NextResponse.json({ message: 'Not enough recent likes, skipping newsletter' });
    }

    // Check if we already sent a newsletter today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentNewsletterResult = await sql`
      SELECT id FROM newsletters
      WHERE user_id = ${FIXED_USER_ID} AND created_at >= ${today.toISOString()}
      LIMIT 1
    `;

    if (recentNewsletterResult.length > 0) {
      return NextResponse.json({ message: 'Newsletter already sent today' });
    }

    // Transform to SwipeRecord type
    const formattedLikes: SwipeRecord[] = likedPosts.map((s: Record<string, unknown>) => ({
      id: s.id as string,
      user_id: s.user_id as string,
      reddit_id: s.reddit_id as string,
      action: s.action as 'like' | 'dislike',
      subreddit: s.subreddit as string,
      post_title: s.post_title as string,
      post_score: s.post_score as number,
      post_url: s.post_url as string,
      strategic_pulse: (s.strategic_pulse as StrategicPulse) || undefined,
      created_at: s.created_at as string,
    }));

    // Generate newsletter
    const { subject, content } = await generateNewsletter(formattedLikes, dossier.content);

    // Get included thread info
    const includedThreads = formattedLikes.slice(0, 10).map(p => ({
      reddit_id: p.reddit_id,
      title: p.post_title,
      subreddit: p.subreddit,
      reason: p.strategic_pulse?.key_insight || 'Matched your interests',
    }));

    // Save newsletter
    const newId = generateId();
    const threadsJson = JSON.stringify(includedThreads);
    const scheduledFor = new Date().toISOString();

    await sql`
      INSERT INTO newsletters (id, user_id, subject, content_markdown, scheduled_for, included_threads)
      VALUES (${newId}, ${FIXED_USER_ID}, ${subject}, ${content}, ${scheduledFor}, ${threadsJson}::jsonb)
    `;

    return NextResponse.json({
      success: true,
      newsletter_id: newId,
      subject,
    });
  } catch (error) {
    console.error('Cron newsletter error:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter' },
      { status: 500 }
    );
  }
}
