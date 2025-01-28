import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import { debugLog, dumpState } from './utils/debug';
import { getRedisClient } from './utils/redis';

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
    const redisClient = getRedisClient();
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
    const redisClient = getRedisClient();
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