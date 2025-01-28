import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import { debugLog, dumpState } from './utils/debug';

const app = express();

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    debugLog.server(`${req.method} ${req.path}`);
    next();
});

// Middleware
app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Initialize database connections only if URIs are provided
let redisClient: ReturnType<typeof createClient> | null = null;

async function initializeDatabases() {
    debugLog.server('Starting database initialization...');
    debugLog.server('System state:', dumpState());

    // MongoDB connection
    if (config.mongoUri) {
        try {
            const sanitizedUri = config.mongoUri.replace(/\/\/[^@]+@/, '//*****@');
            debugLog.db('Attempting to connect to MongoDB...');
            debugLog.db('MongoDB URI format:', sanitizedUri);

            mongoose.set('debug', config.nodeEnv === 'development');
            
            await mongoose.connect(config.mongoUri);
            debugLog.db('MongoDB connected successfully');
            
            mongoose.connection.on('error', (err) => {
                debugLog.error('mongodb', err);
            });

            mongoose.connection.on('disconnected', () => {
                debugLog.db('MongoDB disconnected, attempting to reconnect...');
                mongoose.connect(config.mongoUri).catch(err => {
                    debugLog.error('mongodb', err);
                });
            });

            mongoose.connection.on('reconnected', () => {
                debugLog.db('MongoDB reconnected successfully');
            });

        } catch (error) {
            debugLog.error('mongodb', error);
        }
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            debugLog.redis('Attempting to connect to Redis...');
            
            redisClient = createClient({
                url: config.redisUrl
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
        } catch (error) {
            debugLog.error('redis', error);
            redisClient = null;
        }
    }
}

// Initialize databases
initializeDatabases().catch(error => {
    debugLog.error('database-init', error);
});

// Routes
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Blog Review API',
        version: '1.0.0',
        status: 'running',
        endpoints: ['/api/blog-posts', '/api/health']
    });
});

app.get('/debug', (_req: Request, res: Response) => {
    res.json({
        ...dumpState(),
        environment: config.nodeEnv,
        mongodb: {
            connected: mongoose.connection.readyState === 1,
            state: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        redis: {
            connected: redisClient?.isOpen || false,
            ready: redisClient?.isReady || false
        }
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient?.isOpen ? 'connected' : 'disconnected'
        }
    });
});

// API routes
app.use('/api/blog-posts', blogPostRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    debugLog.error('express', err);
    res.status(500).json({
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    });
});

export default app; 