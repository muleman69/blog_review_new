import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'MONGO_URI', 'REDIS_URL', 'JWT_SECRET'];
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
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekApiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000']
};

// Log sanitized configuration on startup
console.log('Starting server with configuration:', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongoUri: config.mongoUri ? 'Set' : 'Not set',
    redisUrl: config.redisUrl ? 'Set' : 'Not set',
    jwtSecret: 'Hidden',
    corsOrigins: config.corsOrigins
});

export default config; 