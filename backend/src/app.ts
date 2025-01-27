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
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Initialize database connections only if URIs are provided
async function initializeDatabases() {
    if (config.mongoUri) {
        try {
            await mongoose.connect(config.mongoUri);
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            // Don't crash the app, just log the error
        }
    } else {
        console.log('MongoDB URI not provided, skipping connection');
    }

    if (config.redisUrl) {
        try {
            const redisClient = createClient({ url: config.redisUrl });
            await redisClient.connect();
            console.log('Connected to Redis');
        } catch (err) {
            console.error('Redis connection error:', err);
            // Don't crash the app, just log the error
        }
    } else {
        console.log('Redis URL not provided, skipping connection');
    }
}

// Initialize databases but don't wait for them
initializeDatabases().catch(console.error);

// Debug route
app.get('/debug', (_req: Request, res: Response) => {
    res.json({
        environment: process.env.NODE_ENV,
        mongoUri: config.mongoUri ? 'Set' : 'Not set',
        redisUrl: config.redisUrl ? 'Set' : 'Not set',
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        mongodbStatus: mongoose.connection.readyState
    });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.json({ 
        message: 'Blog Review API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        status: 'operational',
        endpoints: {
            health: '/api/health',
            blogPosts: '/api/blog-posts',
            debug: '/debug'
        }
    });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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