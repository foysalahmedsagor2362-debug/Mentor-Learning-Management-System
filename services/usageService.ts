const DAILY_LIMIT = 50;

interface UsageStats {
  date: string; // YYYY-MM-DD
  count: number;
}

const getUsageKey = (userId?: string) => `aimers_usage_stats_${userId || 'guest'}`;

export const getUsage = (userId?: string): number => {
  if (!userId) return 0;
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(getUsageKey(userId));
  
  if (stored) {
    const stats: UsageStats = JSON.parse(stored);
    if (stats.date === today) {
      return stats.count;
    }
  }
  return 0;
};

export const getRemainingUsage = (userId?: string): number => {
  return Math.max(0, DAILY_LIMIT - getUsage(userId));
};

export const incrementUsage = (userId?: string): boolean => {
  if (!userId) return false;
  const today = new Date().toISOString().split('T')[0];
  const current = getUsage(userId);

  if (current >= DAILY_LIMIT) {
    return false;
  }

  const newStats: UsageStats = {
    date: today,
    count: current + 1
  };
  
  localStorage.setItem(getUsageKey(userId), JSON.stringify(newStats));
  return true;
};

export const hasUsageRemaining = (userId?: string): boolean => {
  return getUsage(userId) < DAILY_LIMIT;
};