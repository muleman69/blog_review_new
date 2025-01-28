import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import { debugLog } from './utils/debug';
import { getRedisClient } from './utils/redis';
import { ensureDatabaseConnections } from './server';
import { debugMiddleware } from './middleware/debug';

const app = express();

// Debug middleware first to catch all requests
app.use(debugMiddleware);

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

// Health check endpoint (before database middleware)
app.get('/api/health', (_req, res) => {
    try {
        debugLog.server('Health check endpoint called');
        res.json({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
            version: '1.0.0',
            debug: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        });
    } catch (err: any) {
        debugLog.error('health-check', err);
        res.status(500).json({
            error: 'Health Check Failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            timestamp: new Date().toISOString()
        });
    }
});

// Database connection middleware for protected routes
app.use('/api/blog-posts/*', async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        debugLog.server('Attempting database connection...');
        await ensureDatabaseConnections();
        next();
    } catch (error: any) {
        debugLog.error('database-middleware', error);
        res.status(500).json({
            error: 'Database Connection Error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
            timestamp: new Date().toISOString()
        });
    }
});

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
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime()
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
    if (!res.headersSent) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined,
            timestamp: new Date().toISOString(),
            path: _req.path,
            method: _req.method
        });
    }
});

// Handle 404s
app.use((_req: express.Request, res: express.Response) => {
    if (!res.headersSent) {
        debugLog.server(`404 Not Found: ${_req.method} ${_req.path}`);
        res.status(404).json({ 
            error: 'Not Found',
            path: _req.path,
            method: _req.method,
            timestamp: new Date().toISOString()
        });
    }
});

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
    debugLog.error('uncaught-exception', error);
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: any) => {
    debugLog.error('unhandled-rejection', reason);
    console.error('Unhandled Rejection:', reason);
});

export default app; 