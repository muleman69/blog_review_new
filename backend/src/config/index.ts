import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'MONGO_URI', 'REDIS_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Get MongoDB URI directly - no modification needed as it's already properly formatted
const mongoUri = process.env.MONGO_URI || '';

if (mongoUri) {
    // Log the sanitized URI for debugging
    const sanitizedUri = mongoUri.replace(/\/\/[^@]+@/, '//*****@');
    console.log('MongoDB URI format:', sanitizedUri);
}

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri,
    redisUrl: process.env.REDIS_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'default-development-secret',
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000'],
    // Database specific configurations
    mongodb: {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000, // Increased timeout significantly
        socketTimeoutMS: 75000, // Increased socket timeout
        family: 4, // Force IPv4
        ssl: true,
        tls: true, // Explicitly enable TLS
        authSource: 'admin',
        retryWrites: true,
        w: 'majority'
    },
    redis: {
        connectTimeout: 5000,
        maxReconnectAttempts: 10,
        reconnectStrategy: 'exponential'
    }
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

// Log MongoDB options
console.log('MongoDB connection options:', {
    ...config.mongodb,
    // Hide sensitive data
    uri: 'Hidden for security'
});

export default config; 