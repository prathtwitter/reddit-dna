'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dna, Brain, Sparkles, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { GlassPanel, Button, Badge, MonoText, ProgressBar, Spinner } from '@/components/ui';
import { DNADossier, TopicCluster } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface DossierHistory {
  id: string;
  version: number;
  analysis_type: 'initial' | 'refinement';
  swipe_count_at_generation: number;
  created_at: string;
}

export default function MyDNAPage() {
  const [dossier, setDossier] = useState<DNADossier | null>(null);
  const [history, setHistory] = useState<DossierHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDossier();
  }, []);

  const fetchDossier = async () => {
    try {
      const response = await fetch('/api/ai/dossier');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setDossier(data.current);
        setHistory(data.history || []);
      }
    } catch (err) {
      setError('Failed to fetch dossier');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDossier = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setDossier(data.dossier);
        await fetchDossier(); // Refresh history
      }
    } catch (err) {
      setError('Failed to generate dossier');
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

  if (!dossier) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Your Intelligence</span>
            <br />
            <span className="text-foreground">Dossier</span>
          </h1>
        </div>

        <GlassPanel className="p-8 text-center">
          <Dna className="w-16 h-16 mx-auto mb-4 text-accent opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Dossier Yet</h2>
          <p className="text-foreground-muted mb-6">
            {error || 'Keep swiping to build your intellectual profile. Your first DNA analysis will be generated after 500 swipes.'}
          </p>
          <Button onClick={generateDossier} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Now (50+ swipes required)
              </>
            )}
          </Button>
        </GlassPanel>
      </div>
    );
  }

  const content = dossier.content;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            <span className="text-gradient">Intelligence Dossier</span>
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant={dossier.analysis_type === 'initial' ? 'accent' : 'success'}>
              v{dossier.version} - {dossier.analysis_type}
            </Badge>
            <MonoText muted className="text-sm">
              {dossier.swipe_count_at_generation} swipes analyzed
            </MonoText>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={generateDossier}
          disabled={isGenerating}
        >
          {isGenerating ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassPanel className="p-6" glow="accent">
          <p className="text-lg leading-relaxed">{content.summary}</p>
        </GlassPanel>
      </motion.div>

      {/* Intellectual Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Intellectual Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <MonoText muted className="text-sm mb-2 block">Primary Interests</MonoText>
              <div className="flex flex-wrap gap-2">
                {content.intellectual_profile.primary_interests.map((interest, i) => (
                  <Badge key={i} variant="accent">{interest}</Badge>
                ))}
              </div>
            </div>

            <div>
              <MonoText muted className="text-sm mb-2 block">Thinking Style</MonoText>
              <p className="text-foreground/90">{content.intellectual_profile.thinking_style}</p>
            </div>

            <div>
              <MonoText muted className="text-sm mb-2 block">Knowledge Depth Areas</MonoText>
              <div className="flex flex-wrap gap-2">
                {content.intellectual_profile.knowledge_depth_areas.map((area, i) => (
                  <Badge key={i}>{area}</Badge>
                ))}
              </div>
            </div>

            <div>
              <MonoText muted className="text-sm mb-2 block">Curiosity Patterns</MonoText>
              <ul className="list-disc list-inside text-foreground-muted space-y-1">
                {content.intellectual_profile.curiosity_patterns.map((pattern, i) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Cognitive Signature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Cognitive Signature</h2>
          </div>

          <div className="space-y-4">
            <div>
              <MonoText muted className="text-sm mb-1 block">Analytical Tendencies</MonoText>
              <p className="text-foreground/90">{content.cognitive_signature.analytical_tendencies}</p>
            </div>

            <div>
              <MonoText muted className="text-sm mb-1 block">Information Preferences</MonoText>
              <p className="text-foreground/90">{content.cognitive_signature.information_preferences}</p>
            </div>

            <div>
              <MonoText muted className="text-sm mb-1 block">Debate Engagement Style</MonoText>
              <p className="text-foreground/90">{content.cognitive_signature.debate_engagement_style}</p>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Topic Clusters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Topic Clusters</h2>
          </div>

          <div className="space-y-4">
            {content.topic_clusters.map((cluster: TopicCluster, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{cluster.name}</h3>
                  <MonoText className="text-sm text-accent">{cluster.strength}%</MonoText>
                </div>
                <ProgressBar value={cluster.strength} variant="accent" size="sm" className="mb-3" />
                <div className="flex flex-wrap gap-1 mb-2">
                  {cluster.keywords.map((kw, j) => (
                    <Badge key={j} size="sm">{kw}</Badge>
                  ))}
                </div>
                <MonoText muted className="text-xs">
                  {cluster.sample_interests.join(' • ')}
                </MonoText>
              </div>
            ))}
          </div>
        </GlassPanel>
      </motion.div>

      {/* Evolution Notes */}
      {content.evolution_notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassPanel className="p-6" variant="subtle">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <MonoText className="text-sm text-success">Evolution Notes</MonoText>
            </div>
            <p className="text-foreground-muted">{content.evolution_notes}</p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Version History */}
      {history.length > 1 && (
        <GlassPanel className="p-6" variant="subtle">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold">Version History</h2>
          </div>

          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  h.id === dossier.id ? 'bg-accent/10 border border-accent/20' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge size="sm" variant={h.analysis_type === 'initial' ? 'accent' : 'success'}>
                    v{h.version}
                  </Badge>
                  <MonoText className="text-sm">{h.swipe_count_at_generation} swipes</MonoText>
                </div>
                <MonoText muted className="text-xs">
                  {formatTimeAgo(new Date(h.created_at).getTime() / 1000)}
                </MonoText>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
