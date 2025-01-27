import app from './app';
import config from './config';

// Log startup configuration (sanitized)
console.log('Starting server with config:', {
    nodeEnv: process.env.NODE_ENV,
    port: config.port,
    mongoUri: config.mongoUri ? 'Set' : 'Not set',
    redisUrl: config.redisUrl ? 'Set' : 'Not set',
    jwtSecret: config.jwtSecret ? 'Set' : 'Not set'
});

const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle server errors
server.on('error', (error: Error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 