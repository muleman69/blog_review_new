import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from './config/config';

const app = express();

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

// Start server
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
}); 