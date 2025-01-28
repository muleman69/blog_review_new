import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import { debugLog } from './utils/debug';
import { getRedisClient } from './utils/redis';
import { connectDatabases } from './server';

const app = express();

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    debugLog.server(`${req.method} ${req.path}`);
    next();
});

// Database connection middleware for serverless
app.use(async (req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectDatabases();
        next();
    } catch (error) {
        debugLog.error('database-middleware', error);
        next(error);
    }
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

app.get('/debug', async (_req: Request, res: Response) => {
    try {
        const redisClient = getRedisClient();
        res.json({
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
    } catch (err: any) {
        debugLog.error('debug-endpoint', err);
        res.status(500).json({
            error: 'Failed to get debug information',
            details: config.nodeEnv === 'development' ? err.message : undefined
        });
    }
});

app.get('/api/health', async (_req: Request, res: Response) => {
    try {
        const redisClient = getRedisClient();
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

        res.json({
            status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                mongodb: mongoStatus,
                redis: redisStatus
            }
        });
    } catch (err: any) {
        debugLog.error('health-check', err);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to check service health',
            details: config.nodeEnv === 'development' ? err.message : undefined
        });
    }
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