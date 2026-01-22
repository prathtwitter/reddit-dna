'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { SwipeCard } from './SwipeCard';
import { Button, GlassPanel, Spinner, MonoText } from '@/components/ui';
import { useSwipeStore } from '@/stores';
import { RedditPost, RedditComment } from '@/types';
import { VISIBLE_CARDS, INITIAL_DOSSIER_THRESHOLD, REFINEMENT_DOSSIER_INTERVAL } from '@/lib/utils';

const SUBREDDITS = [
  // Meta-Cognition & Learning
  'productivity', 'GetStudying', 'Anki', 'selfimprovement', 'DecisionMaking',

  // Logic & Critical Thinking
  'philosophy', 'logic', 'changemyview', 'TrueAskReddit', 'DebateAnAtheist',

  // Mental Models & Rationality
  'slatestarcodex', 'lesswrong', 'RationalPsychonaut', 'Foodforthought',

  // Psychology & Neuroscience
  'psychology', 'Stoicism', 'CBT', 'Meditation', 'neuroscience', 'cogsci',

  // Macro-Economics & Finance
  'economics', 'finance', 'AskEconomics', 'neutralnews', 'TrueReddit',

  // Trading & Markets
  'wallstreetbets', 'options', 'algotrading', 'SecurityAnalysis', 'investing',
  'stocks', 'CryptoCurrency', 'Bitcoin', 'ValueInvesting',

  // Personal Finance & Wealth
  'personalfinance', 'financialindependence', 'realestateinvesting', 'tax',
  'smallbusiness', 'Entrepreneur', 'fatFIRE',

  // Legal
  'law', 'Ask_Lawyers', 'LegalAdviceOffTopic',

  // Social Engineering & Persuasion
  'socialengineering', 'negotiation', 'sales', 'PublicSpeaking',

  // Sociology & Anthropology
  'sociology', 'Anthropology', 'AskSocialScience', 'AskAnthropology',

  // Computer Science & Programming
  'programming', 'compsci', 'netsec', 'cybersecurity', 'hacking', 'OSINT',
  'learnprogramming', 'AskProgramming', 'ReverseEngineering', 'algorithms',

  // Artificial Intelligence
  'MachineLearning', 'artificial', 'LocalLLaMA', 'singularity', 'agi',
  'ChatGPT', 'ClaudeAI', 'StableDiffusion',

  // Hardware & Networking
  'buildapc', 'homelab', 'networking', 'selfhosted', 'HomeAssistant',
  'sysadmin', 'DataHoarder', 'PFSENSE', 'docker',

  // Bio-Optimization & Health
  'nutrition', 'fitness', 'Supplements', 'Nootropics', 'biohackers',
  'sleep', 'AdvancedFitness', 'loseit', 'ketoscience',

  // Survival & Tactics
  'survival', 'preppers', 'Bushcraft', 'urbancarliving', 'bugout',
  'SelfDefense', 'martialarts', 'CCW',

  // Maker Skills & DIY
  'DIY', 'electronics', 'MechanicAdvice', 'Cooking', 'woodworking',
  'AskElectronics', 'metalworking', 'sewing', 'Skookum',

  // Geopolitics & Strategy
  'geopolitics', 'CredibleDefense', 'WarCollege', 'NuclearPower', 'energy',
  'foreignpolicy', 'Intelligence', 'LessCredibleDefence',

  // History & Philosophy
  'history', 'AskHistorians', 'badhistory', 'HistoryPorn',
  'PoliticalPhilosophy', 'askphilosophy', 'HistoryWhatIf',

  // Information Warfare & Privacy
  'privacy', 'opsec', 'privacytoolsIO', 'degoogle', 'Piracy',
  'lockpicking', 'homesecurity', 'antivirus',

  // General Knowledge
  'todayilearned', 'explainlikeimfive', 'askscience', 'AskEngineers',
  'technology', 'science', 'worldnews', 'space', 'futurology', 'Documentaries'
];

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function fetchRedditPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    // Use corsproxy.io to bypass CORS restrictions
    const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return [];
    const data = await response.json();

    return data.data.children
      .filter((child: { data: { title: string } }) =>
        child.data.title.length > 10 && !child.data.title.toLowerCase().includes('[removed]')
      )
      .map((child: { data: Record<string, unknown> }) => ({
        id: child.data.id as string,
        reddit_id: child.data.name as string,
        title: decodeHtmlEntities(child.data.title as string),
        selftext: decodeHtmlEntities((child.data.selftext as string) || ''),
        subreddit: child.data.subreddit as string,
        subreddit_name_prefixed: child.data.subreddit_name_prefixed as string,
        author: child.data.author as string,
        score: child.data.score as number,
        upvote_ratio: child.data.upvote_ratio as number,
        num_comments: child.data.num_comments as number,
        url: child.data.url as string,
        permalink: child.data.permalink as string,
        created_utc: child.data.created_utc as number,
        is_self: child.data.is_self as boolean,
        thumbnail: child.data.thumbnail as string,
        preview: child.data.preview as RedditPost['preview'],
        post_hint: child.data.post_hint as string,
        link_flair_text: child.data.link_flair_text as string,
      }));
  } catch (error) {
    console.error(`Failed to fetch r/${subreddit}:`, error);
    return [];
  }
}

export function SwipeStack() {
  const {
    cardQueue,
    currentIndex,
    isLoading,
    error,
    totalSwipes,
    likesCount,
    dislikesCount,
    swipeCard,
    needsMoreCards,
    getVisibleCards,
    setLoading,
    setError,
    addCards,
  } = useSwipeStore();

  const [commentsCache, setCommentsCache] = useState<Record<string, RedditComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const visibleCards = getVisibleCards();
  const currentCard = visibleCards[0];

  // Fetch comments for current card
  const fetchComments = useCallback(async (permalink: string, redditId: string) => {
    if (commentsCache[redditId]) return;

    setLoadingComments(redditId);
    try {
      const redditUrl = `https://www.reddit.com${permalink}.json?limit=3&depth=1`;
      const response = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`,
        { cache: 'no-store' }
      );
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();

      const comments: RedditComment[] = (data[1]?.data?.children || [])
        .filter((child: { kind: string }) => child.kind === 't1')
        .slice(0, 3)
        .map((child: { data: Record<string, unknown> }) => ({
          id: child.data.id as string,
          body: decodeHtmlEntities(child.data.body as string),
          author: child.data.author as string,
          score: child.data.score as number,
          created_utc: child.data.created_utc as number,
        }));

      setCommentsCache(prev => ({ ...prev, [redditId]: comments }));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(null);
    }
  }, [commentsCache]);

  // Fetch comments when current card changes
  useEffect(() => {
    if (currentCard && !commentsCache[currentCard.reddit_id]) {
      fetchComments(currentCard.permalink, currentCard.reddit_id);
    }
  }, [currentCard, commentsCache, fetchComments]);

  // Prefetch comments for next card
  useEffect(() => {
    const nextCard = visibleCards[1];
    if (nextCard && !commentsCache[nextCard.reddit_id]) {
      fetchComments(nextCard.permalink, nextCard.reddit_id);
    }
  }, [visibleCards, commentsCache, fetchComments]);

  // Fetch posts from Reddit (client-side)
  const fetchMorePosts = useCallback(async () => {
    if (isLoading) return;

    setLoading(true);
    setError(null);

    try {
      // Get seen IDs from server
      const seenResponse = await fetch('/api/reddit/fetch');
      const seenData = await seenResponse.json();
      const serverSeenIds = new Set<string>(seenData.seenIds || []);
      setSeenIds(serverSeenIds);

      // Fetch from random subreddits (sample 12 from the large pool)
      const shuffled = [...SUBREDDITS].sort(() => Math.random() - 0.5);
      const selectedSubs = shuffled.slice(0, 12);

      const results = await Promise.all([
        ...selectedSubs.map(sub => fetchRedditPosts(sub, 8)),
        fetchRedditPosts('all', 15),
      ]);

      const allPosts = results.flat();

      // Filter out seen posts
      const freshPosts = allPosts.filter(
        post => !serverSeenIds.has(post.reddit_id) && !seenIds.has(post.reddit_id)
      );

      // Deduplicate and shuffle
      const uniquePosts = Array.from(
        new Map(freshPosts.map(p => [p.reddit_id, p])).values()
      ).sort(() => Math.random() - 0.5);

      if (uniquePosts.length > 0) {
        addCards(uniquePosts);
      } else {
        setError('No new posts available');
      }
    } catch (err) {
      setError('Failed to fetch posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isLoading, setLoading, setError, addCards, seenIds]);

  // Initial load
  useEffect(() => {
    if (cardQueue.length === 0 && !isLoading) {
      fetchMorePosts();
    }
  }, [cardQueue.length, isLoading, fetchMorePosts]);

  // Prefetch when running low
  useEffect(() => {
    if (needsMoreCards() && !isLoading) {
      fetchMorePosts();
    }
  }, [currentIndex, needsMoreCards, isLoading, fetchMorePosts]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    const action = direction === 'right' ? 'like' : 'dislike';
    const swipedCard = swipeCard(action);

    if (swipedCard) {
      try {
        await fetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reddit_id: swipedCard.reddit_id,
            action,
            subreddit: swipedCard.subreddit,
            post_title: swipedCard.title,
            post_score: swipedCard.score,
            post_url: `https://reddit.com${swipedCard.permalink}`,
          }),
        });
      } catch (err) {
        console.error('Failed to record swipe:', err);
      }
    }
  }, [swipeCard]);

  const nextDossierAt = totalSwipes < INITIAL_DOSSIER_THRESHOLD
    ? INITIAL_DOSSIER_THRESHOLD
    : Math.ceil((totalSwipes - INITIAL_DOSSIER_THRESHOLD) / REFINEMENT_DOSSIER_INTERVAL + 1) *
      REFINEMENT_DOSSIER_INTERVAL + INITIAL_DOSSIER_THRESHOLD;
  const progressToNext = totalSwipes < INITIAL_DOSSIER_THRESHOLD
    ? (totalSwipes / INITIAL_DOSSIER_THRESHOLD) * 100
    : ((totalSwipes - (nextDossierAt - REFINEMENT_DOSSIER_INTERVAL)) / REFINEMENT_DOSSIER_INTERVAL) * 100;

  if (error) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={fetchMorePosts}>Try Again</Button>
      </GlassPanel>
    );
  }

  if (isLoading && visibleCards.length === 0) {
    return (
      <GlassPanel className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <Spinner size="lg" />
        <p className="mt-4 text-foreground-muted">Loading posts...</p>
      </GlassPanel>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-foreground-muted mb-4">No more posts available</p>
        <Button onClick={fetchMorePosts}>Load More</Button>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <MonoText className="text-2xl font-bold">{totalSwipes}</MonoText>
            <MonoText muted className="text-xs">Total Swipes</MonoText>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Heart className="w-4 h-4 text-success fill-success" />
              <MonoText className="text-xl font-bold text-success">{likesCount}</MonoText>
            </div>
            <MonoText muted className="text-xs">Liked</MonoText>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <X className="w-4 h-4 text-danger" />
              <MonoText className="text-xl font-bold text-danger">{dislikesCount}</MonoText>
            </div>
            <MonoText muted className="text-xs">Skipped</MonoText>
          </div>
        </div>
        <div className="text-right">
          <MonoText muted className="text-xs block mb-1">
            DNA Update in {nextDossierAt - totalSwipes} swipes
          </MonoText>
          <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative w-full h-[550px]">
        <AnimatePresence mode="popLayout">
          {visibleCards.slice(0, VISIBLE_CARDS).reverse().map((post, index) => {
            const isTop = index === visibleCards.length - 1;
            return (
              <SwipeCard
                key={post.reddit_id}
                post={post}
                comments={commentsCache[post.reddit_id] || []}
                isTop={isTop}
                onSwipe={handleSwipe}
              />
            );
          })}
        </AnimatePresence>

        {loadingComments && loadingComments === currentCard?.reddit_id && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-2">
            <Spinner size="sm" />
            <MonoText muted className="text-xs">Loading comments...</MonoText>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        <Button
          variant="secondary"
          size="lg"
          className="w-20 h-20 rounded-full border-2 border-danger/30 hover:border-danger hover:bg-danger/10 transition-all"
          onClick={() => handleSwipe('left')}
        >
          <X className="w-8 h-8 text-danger" />
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="w-20 h-20 rounded-full border-2 border-success/30 hover:border-success bg-success/20 hover:bg-success/30 transition-all"
          onClick={() => handleSwipe('right')}
        >
          <Heart className="w-8 h-8 text-success" />
        </Button>
      </div>

      <div className="text-center">
        <MonoText muted className="text-xs">
          Drag card or use keyboard: ← Skip | → Like
        </MonoText>
      </div>
    </div>
  );
}
