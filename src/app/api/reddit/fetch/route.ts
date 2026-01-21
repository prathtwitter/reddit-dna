import { NextResponse } from 'next/server';
import { fetchMultipleSubreddits, fetchRedditPosts } from '@/lib/reddit';
import { sql } from '@/lib/db';
import { FIXED_USER_ID, getRandomSubreddits } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get already swiped post IDs to filter them out
    const swipedPosts = await sql`
      SELECT reddit_id FROM swipe_history WHERE user_id = ${FIXED_USER_ID}
    `;

    const seenIds = new Set(swipedPosts.map((p: Record<string, unknown>) => p.reddit_id as string));

    // Fetch from multiple sources
    const subreddits = getRandomSubreddits();
    const [multiSubPosts, allPosts] = await Promise.all([
      fetchMultipleSubreddits(subreddits, 10),
      fetchRedditPosts('all', 'hot', undefined, 25),
    ]);

    // Combine and filter out seen posts
    const allFetchedPosts = [...multiSubPosts, ...allPosts.posts];
    const freshPosts = allFetchedPosts.filter(post => !seenIds.has(post.reddit_id));

    // Shuffle and deduplicate
    const uniquePosts = Array.from(
      new Map(freshPosts.map(p => [p.reddit_id, p])).values()
    ).sort(() => Math.random() - 0.5);

    return NextResponse.json({ posts: uniquePosts });
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
