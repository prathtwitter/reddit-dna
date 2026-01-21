import { NextRequest, NextResponse } from 'next/server';
import { generateNewsletter } from '@/lib/ai';
import { sql, generateId } from '@/lib/db';
import { FIXED_USER_ID } from '@/lib/utils';
import { SwipeRecord, StrategicPulse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get current dossier
    const dossierResult = await sql`
      SELECT * FROM dna_dossiers
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY version DESC
      LIMIT 1
    `;
    const dossier = dossierResult[0];

    if (!dossier) {
      return NextResponse.json(
        { error: 'No dossier found. Generate a DNA dossier first.' },
        { status: 400 }
      );
    }

    // Get recent liked posts
    const likedPosts = await sql`
      SELECT * FROM swipe_history
      WHERE user_id = ${FIXED_USER_ID} AND action = 'like'
      ORDER BY created_at DESC
      LIMIT 20
    `;

    if (likedPosts.length < 5) {
      return NextResponse.json(
        { error: 'Not enough liked posts to generate newsletter' },
        { status: 400 }
      );
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

    // Get the new newsletter
    const newsletterResult = await sql`
      SELECT * FROM newsletters WHERE id = ${newId}
    `;
    const newsletter = newsletterResult[0];

    return NextResponse.json({
      newsletter: {
        ...newsletter,
        included_threads: newsletter.included_threads || [],
      },
    });
  } catch (error) {
    console.error('Newsletter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all newsletters
    const newsletters = await sql`
      SELECT * FROM newsletters
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      newsletters: newsletters.map((n: Record<string, unknown>) => ({
        ...n,
        included_threads: n.included_threads || [],
      })),
    });
  } catch (error) {
    console.error('Get newsletters error:', error);
    return NextResponse.json(
      { error: 'Failed to get newsletters' },
      { status: 500 }
    );
  }
}
