import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/index';
import blogPostRoutes from './routes/blogPost';
import authRoutes from './routes/auth';
import { debugLog } from './utils/debug';
import { getRedisClient } from './utils/redis';
import { ensureDatabaseConnections } from './server';
import { debugMiddleware } from './middleware/debug';

const app = express();

// Debug middleware first to catch all requests
app.use(debugMiddleware);

// CORS middleware
const corsOptions = {
    origin: ['https://buildableblog.pro', 'https://www.buildableblog.pro', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
};

app.use(cors(corsOptions));

// Handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before database middleware)
app.get('/health', cors(corsOptions), (_req, res) => {
    try {
        console.log('[Health Check] Endpoint called');
        debugLog.server('Health check endpoint called');
        
        const healthInfo = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'unknown',
            version: '1.0.0'
        };

        return res.status(200).json(healthInfo);
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        debugLog.error('health-check', err);
        
        return res.status(500).json({
            error: 'Health Check Failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
    }
});

// Mount auth routes with CORS
app.use('/auth', cors(corsOptions), authRoutes);

// Database connection middleware for protected routes
app.use('/api/blog-posts/*', cors(corsOptions), async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// API routes with CORS
app.use('/api/blog-posts', cors(corsOptions), blogPostRoutes);

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