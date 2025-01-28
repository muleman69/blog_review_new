import { Request, Response } from 'express';
import app from './app';
import config from './config';
import { connectMongoDB, getMongoConnectionState } from './utils/mongodb';
import { connectRedis, isRedisConnected } from './utils/redis';
import { debugLog } from './utils/debug';

let isConnected = false;

export async function ensureDatabaseConnections() {
    try {
        if (isConnected) {
            debugLog.server('Using existing database connections');
            return;
        }

        debugLog.server('Initializing database connections...');

        // Connect to MongoDB (required)
        await connectMongoDB();

        // Connect to Redis (optional)
        if (config.redisUrl) {
            try {
                await connectRedis();
            } catch (err) {
                const error = err as Error;
                debugLog.error('redis-connection', error);
                // Don't throw error for Redis connection failure
                debugLog.server('Continuing without Redis connection');
            }
        }

        isConnected = true;
        debugLog.server('Database connections established');
    } catch (err) {
        const error = err as Error;
        debugLog.error('database-connection', error);
        throw error;
    }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
    const startDevServer = async () => {
        try {
            await ensureDatabaseConnections();
            const server = app.listen(config.port, () => {
                debugLog.server(`Development server running on port ${config.port}`);
                debugLog.server(`Environment: ${config.nodeEnv}`);
                debugLog.server(`MongoDB status: ${getMongoConnectionState()}`);
                debugLog.server(`Redis connected: ${isRedisConnected()}`);
            });

            // Handle server errors
            server.on('error', (error: Error) => {
                debugLog.error('server', error);
                process.exit(1);
            });

            // Handle process termination
            process.on('SIGTERM', () => {
                debugLog.server('SIGTERM signal received. Closing server...');
                server.close(() => {
                    debugLog.server('Server closed');
                    process.exit(0);
                });
            });
        } catch (err) {
            const error = err as Error;
            debugLog.error('startup', error);
            process.exit(1);
        }
    };

    startDevServer();
}

// For Vercel serverless deployment
export default async function handler(req: Request, res: Response) {
    try {
        console.log(`[Serverless] Request started: ${req.method} ${req.url}`);
        console.log('[Serverless] Request headers:', req.headers);
        
        // Set basic headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');

        // Process the request through Express
        console.log('[Serverless] Processing request through Express');
        app(req, res);

        // Log completion
        res.on('finish', () => {
            console.log(`[Serverless] Request completed with status ${res.statusCode}`);
        });

    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[Serverless] Error:', err);
        
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Serverless Handler Error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
                timestamp: new Date().toISOString()
            });
        }
    }
} 