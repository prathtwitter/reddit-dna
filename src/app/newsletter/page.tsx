'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Sparkles, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { GlassPanel, Button, Badge, MonoText, Spinner } from '@/components/ui';
import { Newsletter } from '@/types';
import { format } from 'date-fns';

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletter/generate');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setNewsletters(data.newsletters || []);
        if (data.newsletters?.length > 0) {
          setSelectedNewsletter(data.newsletters[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch newsletters');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewsletter = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setNewsletters([data.newsletter, ...newsletters]);
        setSelectedNewsletter(data.newsletter);
      }
    } catch (err) {
      setError('Failed to generate newsletter');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            <span className="text-gradient">Intelligence</span>
            <span className="text-foreground"> Briefings</span>
          </h1>
          <p className="text-foreground-muted text-sm">
            Curated insights from your liked content
          </p>
        </div>
        <Button
          onClick={generateNewsletter}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </>
          )}
        </Button>
      </div>

      {error && (
        <GlassPanel className="p-4 border-danger/30" variant="subtle">
          <p className="text-danger text-sm">{error}</p>
        </GlassPanel>
      )}

      {newsletters.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Newspaper className="w-16 h-16 mx-auto mb-4 text-accent opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Newsletters Yet</h2>
          <p className="text-foreground-muted mb-6">
            Generate your first intelligence briefing based on your liked content.
            You need a DNA dossier and at least 5 liked posts.
          </p>
          <Button onClick={generateNewsletter} disabled={isGenerating}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate First Newsletter
          </Button>
        </GlassPanel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Newsletter List */}
          <div className="space-y-3">
            <MonoText muted className="text-xs uppercase tracking-wider">
              Archive ({newsletters.length})
            </MonoText>
            {newsletters.map((nl, i) => (
              <motion.div
                key={nl.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassPanel
                  className={`p-4 cursor-pointer ${
                    selectedNewsletter?.id === nl.id ? 'border-accent/50 glow-accent' : ''
                  }`}
                  variant="subtle"
                  hover
                  onClick={() => setSelectedNewsletter(nl)}
                >
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {nl.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(nl.created_at), 'MMM d, yyyy')}
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>

          {/* Selected Newsletter */}
          <div className="lg:col-span-2">
            {selectedNewsletter ? (
              <motion.div
                key={selectedNewsletter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassPanel className="p-6">
                  <div className="mb-6 pb-6 border-b border-glass-border">
                    <Badge variant="accent" className="mb-3">
                      Intelligence Briefing
                    </Badge>
                    <h2 className="text-xl font-semibold mb-2">
                      {selectedNewsletter.subject}
                    </h2>
                    <MonoText muted className="text-sm">
                      {format(new Date(selectedNewsletter.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                    </MonoText>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(selectedNewsletter.content_markdown)
                      }}
                    />
                  </div>

                  {/* Included Threads */}
                  {selectedNewsletter.included_threads && selectedNewsletter.included_threads.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-glass-border">
                      <MonoText muted className="text-xs uppercase tracking-wider mb-3 block">
                        Source Threads
                      </MonoText>
                      <div className="space-y-2">
                        {selectedNewsletter.included_threads.map((thread, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                          >
                            <Badge size="sm">r/{thread.subreddit}</Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-1">{thread.title}</p>
                              <p className="text-xs text-foreground-muted mt-1">
                                {thread.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassPanel>
              </motion.div>
            ) : (
              <GlassPanel className="p-8 text-center" variant="subtle">
                <p className="text-foreground-muted">Select a newsletter to view</p>
              </GlassPanel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown parser (basic implementation)
function parseMarkdown(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="my-4">')
    // Line breaks
    .replace(/\n/g, '<br />');
}
