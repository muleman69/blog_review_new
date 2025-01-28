import app from './app';
import config from './config';
import { connectMongoDB } from './utils/mongodb';
import { connectRedis } from './utils/redis';
import { debugLog, dumpState } from './utils/debug';

async function startServer() {
    try {
        debugLog.server('Starting server...');
        debugLog.server('System state:', dumpState());

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

        // Start the server
        const server = app.listen(config.port, () => {
            debugLog.server(`Server is running on port ${config.port}`);
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

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason: any) => {
            debugLog.error('unhandled-rejection', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error: Error) => {
            debugLog.error('uncaught-exception', error);
            process.exit(1);
        });

    } catch (error) {
        debugLog.error('startup', error);
        process.exit(1);
    }
}

startServer(); 