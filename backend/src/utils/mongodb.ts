import mongoose from 'mongoose';
import { debugLog } from './debug';

export async function connectMongoDB(uri: string): Promise<void> {
    try {
        const sanitizedUri = uri.replace(/\/\/[^@]+@/, '//*****@');
        debugLog.db('Attempting to connect to MongoDB...');
        debugLog.db('MongoDB URI format:', sanitizedUri);

        const options = {
            maxPoolSize: 10,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4
        };

        if (uri.includes('mongodb+srv')) {
            // Add Atlas-specific options
            Object.assign(options, {
                retryWrites: true,
                retryReads: true,
                ssl: true,
                tls: true
            });
        }

        mongoose.set('debug', process.env.NODE_ENV === 'development');
        
        await mongoose.connect(uri, options);
        debugLog.db('MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            debugLog.error('mongodb', err);
        });

        mongoose.connection.on('disconnected', () => {
            debugLog.db('MongoDB disconnected, attempting to reconnect...');
            mongoose.connect(uri, options).catch(err => {
                debugLog.error('mongodb', err);
            });
        });

        mongoose.connection.on('reconnected', () => {
            debugLog.db('MongoDB reconnected successfully');
        });

    } catch (error) {
        debugLog.error('mongodb', error);
        throw error; // Re-throw to be handled by the caller
    }
} 