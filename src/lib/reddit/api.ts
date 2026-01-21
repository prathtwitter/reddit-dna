import { RedditPost, RedditComment } from '@/types';
import { REDDIT_BASE_URL, REDDIT_POSTS_PER_FETCH, decodeHtmlEntities } from '@/lib/utils';

interface RedditListingResponse {
  data: {
    children: Array<{
      data: RedditPostRaw;
    }>;
    after: string | null;
  };
}

interface RedditPostRaw {
  id: string;
  name: string;
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
  thumbnail: string;
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

function transformPost(raw: RedditPostRaw): RedditPost {
  return {
    id: raw.id,
    reddit_id: raw.name,
    title: decodeHtmlEntities(raw.title),
    selftext: decodeHtmlEntities(raw.selftext || ''),
    subreddit: raw.subreddit,
    subreddit_name_prefixed: raw.subreddit_name_prefixed,
    author: raw.author,
    score: raw.score,
    upvote_ratio: raw.upvote_ratio,
    num_comments: raw.num_comments,
    url: raw.url,
    permalink: raw.permalink,
    created_utc: raw.created_utc,
    is_self: raw.is_self,
    thumbnail: raw.thumbnail !== 'self' && raw.thumbnail !== 'default' ? raw.thumbnail : undefined,
    preview: raw.preview ? {
      images: raw.preview.images.map(img => ({
        source: {
          url: decodeHtmlEntities(img.source.url),
          width: img.source.width,
          height: img.source.height,
        }
      }))
    } : undefined,
    post_hint: raw.post_hint,
    link_flair_text: raw.link_flair_text,
  };
}

export async function fetchRedditPosts(
  subreddit: string = 'all',
  sort: 'hot' | 'new' | 'top' | 'rising' = 'hot',
  after?: string,
  limit: number = REDDIT_POSTS_PER_FETCH
): Promise<{ posts: RedditPost[]; after: string | null }> {
  const url = `${REDDIT_BASE_URL}/r/${subreddit}/${sort}.json?limit=${limit}${after ? `&after=${after}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditDNA/1.0',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditListingResponse = await response.json();

    const posts = data.data.children
      .map(child => transformPost(child.data))
      .filter(post => {
        // Filter out posts without meaningful content
        return post.title.length > 10 && !post.title.toLowerCase().includes('[removed]');
      });

    return {
      posts,
      after: data.data.after,
    };
  } catch (error) {
    console.error('Failed to fetch Reddit posts:', error);
    throw error;
  }
}

export async function fetchMultipleSubreddits(
  subreddits: string[],
  limit: number = 10
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];

  const results = await Promise.allSettled(
    subreddits.map(sub => fetchRedditPosts(sub, 'hot', undefined, limit))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value.posts);
    }
  }

  // Shuffle and return
  return allPosts.sort(() => Math.random() - 0.5);
}

export async function fetchPostComments(
  permalink: string,
  limit: number = 10
): Promise<RedditComment[]> {
  const url = `${REDDIT_BASE_URL}${permalink}.json?limit=${limit}&depth=2`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditDNA/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data[1]?.data?.children) {
      return [];
    }

    return data[1].data.children
      .filter((child: { kind: string }) => child.kind === 't1')
      .map((child: { data: { id: string; body: string; author: string; score: number; created_utc: number } }) => ({
        id: child.data.id,
        body: decodeHtmlEntities(child.data.body),
        author: child.data.author,
        score: child.data.score,
        created_utc: child.data.created_utc,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }
}
