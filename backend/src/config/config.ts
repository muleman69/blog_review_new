import dotenv from 'dotenv';

dotenv.config();

interface RedisConfig {
    connectTimeout: number;
    maxRetries: number;
    initialRetryDelay: number;
    maxRetryDelay: number;
    enabled: boolean;
}

interface Config {
    port: number | string;
    mongoUri: string;
    redisUrl: string;
    jwtSecret: string;
    deepseekApiKey: string | undefined;
    deepseekApiUrl: string;
    redis: RedisConfig;
}

export const config: Config = {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/blog_review',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekApiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    redis: {
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        initialRetryDelay: parseInt(process.env.REDIS_INITIAL_RETRY_DELAY || '1000'),
        maxRetryDelay: parseInt(process.env.REDIS_MAX_RETRY_DELAY || '5000'),
        enabled: process.env.REDIS_ENABLED !== 'false'
    }
}; 