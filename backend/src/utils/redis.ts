import { createClient, RedisClientType } from 'redis';
import { debugLog } from './debug';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

let redisClient: RedisClientType | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

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
    } catch (error) {
        debugLog.error('redis-dns', error);
        return url; // Fall back to original URL if resolution fails
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
        
        redisClient = createClient({
            url: resolvedUrl,
            socket: {
                connectTimeout: 10000,
                keepAlive: 30000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        debugLog.error('redis', 'Max reconnection attempts reached');
                        return false;
                    }
                    return Math.min(retries * 1000, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            debugLog.error('redis', err);
            if (connectionAttempts < MAX_RETRIES) {
                debugLog.redis(`Retrying connection (attempt ${connectionAttempts + 1}/${MAX_RETRIES})...`);
                setTimeout(() => connectRedis(url), 1000 * connectionAttempts);
            }
        });

        redisClient.on('connect', () => {
            debugLog.redis('Redis client connected successfully');
            connectionAttempts = 0; // Reset counter on successful connection
        });

        redisClient.on('ready', () => {
            debugLog.redis('Redis client ready for commands');
        });

        redisClient.on('reconnecting', () => {
            debugLog.redis('Redis client reconnecting...');
        });

        await redisClient.connect();
        debugLog.redis('Redis connection established');
        
        return redisClient;
    } catch (error) {
        debugLog.error('redis', error);
        if (connectionAttempts < MAX_RETRIES) {
            debugLog.redis(`Retrying connection (attempt ${connectionAttempts + 1}/${MAX_RETRIES})...`);
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(connectRedis(url));
                }, 1000 * connectionAttempts);
            });
        }
        return null;
    }
}

export function getRedisClient(): RedisClientType | null {
    return redisClient;
} 