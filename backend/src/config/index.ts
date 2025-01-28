import dotenv from 'dotenv';
import { debugLog } from '../utils/debug';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    debugLog.error('config', `Missing required environment variables: ${missingEnvVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri: process.env.MONGO_URI,
    redisUrl: process.env.REDIS_URL, // Optional
    jwtSecret: process.env.JWT_SECRET,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekApiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000'],
    db: {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
    },
    redis: {
        maxRetries: 3,
        initialRetryDelay: 1000,
        maxRetryDelay: 5000,
        connectTimeout: 10000
    }
};

// Log sanitized configuration on startup
debugLog.config('Starting server with configuration:', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongoUri: config.mongoUri ? 'Set' : 'Not set',
    redisUrl: config.redisUrl ? 'Set' : 'Not set',
    jwtSecret: 'Hidden',
    corsOrigins: config.corsOrigins
});

// Also log to console in production
if (config.nodeEnv === 'production') {
    console.log('Starting server with configuration:', {
        nodeEnv: config.nodeEnv,
        port: config.port,
        mongoUri: config.mongoUri ? 'Set' : 'Not set',
        redisUrl: config.redisUrl ? 'Set' : 'Not set',
        jwtSecret: 'Hidden',
        corsOrigins: config.corsOrigins
    });
}

export default config; 