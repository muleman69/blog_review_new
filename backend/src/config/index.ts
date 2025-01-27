import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'MONGO_URI', 'REDIS_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri: process.env.MONGO_URI || '',
    redisUrl: process.env.REDIS_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'default-development-secret',
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000'],
    // Database specific configurations
    mongodb: {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000
    },
    redis: {
        connectTimeout: 5000,
        maxReconnectAttempts: 10,
        reconnectStrategy: 'exponential'
    }
};

// Log sanitized configuration on startup
console.log('Loading configuration:', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongoUri: config.mongoUri ? 'Set' : 'Not set',
    redisUrl: config.redisUrl ? 'Set' : 'Not set',
    jwtSecret: 'Hidden',
    corsOrigins: config.corsOrigins,
    mongodb: config.mongodb,
    redis: config.redis
});

export default config; 