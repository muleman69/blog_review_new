interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;

  static async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
      return entry.value;
    }

    // If entry exists but is expired, delete it
    if (entry) {
      this.cache.delete(key);
    }

    // Fetch new value
    const value = await fetchFn();

    // Store in cache
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + ttl
    });

    // Cleanup if cache is too large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    return value;
  }

  static set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  static invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }

  static getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  static async warmup<T>(
    keys: string[],
    fetchFn: (key: string) => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    await Promise.all(
      keys.map(key => this.get(key, () => fetchFn(key), ttl))
    );
  }
}

export default CacheService; 