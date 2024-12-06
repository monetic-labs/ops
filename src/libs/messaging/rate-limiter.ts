interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Maximum number of unique tokens per interval
}

interface RateLimiter {
  check: (limit: number, token: string) => Promise<void>;
}

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const windowMap = new Map<string, number>();
  const tokenMap = new Map<string, Set<string>>();

  const getKey = (token: string) => {
    const now = Date.now();
    const windowStart = Math.floor(now / config.interval) * config.interval;

    return `${token}:${windowStart}`;
  };

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const key = getKey(token);
      const now = Date.now();
      const windowStart = Math.floor(now / config.interval) * config.interval;

      // Clean up old entries
      for (const [mapKey, timestamp] of Array.from(windowMap.entries())) {
        if (timestamp < windowStart) {
          windowMap.delete(mapKey);
          tokenMap.delete(mapKey);
        }
      }

      // Initialize or get current token set
      let tokenSet = tokenMap.get(key);

      if (!tokenSet) {
        tokenSet = new Set();
        tokenMap.set(key, tokenSet);
        windowMap.set(key, now);
      }

      // Check if limit is exceeded
      if (tokenSet.size >= limit) {
        throw new Error("rate limit exceeded");
      }

      // Add token to set
      tokenSet.add(token);

      // Return success
      return Promise.resolve();
    },
  };
}
