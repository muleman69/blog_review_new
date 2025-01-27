import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'MONGO_URI', 'REDIS_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Process MongoDB URI
let mongoUri = process.env.MONGO_URI || '';
if (mongoUri) {
    // Ensure the URI has the required query parameters for Atlas
    if (!mongoUri.includes('retryWrites=')) {
        mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'retryWrites=true';
    }
    if (!mongoUri.includes('w=')) {
        mongoUri += '&w=majority';
    }
    
    // Ensure there's a database name
    const uriParts = mongoUri.split('?')[0].split('/');
    if (uriParts.length <= 3) {
        mongoUri = mongoUri.replace('?', '/blog-review?');
    }
    
    console.log('Processed MongoDB URI format:', mongoUri.replace(/\/\/[^@]+@/, '//*****@'));
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
        serverSelectionTimeoutMS: 15000, // Increased timeout further
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,
        ssl: true,
        authSource: 'admin',
        useNewUrlParser: true,
        useUnifiedTopology: true
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
    corsOrigins: config.corsOrigins
});

// Log detailed MongoDB configuration (without sensitive data)
console.log('MongoDB configuration:', {
    ...config.mongodb,
    uri: config.mongoUri ? config.mongoUri.replace(/\/\/[^@]+@/, '//*****@') : 'Not set'
});

export default config; 