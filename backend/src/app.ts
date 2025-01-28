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
    origin: '*', // Temporarily allow all origins for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400, // 24 hours
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before database middleware)
app.get('/api/health', (_req, res) => {
    try {
        console.log('[Health Check] Endpoint called');
        debugLog.server('Health check endpoint called');
        
        // Set explicit headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        
        const healthInfo = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'unknown',
            version: '1.0.0',
            debug: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                pid: process.pid
            },
            request: {
                headers: _req.headers,
                url: _req.url,
                method: _req.method
            }
        };

        console.log('[Health Check] Sending response:', healthInfo);
        debugLog.server('Health check response:', healthInfo);
        
        return res.status(200).json(healthInfo);
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[Health Check] Error:', err);
        debugLog.error('health-check', err);
        
        const errorResponse = {
            error: 'Health Check Failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path: _req.path,
            method: _req.method
        };
        
        console.error('[Health Check] Error Response:', errorResponse);
        debugLog.server('Health check error response:', errorResponse);
        
        return res.status(500).json(errorResponse);
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