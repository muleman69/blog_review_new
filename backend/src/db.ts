import mongoose from 'mongoose';
import { debugLog } from './utils/debug';

let isConnected = false;

export async function ensureDatabaseConnections() {
    if (isConnected) {
        debugLog.db('Using existing database connections');
        return;
    }

    try {
        debugLog.db('Initializing database connection...');
        
        const mongoUrl = process.env.MONGODB_URI;
        if (!mongoUrl) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(mongoUrl);
        isConnected = true;
        
        debugLog.db('Database connection established', {
            host: new URL(mongoUrl).host,
            database: new URL(mongoUrl).pathname.slice(1)
        });

        // Monitor connection events
        mongoose.connection.on('error', (error) => {
            debugLog.error('MongoDB connection error', error);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            debugLog.db('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            debugLog.db('MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        debugLog.error('Failed to connect to database', error);
        isConnected = false;
        throw error;
    }
} 