import { NextRequest, NextResponse } from 'next/server';
import { generateDNADossier } from '@/lib/ai';
import { sql, generateId } from '@/lib/db';
import { FIXED_USER_ID } from '@/lib/utils';
import { SwipeRecord, StrategicPulse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));

    // Get current user stats
    const statsResult = await sql`
      SELECT * FROM user_stats WHERE id = ${FIXED_USER_ID}
    `;
    const stats = statsResult[0];

    if (!stats) {
      return NextResponse.json(
        { error: 'No user stats found' },
        { status: 404 }
      );
    }

    // Get swipe history
    const swipeHistory = await sql`
      SELECT * FROM swipe_history
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY created_at DESC
    `;

    if (swipeHistory.length < 50) {
      return NextResponse.json(
        { error: 'Not enough swipe data (need at least 50 swipes)' },
        { status: 400 }
      );
    }

    // Transform to SwipeRecord type
    const formattedHistory: SwipeRecord[] = swipeHistory.map((s: Record<string, unknown>) => ({
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

    // Get previous dossier if exists
    const prevDossierResult = await sql`
      SELECT * FROM dna_dossiers
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY version DESC
      LIMIT 1
    `;
    const previousDossier = prevDossierResult[0];

    const isRefinement = !!previousDossier;
    const newVersion = (previousDossier?.version || 0) + 1;

    // Generate dossier
    const dossierContent = await generateDNADossier(
      formattedHistory,
      previousDossier?.content || undefined,
      isRefinement
    );

    // Save dossier
    const newId = generateId();
    const contentJson = JSON.stringify(dossierContent);
    const analysisType = isRefinement ? 'refinement' : 'initial';

    await sql`
      INSERT INTO dna_dossiers (id, user_id, version, swipe_count_at_generation, analysis_type, content)
      VALUES (${newId}, ${FIXED_USER_ID}, ${newVersion}, ${stats.total_swipes}, ${analysisType}, ${contentJson}::jsonb)
    `;

    // Update user stats with last dossier count
    await sql`
      UPDATE user_stats SET last_dossier_swipe_count = ${stats.total_swipes} WHERE id = ${FIXED_USER_ID}
    `;

    // Get the new dossier
    const newDossierResult = await sql`
      SELECT * FROM dna_dossiers WHERE id = ${newId}
    `;
    const newDossier = newDossierResult[0];

    return NextResponse.json({
      dossier: {
        ...newDossier,
        content: newDossier.content,
      },
      isRefinement,
    });
  } catch (error) {
    console.error('Dossier generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate dossier' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get latest dossier
    const dossierResult = await sql`
      SELECT * FROM dna_dossiers
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY version DESC
      LIMIT 1
    `;
    const dossier = dossierResult[0];

    // Get all versions for history
    const allDossiers = await sql`
      SELECT id, version, analysis_type, swipe_count_at_generation, created_at
      FROM dna_dossiers
      WHERE user_id = ${FIXED_USER_ID}
      ORDER BY version DESC
    `;

    return NextResponse.json({
      current: dossier ? {
        ...dossier,
        content: dossier.content,
      } : null,
      history: allDossiers,
    });
  } catch (error) {
    console.error('Get dossier error:', error);
    return NextResponse.json(
      { error: 'Failed to get dossier' },
      { status: 500 }
    );
  }
}
