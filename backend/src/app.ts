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
            await mongoose.connect(config.mongoUri);
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    } else {
        console.log('MongoDB URI not provided, skipping connection');
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            console.log('Attempting to connect to Redis...');
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
                    }
                }
            });

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err);
                console.error('Redis URL format (sanitized):', config.redisUrl.replace(/\/\/.*@/, '//***@'));
            });

            redisClient.on('connect', () => {
                console.log('Redis client connected');
            });

            await redisClient.connect();
            console.log('Redis connection established');
        } catch (err) {
            console.error('Redis connection error:', err);
            console.error('Redis URL format (sanitized):', config.redisUrl.replace(/\/\/.*@/, '//***@'));
            redisClient = null;
        }
    } else {
        console.log('Redis URL not provided, skipping connection');
    }
}

// Initialize databases but don't wait for them
initializeDatabases().catch((err) => {
    console.error('Failed to initialize databases:', err);
    console.error('Error details:', err.message);
    if (err.cause) {
        console.error('Cause:', err.cause);
    }
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