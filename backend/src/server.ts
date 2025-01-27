import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import app from './app';
import config from './config';

const port = config.port;

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Initialize Redis
const redisClient = createClient({ url: config.redisUrl });
redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Redis connection error:', err));

// Basic health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
}); 