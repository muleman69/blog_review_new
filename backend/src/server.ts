import { Request, Response } from 'express';
import app from './app';
import config from './config';
import { connectMongoDB } from './utils/mongodb';
import { connectRedis } from './utils/redis';
import { debugLog } from './utils/debug';

let isConnected = false;

export async function ensureDatabaseConnections() {
    try {
        if (isConnected) {
            debugLog.server('Using existing database connections');
            return;
        }

        debugLog.server('Initializing database connections...');

        // Connect to MongoDB
        if (!config.mongoUri) {
            throw new Error('MongoDB URI is not configured');
        }
        await connectMongoDB(config.mongoUri);

        // Connect to Redis
        if (!config.redisUrl) {
            throw new Error('Redis URL is not configured');
        }
        await connectRedis(config.redisUrl);

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
        debugLog.server(`Serverless request: ${req.method} ${req.url}`);
        
        // Ensure database connections
        await ensureDatabaseConnections();

        // Create a promise to handle the Express app response
        return new Promise((resolve, reject) => {
            const done = () => {
                resolve(undefined);
            };

            app(req, res);
            
            // Handle response completion
            res.on('finish', done);
            res.on('close', done);

            // Handle errors
            res.on('error', (error: Error) => {
                debugLog.error('express-error', error);
                reject(error);
            });
        });
    } catch (err) {
        const error = err as Error;
        debugLog.error('serverless-handler', error);
        
        // Don't send response if it's already been sent
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
                timestamp: new Date().toISOString()
            });
        }
        return undefined;
    }
} 