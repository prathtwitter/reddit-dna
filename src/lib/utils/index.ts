export { cn } from './cn';
export * from './constants';

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

export function getRandomSubreddits(): string[] {
  const popularSubreddits = [
    'technology', 'science', 'worldnews', 'philosophy', 'books',
    'history', 'space', 'futurology', 'economics', 'psychology',
    'dataisbeautiful', 'explainlikeimfive', 'todayilearned', 'askscience',
    'Documentaries', 'TrueReddit', 'DepthHub', 'foodforthought',
    'changemyview', 'NeutralPolitics', 'AskHistorians', 'geopolitics'
  ];

  // Shuffle and return 5 random subreddits
  return popularSubreddits
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
}
