import { createClient } from 'redis';
import type { RedisClientType, RedisClientOptions } from 'redis';
import { debugLog } from './debug';
import dns from 'dns';
import { promisify } from 'util';
import config from '../config';

const lookup = promisify(dns.lookup);

// Define a more specific Redis client type
type RedisClient = RedisClientType<{
    [key: string]: never;
}>;

let redisClient: RedisClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClient | null> | null = null;

async function getRedisEndpoint(url: string): Promise<string> {
    try {
        // Parse the Redis URL
        const redisUrl = new URL(url);
        
        // If it's already an IP, return as is
        if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(redisUrl.hostname)) {
            return url;
        }

        // Try to resolve the hostname to IP
        debugLog.redis(`Resolving Redis hostname: ${redisUrl.hostname}`);
        const { address } = await lookup(redisUrl.hostname);
        debugLog.redis(`Resolved Redis IP: ${address}`);

        // Replace hostname with IP in the URL
        redisUrl.hostname = address;
        return redisUrl.toString();
    } catch (err) {
        const error = err as Error;
        debugLog.error('redis-dns', error);
        return url; // Fall back to original URL if resolution fails
    }
}

async function createRedisConnection(url: string): Promise<RedisClient | null> {
    const options: RedisClientOptions = {
        url,
        socket: {
            connectTimeout: config.redis.connectTimeout,
            keepAlive: 30000,
            reconnectStrategy: (retries) => {
                if (retries > config.redis.maxRetries) {
                    debugLog.error('redis', 'Max reconnection attempts reached');
                    return false;
                }
                const delay = Math.min(
                    retries * config.redis.initialRetryDelay,
                    config.redis.maxRetryDelay
                );
                debugLog.redis(`Reconnecting in ${delay}ms...`);
                return delay;
            }
        }
    };

    const client = createClient(options) as RedisClient;

    client.on('error', (err) => {
        debugLog.error('redis', err);
    });

    client.on('connect', () => {
        debugLog.redis('Redis client connected successfully');
    });

    client.on('ready', () => {
        debugLog.redis('Redis client ready for commands');
    });

    client.on('reconnecting', () => {
        debugLog.redis('Redis client reconnecting...');
    });

    try {
        await client.connect();
        debugLog.redis('Redis connection established');
        return client;
    } catch (err) {
        const error = err as Error;
        debugLog.error('redis-connect', error);
        return null;
    }
}

export async function connectRedis(): Promise<RedisClient | null> {
    try {
        // If Redis URL is not configured, return null without error
        if (!config.redisUrl) {
            debugLog.redis('Redis URL not configured, skipping connection');
            return null;
        }

        // If already connected, return existing client
        if (redisClient?.isOpen) {
            debugLog.redis('Reusing existing Redis connection');
            return redisClient;
        }

        // If connection is in progress, return existing promise
        if (isConnecting && connectionPromise) {
            debugLog.redis('Redis connection in progress, waiting...');
            return connectionPromise;
        }

        isConnecting = true;
        debugLog.redis('Attempting to connect to Redis...');

        const resolvedUrl = await getRedisEndpoint(config.redisUrl);
        
        connectionPromise = createRedisConnection(resolvedUrl)
            .then((client) => {
                if (client) {
                    redisClient = client;
                }
                return client;
            })
            .finally(() => {
                isConnecting = false;
                connectionPromise = null;
            });

        return connectionPromise;
    } catch (err) {
        isConnecting = false;
        connectionPromise = null;
        const error = err as Error;
        debugLog.error('redis', error);
        return null;
    }
}

export function getRedisClient(): RedisClient | null {
    return redisClient;
}

export function isRedisConnected(): boolean {
    return redisClient?.isOpen || false;
}

// Add caching operation with fallback
export async function cacheOperation<T>(
    operation: () => Promise<T>,
    key: string,
    ttl: number
): Promise<T> {
    try {
        const client = await getRedisClient();
        if (!client || !config.redis.enabled) {
            debugLog.redis('Redis not available or disabled, executing operation directly');
            return operation();
        }

        // Try to get from cache first
        const cached = await client.get(key);
        if (cached) {
            debugLog.redis(`Cache hit for key: ${key}`);
            return JSON.parse(cached);
        }

        // If not in cache, execute operation
        const result = await operation();
        
        // Store in cache
        try {
            await client.setEx(key, ttl, JSON.stringify(result));
            debugLog.redis(`Cached result for key: ${key}`);
        } catch (cacheError) {
            debugLog.error('redis-cache', cacheError as Error);
            // Don't throw error on cache failure
        }

        return result;
    } catch (error) {
        debugLog.error('redis-operation', error as Error);
        // Fallback to direct operation if Redis fails
        return operation();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            debugLog.redis('Redis connection closed through app termination');
        } catch (err) {
            debugLog.error('redis-shutdown', err);
        }
    }
}); 