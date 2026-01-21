import { GoogleGenerativeAI } from '@google/generative-ai';
import { StrategicPulse, DNAContent, RedditPost, SwipeRecord } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Helper to truncate text to save tokens
function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

export async function generateStrategicPulse(post: RedditPost, topComments: string[]): Promise<StrategicPulse> {
  // Minimal prompt - save tokens
  const prompt = `Analyze this Reddit post briefly.

Title: ${truncate(post.title, 150)}
Sub: r/${post.subreddit}
Text: ${truncate(post.selftext || '', 200)}
Comments: ${topComments.slice(0, 2).map(c => truncate(c, 100)).join(' | ') || 'None'}

Reply ONLY with JSON:
{"core_debate":"1 sentence","expert_lens":"1 sentence","logic_quality":"strong|moderate|weak","key_insight":"1 sentence"}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      core_debate: parsed.core_debate || 'Analysis unavailable',
      expert_lens: parsed.expert_lens || 'Analysis unavailable',
      logic_quality: ['strong', 'moderate', 'weak'].includes(parsed.logic_quality)
        ? parsed.logic_quality
        : 'moderate',
      key_insight: parsed.key_insight || 'Analysis unavailable',
      contrarian_take: parsed.contrarian_take,
    };
  } catch (error) {
    console.error('Failed to generate Strategic Pulse:', error);
    return {
      core_debate: 'Unable to analyze - AI processing error',
      expert_lens: 'Unable to analyze',
      logic_quality: 'moderate',
      key_insight: 'Please try again later',
    };
  }
}

export async function generateDNADossier(
  swipeHistory: SwipeRecord[],
  previousDossier?: DNAContent,
  isRefinement: boolean = false
): Promise<DNAContent> {
  const likedPosts = swipeHistory.filter(s => s.action === 'like');
  const dislikedPosts = swipeHistory.filter(s => s.action === 'dislike');

  // Only use last 30 posts to save tokens
  const formatSwipes = (swipes: SwipeRecord[]) =>
    swipes.slice(-30).map(s => `r/${s.subreddit}: ${truncate(s.post_title, 60)}`).join('\n');

  const prompt = `Create intelligence profile from Reddit activity.

${isRefinement && previousDossier ? `Previous: ${truncate(previousDossier.summary, 150)}` : ''}

Liked (${likedPosts.length}):
${formatSwipes(likedPosts)}

Disliked (${dislikedPosts.length}):
${formatSwipes(dislikedPosts)}

Reply ONLY JSON:
{"intellectual_profile":{"primary_interests":["5 items"],"thinking_style":"brief","knowledge_depth_areas":["3 items"],"curiosity_patterns":["3 items"]},"cognitive_signature":{"analytical_tendencies":"brief","information_preferences":"brief","debate_engagement_style":"brief"},"topic_clusters":[{"name":"","strength":85,"keywords":["3"],"sample_interests":["2"]}],"summary":"2 sentences"}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    return JSON.parse(jsonMatch[0]) as DNAContent;
  } catch (error) {
    console.error('Failed to generate DNA Dossier:', error);
    throw error;
  }
}

export async function generateNewsletter(
  likedPosts: SwipeRecord[],
  dossier: DNAContent
): Promise<{ subject: string; content: string }> {
  // Only use last 10 posts
  const recentLikes = likedPosts.slice(-10);

  const prompt = `Create brief newsletter for user interested in: ${dossier.intellectual_profile.primary_interests.join(', ')}

Recent likes:
${recentLikes.map(s => `- r/${s.subreddit}: ${truncate(s.post_title, 50)}`).join('\n')}

Reply ONLY JSON:
{"subject":"short subject","content":"markdown: ## Themes\\n- bullets\\n## Insights\\n- bullets\\n## Explore Next\\n- bullets"}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to generate newsletter:', error);
    throw error;
  }
}
