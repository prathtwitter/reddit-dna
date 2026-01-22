import { NextResponse } from 'next/server';
import { fetchMultipleSubreddits, fetchRedditPosts } from '@/lib/reddit';
import { sql } from '@/lib/db';
import { FIXED_USER_ID, getRandomSubreddits } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    // Step 1: Get already swiped post IDs
    let seenIds = new Set<string>();
    try {
      const swipedPosts = await sql`
        SELECT reddit_id FROM swipe_history WHERE user_id = ${FIXED_USER_ID}
      `;
      seenIds = new Set(swipedPosts.map((p: Record<string, unknown>) => p.reddit_id as string));
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue without filtering - database might not be initialized
    }

    // Step 2: Fetch from Reddit
    const subreddits = getRandomSubreddits();

    let allFetchedPosts: Awaited<ReturnType<typeof fetchRedditPosts>>['posts'] = [];

    try {
      const [multiSubPosts, allPosts] = await Promise.all([
        fetchMultipleSubreddits(subreddits, 10),
        fetchRedditPosts('all', 'hot', undefined, 25),
      ]);
      allFetchedPosts = [...multiSubPosts, ...allPosts.posts];
    } catch (redditError) {
      console.error('Reddit API error:', redditError);
      // Try just r/all as fallback
      try {
        const fallback = await fetchRedditPosts('popular', 'hot', undefined, 30);
        allFetchedPosts = fallback.posts;
      } catch (fallbackError) {
        console.error('Fallback Reddit error:', fallbackError);
        return NextResponse.json(
          { error: 'Reddit API unavailable', details: String(fallbackError) },
          { status: 503 }
        );
      }
    }

    // Step 3: Filter and dedupe
    const freshPosts = allFetchedPosts.filter(post => !seenIds.has(post.reddit_id));
    const uniquePosts = Array.from(
      new Map(freshPosts.map(p => [p.reddit_id, p])).values()
    ).sort(() => Math.random() - 0.5);

    return NextResponse.json({ posts: uniquePosts });
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: String(error) },
      { status: 500 }
    );
  }
}
