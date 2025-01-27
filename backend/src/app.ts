import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from './config/config';
import blogPostRoutes from './routes/blogPost';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://buildableblog.pro']
        : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if we can't connect to MongoDB
    });

// Initialize Redis only if URL is provided
if (config.redisUrl) {
    const redisClient = createClient({ url: config.redisUrl });
    redisClient.connect()
        .then(() => console.log('Connected to Redis'))
        .catch((err) => console.error('Redis connection error:', err));
}

// Debug route to check environment
app.get('/debug', (req, res) => {
    res.json({
        environment: process.env.NODE_ENV,
        mongoConnected: mongoose.connection.readyState === 1,
        corsOrigins: process.env.NODE_ENV === 'production' 
            ? ['https://buildableblog.pro']
            : ['http://localhost:3000']
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Blog Review API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        endpoints: {
            health: '/api/health',
            blogPosts: '/api/blog-posts',
            debug: '/debug'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongoConnected: mongoose.connection.readyState === 1
    });
});

// Routes
app.use('/api/blog-posts', blogPostRoutes);

// 404 handler
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: {
            root: '/',
            health: '/api/health',
            blogPosts: '/api/blog-posts',
            debug: '/debug'
        }
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        path: req.path,
        method: req.method
    });
});

export default app; 