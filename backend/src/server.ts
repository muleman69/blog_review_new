import { Request, Response } from 'express';
import app from './app';
import config from './config';
import { connectMongoDB } from './utils/mongodb';
import { connectRedis } from './utils/redis';
import { debugLog } from './utils/debug';

let isConnected = false;

async function ensureDatabaseConnections() {
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
    } catch (error) {
        debugLog.error('database-connection', error);
        throw error; // Let the handler deal with the error
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
        } catch (error) {
            debugLog.error('startup', error);
            process.exit(1);
        }
    };

    startDevServer();
}

// For Vercel serverless deployment
async function handler(req: Request, res: Response) {
    try {
        debugLog.server(`Serverless request: ${req.method} ${req.path}`);
        
        // Ensure database connections
        await ensureDatabaseConnections();

        // Forward the request to Express app
        return app(req, res);
    } catch (error) {
        debugLog.error('serverless-handler', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export default handler; 