import { createClient, RedisClientType } from 'redis';
import { debugLog } from './debug';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

let redisClient: RedisClientType | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface RedisConfig {
    url: string;
    connectTimeout?: number;
    maxReconnectAttempts?: number;
    initialRetryDelay?: number;
}

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

async function createRedisConnection(config: RedisConfig): Promise<RedisClientType | null> {
    const client = createClient({
        url: config.url,
        socket: {
            connectTimeout: config.connectTimeout || 10000,
            keepAlive: 30000,
            reconnectStrategy: (retries) => {
                if (retries > (config.maxReconnectAttempts || 10)) {
                    debugLog.error('redis', 'Max reconnection attempts reached');
                    return false;
                }
                const delay = Math.min(retries * (config.initialRetryDelay || INITIAL_RETRY_DELAY), 5000);
                debugLog.redis(`Reconnecting in ${delay}ms...`);
                return delay;
            }
        }
    });

    client.on('error', (err) => {
        debugLog.error('redis', err);
    });

    client.on('connect', () => {
        debugLog.redis('Redis client connected successfully');
        connectionAttempts = 0;
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

export async function connectRedis(url: string): Promise<RedisClientType | null> {
    try {
        if (redisClient?.isOpen) {
            debugLog.redis('Reusing existing Redis connection');
            return redisClient;
        }

        debugLog.redis('Attempting to connect to Redis...');
        connectionAttempts++;

        const resolvedUrl = await getRedisEndpoint(url);
        
        redisClient = await createRedisConnection({
            url: resolvedUrl,
            connectTimeout: 10000,
            maxReconnectAttempts: MAX_RETRIES,
            initialRetryDelay: INITIAL_RETRY_DELAY
        });

        if (!redisClient && connectionAttempts < MAX_RETRIES) {
            debugLog.redis(`Connection attempt ${connectionAttempts} failed, retrying...`);
            const delay = Math.min(connectionAttempts * INITIAL_RETRY_DELAY, 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectRedis(url);
        }

        return redisClient;
    } catch (err) {
        const error = err as Error;
        debugLog.error('redis', error);
        if (connectionAttempts < MAX_RETRIES) {
            debugLog.redis(`Retrying connection (attempt ${connectionAttempts + 1}/${MAX_RETRIES})...`);
            const delay = Math.min(connectionAttempts * INITIAL_RETRY_DELAY, 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectRedis(url);
        }
        return null;
    }
}

export function getRedisClient(): RedisClientType | null {
    return redisClient;
}

export function isRedisConnected(): boolean {
    return redisClient?.isOpen || false;
} 