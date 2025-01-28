import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import { debugLog } from './utils/debug';
import { getRedisClient } from './utils/redis';
import { ensureDatabaseConnections } from './server';

const app = express();

// Detailed request logging middleware
app.use((req, _res, next) => {
    debugLog.server(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    debugLog.server(`Headers: ${JSON.stringify(req.headers)}`);
    next();
});

// Database connection middleware for serverless
app.use(async (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    try {
        await ensureDatabaseConnections();
        next();
    } catch (error) {
        debugLog.error('database-middleware', error);
        next(error);
    }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
    debugLog.server('Health check endpoint called');
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// CORS middleware
app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug route
app.get('/debug', async (_req: express.Request, res: express.Response) => {
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

// API routes
app.use('/api/blog-posts', blogPostRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    debugLog.error('express-error', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});

// Handle 404s
app.use((_req: express.Request, res: express.Response) => {
    if (!res.headersSent) {
        res.status(404).json({ error: 'Not Found' });
    }
});

export default app; 