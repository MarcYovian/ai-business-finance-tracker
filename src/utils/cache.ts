import { AI_CONSTANTS } from "@/constants/constants";
import { CacheEntry } from "@/types/ai";

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultDuration: number;

  constructor(defaultDuration: number = AI_CONSTANTS.CACHE_DURATION_MS) {
    this.cache = new Map();
    this.defaultDuration = defaultDuration;
    this.startCleanupInterval();
  }

  set<T>(key: string, data: T, duration?: number): void {
    const now = Date.now();
    const ttl = duration || this.defaultDuration;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern);

    keys.forEach((key) => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());

    keys.forEach((key) => {
      const entry = this.cache.get(key);
      if (entry && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });
  }

  private startCleanupInterval(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheManager = new CacheManager();

// Helper functions for specific cache keys
export const getCacheKey = {
  transactions: (userId: string) => `transactions:${userId}`,
  categories: (userId: string) => `categories:${userId}`,
  fundSources: (userId: string) => `fundSources:${userId}`,
  monthlyStats: (userId: string, month: string) =>
    `monthlyStats:${userId}:${month}`,
  categoryBreakdown: (userId: string, period: string) =>
    `categoryBreakdown:${userId}:${period}`,
};

export const invalidateUserCache = (userId: string): void => {
  cacheManager.invalidatePattern(`^.*:${userId}`);
};
