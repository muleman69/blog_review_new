import app from './app';
import config from './config';
import { connectMongoDB } from './utils/mongodb';
import { connectRedis } from './utils/redis';
import { debugLog } from './utils/debug';

let isConnected = false;

async function connectDatabases() {
    try {
        if (isConnected) {
            debugLog.server('Using existing database connections');
            return;
        }

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
        // In serverless, we don't want to exit the process
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
    const startServer = async () => {
        await connectDatabases();
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
    };

    startServer().catch((error) => {
        debugLog.error('startup', error);
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    });
}

// For Vercel serverless deployment
export default app;

// Export the connection function for serverless use
export { connectDatabases }; 