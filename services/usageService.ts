const DAILY_LIMIT = 50;
const USAGE_KEY = 'aimers_usage_stats';

interface UsageStats {
  date: string; // YYYY-MM-DD
  count: number;
}

export const getUsage = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(USAGE_KEY);
  
  if (stored) {
    const stats: UsageStats = JSON.parse(stored);
    if (stats.date === today) {
      return stats.count;
    }
  }
  return 0;
};

export const getRemainingUsage = (): number => {
  return Math.max(0, DAILY_LIMIT - getUsage());
};

export const incrementUsage = (): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const current = getUsage();

  if (current >= DAILY_LIMIT) {
    return false;
  }

  const newStats: UsageStats = {
    date: today,
    count: current + 1
  };
  
  localStorage.setItem(USAGE_KEY, JSON.stringify(newStats));
  return true;
};

export const hasUsageRemaining = (): boolean => {
  return getUsage() < DAILY_LIMIT;
};