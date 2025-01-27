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
    // MongoDB connection
    if (config.mongoUri) {
        try {
            console.log('Attempting to connect to MongoDB with URI:', config.mongoUri.replace(/\/\/[^@]+@/, '//*****@'));
            await mongoose.connect(config.mongoUri, {
                serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            });
            console.log('MongoDB connected successfully');
            
            // Log MongoDB connection state
            mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
            mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));
            mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
        } catch (err) {
            console.error('MongoDB connection error:', err);
            console.error('MongoDB connection details:', {
                uri: config.mongoUri.replace(/\/\/[^@]+@/, '//*****@'),
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            });
        }
    } else {
        console.log('MongoDB URI not provided, skipping connection');
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            console.log('Attempting to connect to Redis with URL:', config.redisUrl.replace(/\/\/[^@]+@/, '//*****@'));
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
                    connectTimeout: 5000, // Connection timeout of 5 seconds
                }
            });

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err);
                console.error('Redis connection details:', {
                    url: config.redisUrl.replace(/\/\/[^@]+@/, '//*****@'),
                    environment: process.env.NODE_ENV,
                    nodeVersion: process.version
                });
            });

            redisClient.on('connect', () => console.log('Redis client connected'));
            redisClient.on('ready', () => console.log('Redis client ready'));
            redisClient.on('reconnecting', () => console.log('Redis client reconnecting'));
            redisClient.on('end', () => console.log('Redis client connection ended'));

            await redisClient.connect();
            console.log('Redis connection established');
        } catch (err) {
            console.error('Redis connection error:', err);
            console.error('Redis connection details:', {
                url: config.redisUrl.replace(/\/\/[^@]+@/, '//*****@'),
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            });
            redisClient = null;
        }
    } else {
        console.log('Redis URL not provided, skipping connection');
    }
}

// Initialize databases and handle any errors
initializeDatabases().catch((err) => {
    console.error('Failed to initialize databases:', err);
    console.error('Error details:', {
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