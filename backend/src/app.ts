import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import config from './config';
import blogPostRoutes from './routes/blogPosts';

const app = express();

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
    console.log('Starting database initialization...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Node Version:', process.version);

    // MongoDB connection
    if (config.mongoUri) {
        try {
            const sanitizedUri = config.mongoUri.replace(/\/\/[^@]+@/, '//*****@');
            console.log('Attempting to connect to MongoDB...');
            console.log('MongoDB URI format:', sanitizedUri);
            console.log('MongoDB connection options:', {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            });

            await mongoose.connect(config.mongoUri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('MongoDB connected successfully');
            
            // Log MongoDB connection state
            mongoose.connection.on('connected', () => {
                console.log('MongoDB connection established');
                console.log('MongoDB connection state:', mongoose.connection.readyState);
                console.log('MongoDB connection details:', {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name
                });
            });

            mongoose.connection.on('error', err => {
                console.error('MongoDB connection error:', err);
                console.error('MongoDB error details:', {
                    code: err.code,
                    name: err.name,
                    message: err.message
                });
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                console.log('Attempting to reconnect to MongoDB...');
            });
        } catch (err: any) {
            console.error('MongoDB connection error:', err);
            console.error('MongoDB connection failure details:', {
                code: err.code,
                name: err.name,
                message: err.message,
                stack: err.stack
            });
        }
    } else {
        console.log('MongoDB URI not provided, skipping connection');
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            const sanitizedUrl = config.redisUrl.replace(/\/\/[^@]+@/, '//*****@');
            console.log('Attempting to connect to Redis...');
            console.log('Redis URL format:', sanitizedUrl);
            console.log('Redis connection options:', {
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: 'exponential'
                }
            });

            redisClient = createClient({
                url: config.redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        console.log(`Redis reconnect attempt ${retries}`);
                        if (retries > 10) {
                            console.error('Max Redis reconnection attempts reached');
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    },
                    connectTimeout: 5000
                }
            });

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err);
                console.error('Redis error details:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
            });

            redisClient.on('connect', () => {
                console.log('Redis client connected');
                console.log('Redis connection details:', {
                    isOpen: redisClient?.isOpen,
                    isReady: redisClient?.isReady
                });
            });

            redisClient.on('ready', () => console.log('Redis client ready for commands'));
            redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));
            redisClient.on('end', () => console.log('Redis client connection ended'));

            await redisClient.connect();
            console.log('Redis connection established successfully');
        } catch (err: any) {
            console.error('Redis connection error:', err);
            console.error('Redis connection failure details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            redisClient = null;
        }
    } else {
        console.log('Redis URL not provided, skipping connection');
    }
}

// Initialize databases with comprehensive error handling
initializeDatabases().catch((err) => {
    console.error('Failed to initialize databases:', err);
    console.error('Initialization error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
    });
});

// Debug route
app.get('/debug', async (_req: Request, res: Response) => {
    const redisStatus = redisClient?.isOpen ?? false;
    
    res.json({
        environment: process.env.NODE_ENV,
        mongoUri: config.mongoUri ? 'Set' : 'Not set',
        redisUrl: config.redisUrl ? 'Set' : 'Not set',
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        mongodbStatus: mongoose.connection.readyState,
        redisStatus: redisStatus ? 'connected' : 'disconnected'
    });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
    const dbStatus = {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redisClient?.isOpen ?? false ? 'connected' : 'disconnected'
    };

    res.json({ 
        message: 'Blog Review API',
        version: '1.0.1',
        environment: process.env.NODE_ENV,
        status: 'operational',
        databases: dbStatus,
        endpoints: {
            health: '/api/health',
            blogPosts: '/api/blog-posts',
            debug: '/debug'
        }
    });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
    const dbStatus = {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redisClient?.isOpen ?? false ? 'connected' : 'disconnected'
    };

    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        databases: dbStatus
    });
});

// Routes
app.use('/api/blog-posts', blogPostRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: {
            root: '/',
            health: '/api/health',
            blogPosts: '/api/blog-posts',
            debug: '/debug'
        }
    });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message;
    
    res.status(statusCode).json({ error: message });
});

export default app; 