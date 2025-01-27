import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { ConnectOptions } from 'mongoose';
import { createClient } from 'redis';
import config from './config';
import blogPostRoutes from './routes/blogPosts';

const app = express();

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware
app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Initialize database connections only if URIs are provided
let redisClient: ReturnType<typeof createClient> | null = null;

async function initializeDatabases() {
    console.log('Starting database initialization...');
    console.log('Environment:', config.nodeEnv);
    console.log('Node Version:', process.version);

    // MongoDB connection
    if (config.mongoUri) {
        try {
            const sanitizedUri = config.mongoUri.replace(/\/\/[^@]+@/, '//*****@');
            console.log('Attempting to connect to MongoDB...');
            console.log('MongoDB URI format:', sanitizedUri);

            mongoose.set('debug', config.nodeEnv === 'development');
            
            const mongooseOptions: ConnectOptions = {
                maxPoolSize: 10,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
                ssl: true,
                tls: true,
                authSource: 'admin',
                retryWrites: true,
                retryReads: true,
                serverApi: {
                    version: '1',
                    strict: true,
                    deprecationErrors: true
                }
            };
            
            await mongoose.connect(config.mongoUri, mongooseOptions);
            console.log('MongoDB connected successfully');
            
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                if (err instanceof Error) {
                    console.error('Error details:', err.message);
                    console.error('Stack trace:', err.stack);
                }
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected, attempting to reconnect...');
                mongoose.connect(config.mongoUri, mongooseOptions).catch(err => {
                    console.error('MongoDB reconnection failed:', err);
                });
            });

            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected successfully');
            });

        } catch (error) {
            console.error('MongoDB connection error:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
        }
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            console.log('Attempting to connect to Redis...');
            
            redisClient = createClient({
                url: config.redisUrl,
                socket: {
                    connectTimeout: 20000,
                    keepAlive: 10000,
                    reconnectStrategy: (retries) => {
                        console.log(`Redis reconnect attempt ${retries}`);
                        if (retries > 10) {
                            console.error('Max Redis reconnection attempts reached');
                            return new Error('Max Redis reconnection attempts reached');
                        }
                        return Math.min(retries * 1000, 10000);
                    },
                    tls: true,
                    rejectUnauthorized: false
                }
            });

            // Log Redis URL format for debugging (without credentials)
            const sanitizedRedisUrl = config.redisUrl.replace(/\/\/[^@]+@/, '//***:***@');
            console.log('Redis URL format:', sanitizedRedisUrl);

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err);
                if (err instanceof Error) {
                    console.error('Redis error details:', {
                        message: err.message,
                        stack: err.stack,
                        code: err.cause
                    });
                }
            });

            redisClient.on('connect', () => {
                console.log('Redis client connected successfully');
            });

            redisClient.on('ready', () => {
                console.log('Redis client ready for commands');
            });

            redisClient.on('reconnecting', () => {
                console.log('Redis client reconnecting...');
            });

            await redisClient.connect();
            console.log('Redis connection established');
        } catch (error) {
            console.error('Redis connection error:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
            redisClient = null;
        }
    }
}

// Initialize databases
initializeDatabases().catch(error => {
    console.error('Failed to initialize databases:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
});

// Routes
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Blog Review API',
        version: '1.0.0',
        status: 'running',
        endpoints: ['/api/blog-posts', '/api/health']
    });
});

app.get('/debug', (_req: Request, res: Response) => {
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
        }
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient?.isOpen ? 'connected' : 'disconnected'
        }
    });
});

// API routes
app.use('/api/blog-posts', blogPostRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    });
});

export default app; 