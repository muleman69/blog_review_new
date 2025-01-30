import { connectRedis } from './redis';
import { debugLog } from './debug';
import mongoose from 'mongoose';
import { config } from '../config/config';

export async function ensureDatabaseConnections(): Promise<void> {
    try {
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState !== 1) {
            if (!config.mongoUri) {
                throw new Error('MongoDB URI not configured');
            }
            await mongoose.connect(config.mongoUri);
            debugLog.db('MongoDB connected successfully');
        }

        // Connect to Redis if enabled
        if (config.redis.enabled) {
            await connectRedis();
        }
    } catch (error) {
        debugLog.error('database-connection', error as Error);
        throw error;
    }
} 