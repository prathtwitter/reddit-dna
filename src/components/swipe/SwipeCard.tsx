'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowUpRight, MessageSquare, ThumbsUp, Clock, User } from 'lucide-react';
import { RedditPost, RedditComment } from '@/types';
import { cn, formatNumber, formatTimeAgo, truncateText, SWIPE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD } from '@/lib/utils';
import { GlassPanel, Badge, MonoText } from '@/components/ui';

interface SwipeCardProps {
  post: RedditPost;
  comments: RedditComment[];
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}

export function SwipeCard({ post, comments, isTop, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
      onSwipe(offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      className={cn(
        'absolute inset-0 touch-none',
        !isTop && 'pointer-events-none'
      )}
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20 }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.2 }
      }}
    >
      {/* Swipe Indicators */}
      {isTop && (
        <>
          <motion.div
            className="absolute top-8 right-8 z-10 px-6 py-3 rounded-xl bg-success/90 text-white font-bold text-2xl rotate-12 shadow-lg"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 left-8 z-10 px-6 py-3 rounded-xl bg-danger/90 text-white font-bold text-2xl -rotate-12 shadow-lg"
            style={{ opacity: dislikeOpacity }}
          >
            SKIP
          </motion.div>
        </>
      )}

      <GlassPanel variant="solid" className="h-full p-0 overflow-hidden bg-[#1a1a2e]">
        <div className="grid grid-cols-10 h-full">

          {/* LEFT COLUMN - Title & Metadata (20%) */}
          <div className="col-span-2 border-r border-white/10 p-5 flex flex-col bg-[#16162a]">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="accent" size="sm">r/{post.subreddit}</Badge>
              {post.link_flair_text && <Badge size="sm">{post.link_flair_text}</Badge>}
            </div>

            <h2 className="text-lg font-semibold leading-snug mb-6 flex-1 overflow-y-auto break-words">
              {post.title}
            </h2>

            <div className="space-y-3 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">u/{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 shrink-0" />
                <span>{formatNumber(post.score)} pts</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>{formatNumber(post.num_comments)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{formatTimeAgo(post.created_utc)}</span>
              </div>
            </div>

            <a
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-2 text-sm text-accent hover:text-accent/80"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Open on Reddit</span>
            </a>
          </div>

          {/* MIDDLE COLUMN - Post Content (50%) */}
          <div className="col-span-5 p-5 flex flex-col border-r border-white/10 bg-[#1a1a2e]">
            <MonoText muted className="text-xs mb-4 uppercase tracking-wider">
              Post Content
            </MonoText>
            <div className="flex-1 overflow-y-auto pr-3">
              {post.selftext ? (
                <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {post.selftext}
                </div>
              ) : post.preview?.images?.[0]?.source?.url ? (
                <div className="space-y-4">
                  <img
                    src={post.preview.images[0].source.url}
                    alt=""
                    className="w-full max-h-[400px] object-contain rounded-lg bg-background-secondary"
                  />
                  {post.url && !post.url.includes('reddit.com') && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm break-all block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.url}
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="p-8 rounded-xl bg-background-secondary/50 text-center">
                    <MonoText muted className="text-sm mb-3">Link Post</MonoText>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.url}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Top Comments (30%) */}
          <div className="col-span-3 p-5 flex flex-col bg-[#141425]">
            <MonoText muted className="text-xs mb-4 uppercase tracking-wider">
              Top Comments ({comments.length})
            </MonoText>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {comments.length > 0 ? (
                comments.slice(0, 3).map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg bg-background/50 border border-glass-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-foreground-muted truncate">
                        u/{comment.author}
                      </span>
                      <div className="flex items-center gap-1 text-xs shrink-0">
                        <ThumbsUp className="w-3 h-3 text-success" />
                        <span className="text-success">{formatNumber(comment.score)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed break-words">
                      {truncateText(comment.body, 300)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <MonoText muted>No comments yet</MonoText>
                </div>
              )}
            </div>
          </div>

        </div>
      </GlassPanel>
    </motion.div>
  );
}
