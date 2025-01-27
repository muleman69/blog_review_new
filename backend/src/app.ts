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

// Connect to MongoDB
mongoose.connect(config.mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if we can't connect to MongoDB
    });

// Initialize Redis only if URL is provided
if (config.redisUrl) {
    const redisClient = createClient({ url: config.redisUrl });
    redisClient.connect()
        .then(() => console.log('Connected to Redis'))
        .catch((err) => console.error('Redis connection error:', err));
}

// Debug route to check environment
app.get('/debug', (_req: Request, res: Response) => {
    res.json({
        environment: process.env.NODE_ENV,
        mongoUri: process.env.MONGO_URI ? 'Set' : 'Not Set',
        redisUrl: process.env.REDIS_URL ? 'Set' : 'Not Set',
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.json({ 
        message: 'Blog Review API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
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
        mongoConnected: mongoose.connection.readyState === 1
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