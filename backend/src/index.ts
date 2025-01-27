import app from './app';
import { config } from './config/config';

// Add startup logging
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

// Add error handling for the server
server.on('error', (error: Error) => {
    console.error('Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 