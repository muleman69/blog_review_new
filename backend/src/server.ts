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
        debugLog.server(`Serverless request started: ${req.method} ${req.url}`);
        debugLog.server('Request headers:', req.headers);
        
        // Wrap the Express app handling in a promise with timeout
        const handleRequest = new Promise<void>((resolve, reject) => {
            let hasResponded = false;

            // Set a timeout for the entire request
            const timeout = setTimeout(() => {
                if (!hasResponded) {
                    hasResponded = true;
                    debugLog.error('timeout', new Error('Request timeout after 10s'));
                    res.status(500).json({
                        error: 'Request Timeout',
                        message: 'The request took too long to process',
                        timestamp: new Date().toISOString()
                    });
                    reject(new Error('Request timeout'));
                }
            }, 10000);

            // Handle response completion
            res.on('finish', () => {
                hasResponded = true;
                clearTimeout(timeout);
                debugLog.server(`Request completed with status ${res.statusCode}`);
                resolve();
            });

            // Handle response close
            res.on('close', () => {
                hasResponded = true;
                clearTimeout(timeout);
                debugLog.server('Response closed');
                resolve();
            });

            // Handle response error
            res.on('error', (error: Error) => {
                hasResponded = true;
                clearTimeout(timeout);
                debugLog.error('response-error', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Response Error',
                        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
                        timestamp: new Date().toISOString()
                    });
                }
                reject(error);
            });

            // Process the request through Express
            try {
                debugLog.server('Processing request through Express');
                app(req, res);
            } catch (err: any) {
                hasResponded = true;
                clearTimeout(timeout);
                debugLog.error('express-error', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Express Processing Error',
                        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
                        timestamp: new Date().toISOString()
                    });
                }
                reject(err);
            }
        });

        await handleRequest;
        debugLog.server('Request handling completed successfully');
        return;

    } catch (err: any) {
        debugLog.error('serverless-handler', err);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Serverless Handler Error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
                timestamp: new Date().toISOString()
            });
        }
        return;
    }
} 