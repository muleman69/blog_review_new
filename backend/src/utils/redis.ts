import { createClient, RedisClientType } from 'redis';
import { debugLog } from './debug';

let redisClient: RedisClientType | null = null;

export async function connectRedis(url: string): Promise<RedisClientType | null> {
    try {
        debugLog.redis('Attempting to connect to Redis...');
        
        redisClient = createClient({
            url,
            socket: {
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
        });

        redisClient.on('connect', () => {
            debugLog.redis('Redis client connected successfully');
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
        return null;
    }
}

export function getRedisClient(): RedisClientType | null {
    return redisClient;
} 