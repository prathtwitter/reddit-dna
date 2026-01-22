import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { FIXED_USER_ID } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// This endpoint now only returns seen IDs - Reddit fetching happens client-side
export async function GET() {
  try {
    let seenIds: string[] = [];
    try {
      const swipedPosts = await sql`
        SELECT reddit_id FROM swipe_history WHERE user_id = ${FIXED_USER_ID}
      `;
      seenIds = swipedPosts.map((p: Record<string, unknown>) => p.reddit_id as string);
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({ seenIds });
  } catch (error) {
    console.error('Fetch seen IDs error:', error);
    return NextResponse.json({ seenIds: [] });
  }
}
