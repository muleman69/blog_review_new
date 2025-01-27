import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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
            
            await mongoose.connect(config.mongoUri, {
                ...config.mongodb,
                serverApi: {
                    version: '1',
                    strict: true,
                    deprecationErrors: true
                }
            });
            
            console.log('MongoDB connected successfully');
            
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
            });

        } catch (error) {
            console.error('MongoDB connection error:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
        }
    } else {
        console.log('No MongoDB URI provided, skipping connection');
    }

    // Redis connection
    if (config.redisUrl) {
        try {
            const sanitizedUrl = config.redisUrl.replace(/\/\/[^@]+@/, '//*****@');
            console.log('Attempting to connect to Redis...');
            console.log('Redis URL format:', sanitizedUrl);
            console.log('Redis connection options:', config.redis);

            redisClient = createClient({
                url: config.redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        console.log(`Redis reconnect attempt ${retries}`);
                        if (retries > config.redis.maxReconnectAttempts) {
                            console.error('Max Redis reconnection attempts reached');
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    },
                    connectTimeout: config.redis.connectTimeout
                }
            });

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err);
                console.error('Redis error details:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
            });

            redisClient.on('connect', () => {
                console.log('Redis client connected');
                console.log('Redis connection details:', {
                    isOpen: redisClient?.isOpen,
                    isReady: redisClient?.isReady
                });
            });

            redisClient.on('ready', () => console.log('Redis client ready for commands'));
            redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));
            redisClient.on('end', () => console.log('Redis client connection ended'));

            await redisClient.connect();
            console.log('Redis connection established successfully');
        } catch (err: any) {
            console.error('Redis connection error:', err);
            console.error('Redis connection failure details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            redisClient = null;
        }
    } else {
        console.log('Redis URL not provided, skipping connection');
    }
}

// Initialize databases
initializeDatabases();

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
            connected: redisClient?.isOpen || false
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